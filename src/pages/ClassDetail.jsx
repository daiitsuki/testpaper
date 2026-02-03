import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Plus, User, FileText, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const id = Number(classId);
  const [isManaging, setIsManaging] = useState(false);

  const cls = useLiveQuery(() => db.classes.get(id), [id]);
  const students = useLiveQuery(() => db.students.where('classIds').equals(id).toArray(), [id]) || [];
  const exams = useLiveQuery(() => db.exams.where('classId').equals(id).toArray(), [id]) || [];

  const allStudents = useLiveQuery(() => db.students.toArray()) || [];
  const studentsNotInClass = allStudents.filter(s => !s.classIds.includes(id));

  const addStudent = async () => {
    const name = prompt('새 학생 이름을 입력하세요:');
    if (name) {
      await db.students.add({ name, classIds: [id] });
    }
  };

  const addExistingStudent = async (studentId) => {
    const student = await db.students.get(Number(studentId));
    if (student) {
      await db.students.update(student.id, {
        classIds: [...new Set([...student.classIds, id])]
      });
    }
  };

  const deleteClass = async () => {
    if (confirm('이 클래스를 삭제하시겠습니까? 관련 데이터가 삭제될 수 있습니다.')) {
      await db.classes.delete(id);
      navigate('/');
    }
  };

  if (!cls) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{cls.name}</h1>
          <p className="text-slate-500">클래스 관리 및 시험지 목록</p>
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
            <button onClick={deleteClass} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Students List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User size={20} className="text-indigo-500" />
              학생 목록 ({students.length})
            </h2>
            <div className="flex gap-1">
              {studentsNotInClass.length > 0 && (
                <select 
                  onChange={(e) => addExistingStudent(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                  value=""
                >
                  <option value="" disabled>기존 학생 추가</option>
                  {studentsNotInClass.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <button onClick={addStudent} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="새 학생 추가">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {students.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">등록된 학생이 없습니다.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.map(student => (
                  <Link 
                    key={student.id} 
                    to={`/student/${student.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {student.name[0]}
                    </div>
                    <span className="font-medium text-slate-700">{student.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exams List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              시험지 목록 ({exams.length})
            </h2>
            <Link to={`/exam/new?classId=${id}`} className="text-sm text-indigo-600 font-medium hover:underline">
              새 시험지
            </Link>
          </div>
          
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
              <FileText size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 mb-6">아직 생성된 시험지가 없습니다.</p>
              <Link 
                to={`/exam/new?classId=${id}`} 
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                첫 시험지 만들기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map(exam => (
                <Link 
                  key={exam.id} 
                  to={`/exam/${exam.id}`}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 truncate">{exam.title}</h3>
                  <p className="text-sm text-slate-500">{exam.images.length}개의 문제 포함</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}