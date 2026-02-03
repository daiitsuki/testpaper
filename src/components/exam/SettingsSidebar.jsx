import { Layout as LayoutIcon, Settings2, UserCheck, Plus } from 'lucide-react';

export default function SettingsSidebar({ 
  localConfig, 
  setLocalConfig, 
  isEditing, 
  onAddImage, 
  students, 
  onNavigateToWrongNote 
}) {
  return (
    <aside className="w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto">
      <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
        <Settings2 size={20} className="text-indigo-600" />
        상세 설정
      </h2>

      <div className="space-y-8">
        {isEditing && (
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-200 border-dashed rounded-xl cursor-pointer bg-white hover:bg-indigo-50 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Plus size={32} className="mb-2 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                <p className="mb-2 text-sm text-indigo-500 font-semibold">문제 추가하기</p>
                <p className="text-xs text-indigo-400">클릭하여 이미지 업로드</p>
              </div>
              <input type="file" className="hidden" multiple accept="image/*" onChange={onAddImage} />
            </label>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <LayoutIcon size={16} />
            단 구성
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['1column', '2column'].map(col => (
              <button 
                key={col}
                onClick={() => setLocalConfig(prev => ({ ...prev, layout: col }))}
                className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${localConfig?.layout === col ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
              >
                {col === '1column' ? '1단' : '2단'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <label className="text-sm font-bold text-slate-700">문제 간격</label>
            <span className="text-xs font-bold text-indigo-600">{localConfig?.spacing}px</span>
          </div>
          <input 
            type="range" min="0" max="300" step="5"
            value={localConfig?.spacing || 20}
            onChange={(e) => setLocalConfig(prev => ({ ...prev, spacing: Number(e.target.value) }))}
            className="w-full accent-indigo-600"
          />
        </div>

        {students && (
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <UserCheck size={16} />
              오답노트 생성 대상
            </h3>
            <div className="space-y-2">
              {students.map(({ student, existingNote }) => (
                <button
                  key={student.id}
                  onClick={() => onNavigateToWrongNote(student, existingNote)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all group ${existingNote ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold text-slate-800">{student.name}</div>
                    {existingNote && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <div className={`text-[10px] ${existingNote ? 'text-emerald-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                    {existingNote ? '생성됨 (상세보기) \u2192' : '오답노트 만들기 \u2192'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
