import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ListPlus, FileText } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import { db } from '../db/db';
import { printExam, downloadExamPdf } from '../utils/printHelper';
import ExamHeader from '../components/exam/ExamHeader';
import SettingsSidebar from '../components/exam/SettingsSidebar';
import ExamPreview from '../components/exam/ExamPreview';

export default function WrongNoteDetail() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const id = Number(noteId);

  const note = useLiveQuery(() => db.wrongNotes.get(id), [id]);
  const student = useLiveQuery(() => 
    note ? db.students.get(note.studentId) : null
  , [note]);

  const [localConfig, setLocalConfig] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [isSimpleEditing, setIsSimpleEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const urlsRef = useRef([]);
  const isInitializedRef = useRef(false);
  const lastSavedRef = useRef(null);
  const pendingPayloadRef = useRef(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (note && !isInitializedRef.current) {
      setLocalConfig(note.config);
      setEditedTitle(note.title);
      
      const loadImages = async () => {
        const originalExam = await db.exams.get(note.examId);
        let needsMigration = false;
        
        const urls = note.images.map(img => {
          let file = img.file;
          if (file) needsMigration = true; // DB에 file 객체가 통째로 남아있는 옛날 포맷
          
          let latestMeta = {};

          if (originalExam) {
            const originalImg = originalExam.images.find(e => e.id === img.id);
            if (originalImg) {
              file = originalImg.file;
              // 동기화를 위해 원본의 최신 메타데이터를 우선 반영 (단, 오답노트 전용 설정 제외)
              latestMeta = {
                answer: originalImg.answer,
                badge: originalImg.badge,
                difficulty: originalImg.difficulty,
                score: originalImg.score,
              };
            }
          }
          
          if (!file) {
            console.error("Could not find file for image id", img.id);
          }

          const url = file ? URL.createObjectURL(file) : null;
          if (url) urlsRef.current.push(url);
          
          return {
            ...img,          // 오답노트의 기존 저장값 (scale, order 등)
            ...latestMeta,   // 원본 시험지의 최신 메타데이터로 덮어쓰기
            url,
            file,
            scale: img.scale || 100
          };
        });
        setImageUrls(urls);
        isInitializedRef.current = true;

        // "들어가기만 해도" 무거운 오답노트를 가볍게 마이그레이션 (DB에서 file 삭제)
        if (needsMigration) {
          const migratedImages = urls.map(img => {
            const cleanImg = { ...img };
            delete cleanImg.url;
            delete cleanImg.file;
            return cleanImg;
          });
          db.wrongNotes.update(id, { images: migratedImages });
          console.log(`WrongNote ${id}: Migrated to light format`);
        }
      };

      loadImages();
    }
  }, [note]);

  // Real-time auto-save effect
  useEffect(() => {
    if (!isInitializedRef.current || !note) return;

    const payload = {
      title: editedTitle,
      config: localConfig,
      images: imageUrls.map((img, index) => {
        const newImg = { ...img, order: index };
        delete newImg.url;
        delete newImg.file; // MUST delete file before saving to prevent DB bloat
        return newImg;
      })
    };

    const payloadHash = JSON.stringify(payload);

    if (lastSavedRef.current === null) {
      lastSavedRef.current = payloadHash;
      return;
    }

    if (lastSavedRef.current === payloadHash) {
      return;
    }

    setSaveStatus('saving');
    pendingPayloadRef.current = payload;

    const timer = setTimeout(async () => {
      try {
        await db.wrongNotes.update(id, {
          title: payload.title,
          config: payload.config,
          images: payload.images
        });
        lastSavedRef.current = payloadHash;
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [id, editedTitle, localConfig, imageUrls, note]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (pendingPayloadRef.current && lastSavedRef.current !== JSON.stringify(pendingPayloadRef.current)) {
        db.wrongNotes.update(id, {
          title: pendingPayloadRef.current.title,
          config: pendingPayloadRef.current.config,
          images: pendingPayloadRef.current.images
        }).catch(console.error);
      }
    };
  }, [id]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u));
    };
  }, []);

  const handleImageUpdate = useCallback((id, updates) => {
    setImageUrls(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  }, []);

  const handleReorder = useCallback((oldIndex, newIndex) => {
    setImageUrls((items) => {
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const handleChangeQuestions = () => {
    navigate(`/wrong-note/edit/${id}`);
  };

  const deleteNote = async () => {
    if (confirm('이 오답노트를 삭제하시겠습니까?')) {
      pendingPayloadRef.current = null;
      await db.wrongNotes.delete(id);
      navigate(`/student/${note.studentId}`);
    }
  };

  const handleDeleteImage = useCallback((imageId) => {
    if (confirm('이 문제를 삭제하시겠습니까?')) {
      setImageUrls(prev => {
        const target = prev.find(img => img.id === imageId);
        if (target?.url) {
          URL.revokeObjectURL(target.url);
        }
        return prev.filter(img => img.id !== imageId);
      });
    }
  }, []);

  const handleImageScale = useCallback((id, newScale) => {
    setImageUrls(prev => prev.map(img => 
      img.id === id ? { ...img, scale: Number(newScale) } : img
    ));
  }, []);
  
  const handleAddImage = () => {
     // Optional: Implement adding images to wrong note if requested later
  };

  if (!note || !localConfig) return <div className="p-8">로딩 중...</div>;

  const handlePrint = () => {
    printExam(editedTitle, imageUrls, localConfig);
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadExamPdf(editedTitle);
    } catch (err) {
      console.error('PDF 다운로드 실패:', err);
      alert('PDF 다운로드 중 오류가 발생했습니다: ' + (err?.message || '알 수 없는 오류'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCreateNewWrongNote = () => {
    navigate(`/wrong-note/new/${note.studentId}/${note.examId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <ExamHeader 
        title={editedTitle}
        subtitle={student ? `학생: ${student.name}` : ''}
        isSimpleEditing={isSimpleEditing}
        saveStatus={saveStatus}
        onTitleChange={setEditedTitle}
        onBack={() => navigate(`/student/${note.studentId}`)}
        onToggleSimpleEdit={() => setIsSimpleEditing(prev => !prev)}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
        extraActions={
          !isSimpleEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/exam/${note.examId}`)}
                className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                <FileText size={18} />
                원본 시험지
              </button>
              <button
                onClick={handleChangeQuestions}
                className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
              >
                <ListPlus size={18} />
                문제 변경
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <SettingsSidebar 
          localConfig={localConfig}
          setLocalConfig={setLocalConfig}
          isSimpleEditing={isSimpleEditing}
          onAddImage={handleAddImage}
          onCreateNewWrongNote={handleCreateNewWrongNote}
          images={imageUrls}
          onImageUpdate={handleImageUpdate}
          onReorder={handleReorder}
        />

        <ExamPreview 
          title={editedTitle}
          config={localConfig}
          images={imageUrls}
          onImageScale={handleImageScale}
          onImageDelete={handleDeleteImage}
          onImageUpdate={handleImageUpdate}
          onReorder={handleReorder}
        />
      </div>
    </div>
  );
}
