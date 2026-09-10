import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { arrayMove } from '@dnd-kit/sortable';
import { db } from '../db/db';
import { printExam } from '../utils/printHelper';
import ExamHeader from '../components/exam/ExamHeader';
import SettingsSidebar from '../components/exam/SettingsSidebar';
import ExamPreview from '../components/exam/ExamPreview';

export default function ExamDetail() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const id = Number(examId);

  const exam = useLiveQuery(() => db.exams.get(id), [id]);
  const [localConfig, setLocalConfig] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSimpleEditing, setIsSimpleEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');

  const allClasses = useLiveQuery(() => db.classes.toArray()) || [];

  const students = useLiveQuery(() => 
    exam ? db.students.where('classIds').equals(exam.classId).toArray() : []
  , [exam]);

  const existingWrongNotes = useLiveQuery(() => 
    db.wrongNotes.where('examId').equals(id).toArray()
  , [id]) || [];

  const urlsRef = useRef([]);
  const isInitializedRef = useRef(false);
  const lastSavedRef = useRef(null);
  const pendingPayloadRef = useRef(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (exam && !isInitializedRef.current) {
      setLocalConfig(exam.config);
      setEditedTitle(exam.title);
      setSelectedClassId(exam.classId);
      const urls = exam.images.map(img => {
        const url = URL.createObjectURL(img.file);
        urlsRef.current.push(url);
        return {
          ...img,
          url,
          scale: img.scale || 100 
        };
      });
      setImageUrls(urls);
      isInitializedRef.current = true;
    }
  }, [exam]);

  // Real-time auto-save effect
  useEffect(() => {
    if (!isInitializedRef.current || !exam) return;

    const payload = {
      title: editedTitle,
      config: localConfig,
      classId: selectedClassId,
      images: imageUrls.map((img, index) => {
        const { url, ...rest } = img;
        return { ...rest, order: index };
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
        await db.exams.update(id, {
          title: payload.title,
          config: payload.config,
          classId: payload.classId,
          images: payload.images,
          updatedAt: new Date()
        });
        lastSavedRef.current = payloadHash;
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [id, editedTitle, localConfig, selectedClassId, imageUrls, exam]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (pendingPayloadRef.current && lastSavedRef.current !== JSON.stringify(pendingPayloadRef.current)) {
        db.exams.update(id, {
          title: pendingPayloadRef.current.title,
          config: pendingPayloadRef.current.config,
          classId: pendingPayloadRef.current.classId,
          images: pendingPayloadRef.current.images,
          updatedAt: new Date()
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

  const handlePrint = () => {
    printExam(editedTitle, imageUrls, localConfig);
  };

  const distributeScores = (items) => {
    const totalScore = 100;
    let currentTotal = 0;
    let unassignedCount = 0;
    items.forEach(img => {
      const s = img.score;
      if (s !== null && s !== undefined && s !== '' && !isNaN(s)) {
        currentTotal += Number(s);
      } else {
        unassignedCount++;
      }
    });

    if (unassignedCount === 0) return items;

    const remainingScore = totalScore - currentTotal;
    if (remainingScore <= 0) {
      return items.map(img => {
        const s = img.score;
        return {
          ...img,
          score: (s !== null && s !== undefined && s !== '' && !isNaN(s)) ? Number(s) : 0
        };
      });
    }

    const baseScore = Math.floor(remainingScore / unassignedCount);
    const remainder = remainingScore % unassignedCount;
    let remainderCount = remainder;

    return items.map(img => {
      const s = img.score;
      if (s !== null && s !== undefined && s !== '' && !isNaN(s)) return img;
      let newScore = baseScore;
      if (remainderCount > 0) {
        newScore += 1;
        remainderCount--;
      }
      return { ...img, score: newScore };
    });
  };

  const deleteExam = async () => {
    if (confirm('이 시험지를 삭제하시겠습니까?')) {
      pendingPayloadRef.current = null;
      await db.exams.delete(id);
      navigate(`/class/${exam.classId}`);
    }
  };

  const handleAddImage = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      return {
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        name: file.name,
        url,
        order: imageUrls.length,
        scale: 100
      };
    });
    setImageUrls(prev => [...prev, ...newImages]);
  };

  const handleDeleteImage = useCallback((imageId) => {
    if (confirm('이 문제를 삭제하시겠습니까?')) {
      setImageUrls(prev => prev.filter(img => img.id !== imageId));
    }
  }, []);

  const handleImageScale = useCallback((id, newScale) => {
    setImageUrls(prev => prev.map(img => 
      img.id === id ? { ...img, scale: Number(newScale) } : img
    ));
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

  const handleAutoDistribute = useCallback(async () => {
    if (!confirm('문항들의 점수를 모두 초기화하고 100점에 맞춰 균등하게 재분배하시겠습니까? 저장도 함께 진행됩니다.')) return;

    // Reset all scores to empty string to force redistribution
    const resetImages = imageUrls.map(img => ({ ...img, score: '' }));
    const scoredImages = distributeScores(resetImages);
    
    const updatedImages = scoredImages.map((img, index) => ({
      id: img.id,
      name: img.name,
      file: img.file,
      order: index,
      scale: img.scale,
      answer: img.answer,
      score: img.score
    }));

    await db.exams.update(id, { 
      images: updatedImages,
      updatedAt: new Date()
    });

    setImageUrls(prev => prev.map(img => {
      const updated = scoredImages.find(s => s.id === img.id);
      return updated ? { ...img, score: updated.score } : img;
    }));

    alert('점수가 자동으로 재분배되어 저장되었습니다.');
  }, [id, imageUrls]);

  const studentData = students?.map(student => ({
    student,
    existingNote: existingWrongNotes.find(n => n.studentId === student.id)
  }));

  const handleNavigateToWrongNote = (student, existingNote) => {
    if (existingNote) {
      navigate(`/exam/wrong/${existingNote.id}`);
    } else {
      navigate(`/wrong-note/new/${student.id}/${exam.id}`);
    }
  };

  const totalScore = imageUrls.reduce((sum, img) => sum + (Number(img.score) || 0), 0);

  const currentClass = exam && allClasses ? allClasses.find(c => c.id === exam.classId) : null;

  if (!exam || !localConfig) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <ExamHeader 
        title={editedTitle}
        subtitle={currentClass ? `클래스: ${currentClass.name}` : ''}
        isEditing={isEditing}
        isSimpleEditing={isSimpleEditing}
        saveStatus={saveStatus}
        onTitleChange={setEditedTitle}
        onBack={() => navigate(`/class/${exam.classId}`)}
        onEdit={() => {
          setIsEditing(prev => !prev);
          if (!isEditing) setIsSimpleEditing(false);
        }}
        onToggleSimpleEdit={() => {
          setIsSimpleEditing(prev => !prev);
          if (!isSimpleEditing) setIsEditing(false);
        }}
        onPrint={handlePrint}
        onDelete={deleteExam}
        deleteTooltip="시험지 삭제"
      />

      <div className="flex-1 flex overflow-hidden">
        <SettingsSidebar 
          localConfig={localConfig}
          setLocalConfig={setLocalConfig}
          isEditing={isEditing}
          isSimpleEditing={isSimpleEditing}
          onAddImage={handleAddImage}
          students={studentData}
          onNavigateToWrongNote={handleNavigateToWrongNote}
          totalScore={totalScore}
          onAutoDistribute={handleAutoDistribute}
          allClasses={allClasses}
          selectedClassId={selectedClassId}
          onClassChange={setSelectedClassId}
          images={imageUrls}
          onImageUpdate={handleImageUpdate}
          onReorder={handleReorder}
        />

        <ExamPreview 
          title={editedTitle}
          config={localConfig}
          images={imageUrls}
          isEditing={isEditing}
          onImageScale={handleImageScale}
          onImageDelete={handleDeleteImage}
          onImageUpdate={handleImageUpdate}
          onReorder={handleReorder}
        />
      </div>
    </div>
  );
}