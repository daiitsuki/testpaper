import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ListPlus, FileText } from 'lucide-react';
import { db } from '../db/db';
import { printExam } from '../utils/printHelper';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    if (note) {
      setLocalConfig(note.config);
      setEditedTitle(note.title);
      const urls = note.images.map(img => ({
        ...img,
        url: URL.createObjectURL(img.file),
        scale: img.scale || 100
      }));
      setImageUrls(urls);
      return () => urls.forEach(u => URL.revokeObjectURL(u.url));
    }
  }, [note]);

  if (!note || !localConfig) return <div className="p-8">로딩 중...</div>;

  const handlePrint = () => {
    printExam(editedTitle, imageUrls, localConfig);
  };

  const handleChangeQuestions = () => {
    navigate(`/wrong-note/edit/${id}`);
  };

  const saveConfig = async () => {
    const updatedImages = imageUrls.map((img, index) => ({
      id: img.id,
      name: img.name,
      file: img.file,
      order: index,
      scale: img.scale
    }));

    await db.wrongNotes.update(id, { 
      config: localConfig,
      title: editedTitle,
      images: updatedImages
    });
    setIsEditing(false);
  };

  const deleteNote = async () => {
    if (confirm('이 오답노트를 삭제하시겠습니까?')) {
      await db.wrongNotes.delete(id);
      navigate(`/student/${note.studentId}`);
    }
  };

  const handleDeleteImage = (imageId) => {
    if (confirm('이 문제를 삭제하시겠습니까?')) {
      setImageUrls(prev => prev.filter(img => img.id !== imageId));
    }
  };

  const handleImageScale = (id, newScale) => {
    setImageUrls(prev => prev.map(img => 
      img.id === id ? { ...img, scale: Number(newScale) } : img
    ));
  };
  
  // Note: Wrong notes generally don't add new images, so we pass a no-op or undefined for onAddImage if we strictly don't want it.
  // Or we could implement it if desired. For now, I'll assume we stick to the existing scope where wrong notes edit existing selections.
  const handleAddImage = (e) => {
     // Optional: Implement adding images to wrong note if requested later
  };

  const handleCreateNewWrongNote = () => {
    navigate(`/wrong-note/new/${note.studentId}/${note.examId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <ExamHeader 
        title={editedTitle}
        subtitle={student ? `학생: ${student.name}` : ''}
        isEditing={isEditing}
        onTitleChange={setEditedTitle}
        onBack={() => navigate(`/student/${note.studentId}`)}
        onSave={saveConfig}
        onEdit={() => setIsEditing(true)}
        onPrint={handlePrint}
        onDelete={deleteNote}
        deleteTooltip="오답노트 삭제"
        extraActions={
          !isEditing && (
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
          isEditing={isEditing}
          onAddImage={handleAddImage}
          onCreateNewWrongNote={handleCreateNewWrongNote}
        />

        <ExamPreview 
          title={editedTitle}
          config={localConfig}
          images={imageUrls}
          isEditing={isEditing}
          onImageScale={handleImageScale}
          onImageDelete={handleDeleteImage}
        />
      </div>
    </div>
  );
}