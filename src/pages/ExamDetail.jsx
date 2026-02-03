import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
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
  const [editedTitle, setEditedTitle] = useState('');

  const students = useLiveQuery(() => 
    exam ? db.students.where('classIds').equals(exam.classId).toArray() : []
  , [exam]);

  const existingWrongNotes = useLiveQuery(() => 
    db.wrongNotes.where('examId').equals(id).toArray()
  , [id]) || [];

  useEffect(() => {
    if (exam) {
      setLocalConfig(exam.config);
      setEditedTitle(exam.title);
      const urls = exam.images.map(img => ({
        ...img,
        url: URL.createObjectURL(img.file),
        scale: img.scale || 100 
      }));
      setImageUrls(urls);
      return () => urls.forEach(u => URL.revokeObjectURL(u.url));
    }
  }, [exam]);

  if (!exam || !localConfig) return <div className="p-8">로딩 중...</div>;

  const handlePrint = () => {
    printExam(editedTitle, imageUrls, localConfig);
  };

  const saveConfig = async () => {
    const updatedImages = imageUrls.map((img, index) => ({
      id: img.id,
      name: img.name,
      file: img.file,
      order: index,
      scale: img.scale 
    }));

    await db.exams.update(id, { 
      config: localConfig,
      title: editedTitle,
      images: updatedImages,
      updatedAt: new Date()
    });
    setIsEditing(false);
  };

  const deleteExam = async () => {
    if (confirm('이 시험지를 삭제하시겠습니까?')) {
      await db.exams.delete(id);
      navigate(`/class/${exam.classId}`);
    }
  };

  const handleAddImage = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      url: URL.createObjectURL(file),
      order: imageUrls.length,
      scale: 100
    }));
    setImageUrls(prev => [...prev, ...newImages]);
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

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <ExamHeader 
        title={editedTitle}
        isEditing={isEditing}
        onTitleChange={setEditedTitle}
        onBack={() => navigate(`/class/${exam.classId}`)}
        onSave={saveConfig}
        onEdit={() => setIsEditing(true)}
        onPrint={handlePrint}
        onDelete={deleteExam}
        deleteTooltip="시험지 삭제"
      />

      <div className="flex-1 flex overflow-hidden">
        <SettingsSidebar 
          localConfig={localConfig}
          setLocalConfig={setLocalConfig}
          isEditing={isEditing}
          onAddImage={handleAddImage}
          students={studentData}
          onNavigateToWrongNote={handleNavigateToWrongNote}
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