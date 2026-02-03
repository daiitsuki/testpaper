import { Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Plus, Users, FileText, ChevronRight, Home as HomeIcon } from 'lucide-react';

export default function Layout() {
  const classes = useLiveQuery(() => db.classes.toArray()) || [];
  const navigate = useNavigate();
  const { classId } = useParams();

  const addClass = async () => {
    const name = prompt('새 반 이름을 입력하세요:');
    if (name) {
      await db.classes.add({ name });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Hidden on print */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col no-print">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <FileText size={28} />
            <span>시험지 마스터</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">클래스 관리</h3>
              <button onClick={addClass} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              <Link 
                to="/" 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${!classId ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <HomeIcon size={18} />
                <span>대시보드</span>
              </Link>
              {classes.map(cls => (
                <Link
                  key={cls.id}
                  to={`/class/${cls.id}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${Number(classId) === cls.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Users size={18} className="shrink-0" />
                    <span className="truncate">{cls.name}</span>
                  </div>
                  <ChevronRight size={14} className="shrink-0 opacity-50" />
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => navigate('/exam/new')}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            <span>시험지 만들기</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
