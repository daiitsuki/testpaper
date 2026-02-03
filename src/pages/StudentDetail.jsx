import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useState } from 'react';
import { ChevronLeft, User, FileText, Printer, Trash2, Calendar, Settings } from 'lucide-react';

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const id = Number(studentId);
  const [isManaging, setIsManaging] = useState(false);

  const student = useLiveQuery(() => db.students.get(id), [id]);
  const classes = useLiveQuery(() => 
    student ? db.classes.where('id').anyOf(student.classIds).toArray() : []
  , [student]);
  const wrongNotes = useLiveQuery(() => db.wrongNotes.where('studentId').equals(id).toArray(), [id]) || [];

  if (!student) return <div className="p-8">로딩 중...</div>;

  const handleBack = () => {
    if (student.classIds && student.classIds.length > 0) {
      navigate(`/class/${student.classIds[0]}`);
    } else {
      navigate('/');
    }
  };

  const removeFromClass = async (classId) => {
    if (confirm('이 반에서 학생을 제외하시겠습니까?')) {
      const newClassIds = student.classIds.filter(cid => cid !== classId);
      if (newClassIds.length === 0) {
        if (confirm('소속된 반이 없게 됩니다. 학생 정보를 완전히 삭제하시겠습니까?')) {
          await deleteStudent();
          return;
        }
      }
      await db.students.update(id, { classIds: newClassIds });
    }
  };

  const deleteStudent = async () => {
    if (confirm('이 학생 정보를 삭제하시겠습니까? 관련 오답노트도 모두 삭제됩니다.')) {
      await db.students.delete(id);
      await db.wrongNotes.where('studentId').equals(id).delete();
      navigate('/');
    }
  };

  const deleteNote = async (noteId) => {
    if (confirm('이 오답노트를 삭제하시겠습니까?')) {
      await db.wrongNotes.delete(noteId);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft size={20} />
        뒤로가기
      </button>

      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-bold">
            {student.name[0]}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{student.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {classes.map(cls => (
                <span key={cls.id} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                  {cls.name}
                  {isManaging && (
                    <button onClick={() => removeFromClass(cls.id)} className="hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isManaging ? (
            <button onClick={() => setIsManaging(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors">
              완료
            </button>
          ) : (
            <button onClick={() => setIsManaging(true)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          )}
          {isManaging && (
            <button onClick={deleteStudent} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText size={22} className="text-indigo-500" />
          저장된 오답노트 ({wrongNotes.length})
        </h2>

        {wrongNotes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FileText size={32} />
            </div>
            <p className="text-slate-500">아직 생성된 오답노트가 없습니다.</p>
            <p className="text-sm text-slate-400 mt-1">시험지 상세 페이지에서 학생별로 오답노트를 만들 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wrongNotes.map(note => (
              <div 
                key={note.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="오답노트 삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{note.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>문제 {note.images.length}개</span>
                </div>
                
                <button 
                  onClick={() => navigate(`/exam/wrong/${note.id}`)}
                  className="w-full mt-6 py-2.5 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 rounded-xl text-sm font-bold transition-all"
                >
                  상세보기 및 인쇄
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
