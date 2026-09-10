import {
  Layout as LayoutIcon,
  Settings2,
  UserCheck,
  Plus,
  AlertTriangle,
  FilePlus,
  Users,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

function SortableSimpleItem({ img, idx, onImageUpdate, showScore = true, showDifficulty = true }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 group"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 hover:bg-white rounded text-slate-300 hover:text-indigo-600 transition-colors"
        >
          <GripVertical size={16} />
        </div>
        <span className="w-6 text-center font-bold text-slate-400 text-sm">
          {idx + 1}
        </span>
        <input
          type="text"
          value={img.answer || ""}
          onChange={(e) => onImageUpdate(img.id, { answer: e.target.value })}
          placeholder="정답"
          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        {showScore && (
          <input
            type="number"
            value={img.score === 0 ? "0" : (img.score || "")}
            onChange={(e) =>
              onImageUpdate(img.id, { score: e.target.value === '' ? '' : Number(e.target.value) })
            }
            placeholder="자동"
            className="w-12 bg-white border border-slate-200 rounded-lg px-1 py-1 text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        )}
      </div>
      <div className="flex items-center gap-2 pl-8">
        <select
          value={img.badge || ""}
          onChange={(e) => onImageUpdate(img.id, { badge: e.target.value })}
          className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
        >
          <option value="">배지 없음</option>
          <option value="기본">기본</option>
          <option value="심화">심화</option>
          <option value="발전">발전</option>
          {img.badge && !["기본", "심화", "발전", ""].includes(img.badge) && (
            <option value={img.badge}>{img.badge}</option>
          )}
        </select>
        {showDifficulty && (
          <select
            value={img.difficulty || 1}
            onChange={(e) => onImageUpdate(img.id, { difficulty: Number(e.target.value) })}
            className="w-16 bg-white border border-slate-200 rounded-lg px-1 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value={1}>★ 1</option>
            <option value={2}>★ 2</option>
            <option value={3}>★ 3</option>
          </select>
        )}
        <input
          type="text"
          value={img.questionId || ""}
          onChange={(e) => onImageUpdate(img.id, { questionId: e.target.value })}
          placeholder="문제 ID"
          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
}

export default function SettingsSidebar({
  localConfig,
  setLocalConfig,
  isEditing,
  onAddImage,
  students,
  onNavigateToWrongNote,
  totalScore,
  onAutoDistribute,
  onCreateNewWrongNote,
  allClasses,
  selectedClassId,
  onClassChange,
  isSimpleEditing,
  images,
  onImageUpdate,
  onReorder,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Mock the event structure to pass it to onAddImage which expects e.target.files
      const mockEvent = {
        target: {
          files: e.dataTransfer.files
        }
      };
      onAddImage(mockEvent);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      if (onReorder) onReorder(oldIndex, newIndex);
    }
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto">
      <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
        <Settings2 size={20} className="text-indigo-600" />
        {isSimpleEditing ? "간단 편집" : "상세 설정"}
      </h2>

      <div className="space-y-8">
        {isSimpleEditing && !isEditing && images && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              <span className="w-16 text-center">번호</span>
              <span className="flex-1 px-4 text-center">정답</span>
              {!(localConfig?.template === "jschool" && localConfig?.showScore === false) && (
                <span className="w-12 text-center">배점</span>
              )}
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((img) => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {images.map((img, idx) => (
                    <SortableSimpleItem
                      key={img.id}
                      img={img}
                      idx={idx}
                      onImageUpdate={onImageUpdate}
                      showScore={!(localConfig?.template === "jschool" && localConfig?.showScore === false)}
                      showDifficulty={!(localConfig?.template === "jschool" && localConfig?.showDifficulty === false)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {!(localConfig?.template === "jschool" && localConfig?.showScore === false) && (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center px-2">
                <span className="text-sm font-bold text-slate-600">총점</span>
                <span
                  className={`text-lg font-black ${totalScore === 100 ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {totalScore}점
                </span>
              </div>
            )}
          </div>
        )}

        {!isSimpleEditing && (
          <>
            {isEditing && allClasses && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Users size={16} /> 클래스 이동
                </label>
                <select
                  value={selectedClassId || ""}
                  onChange={(e) => onClassChange(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  {allClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onCreateNewWrongNote && !isEditing && (
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <button
                  onClick={onCreateNewWrongNote}
                  className="w-full flex flex-col items-center justify-center gap-2 py-4 text-indigo-600 hover:bg-indigo-100/50 rounded-xl transition-colors"
                >
                  <FilePlus size={24} />
                  <span className="font-bold text-sm">
                    오답노트 추가 생성하기
                  </span>
                  <span className="text-xs text-indigo-400">
                    같은 시험지로 새 오답노트 만들기
                  </span>
                </button>
              </div>
            )}

            {onAutoDistribute && !(localConfig?.template === "jschool" && localConfig?.showScore === false) && totalScore !== 100 && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={20}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-bold text-amber-800 mb-1">
                      총점 주의 ({totalScore}점)
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      현재 총점이 100점이 아닙니다. 아래 버튼을 클릭하여 점수를
                      자동으로 재분배할 수 있습니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onAutoDistribute}
                  className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-sm font-bold transition-colors shadow-sm border border-amber-200"
                >
                  점수 자동 재분배
                </button>
              </div>
            )}

            {isEditing && (
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <label 
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors group ${
                    isDragOver 
                      ? 'border-indigo-500 bg-indigo-100' 
                      : 'border-indigo-200 bg-white hover:bg-indigo-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                    <Plus
                      size={32}
                      className={`mb-2 transition-colors ${isDragOver ? 'text-indigo-600' : 'text-indigo-400 group-hover:text-indigo-600'}`}
                    />
                    <p className={`mb-2 text-sm font-semibold ${isDragOver ? 'text-indigo-700' : 'text-indigo-500'}`}>
                      문제 추가하기
                    </p>
                    <p className={`text-xs ${isDragOver ? 'text-indigo-500' : 'text-indigo-400'}`}>
                      클릭하거나 이미지를 여기로 드래그
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={onAddImage}
                  />
                </label>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <LayoutIcon size={16} />템플릿 선택
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "default", label: "기본 템플릿" },
                  { id: "jschool", label: "J SCHOOL EDU" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() =>
                      setLocalConfig((prev) => ({ ...prev, template: tpl.id }))
                    }
                    className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${(localConfig?.template || 'default') === tpl.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 text-slate-500 hover:border-slate-200"}`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {localConfig?.template === "jschool" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">주차 표시</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={localConfig?.showWeek !== false}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, showWeek: e.target.checked }))}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {localConfig?.showWeek !== false && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      주차 (Week)
                    </label>
                    <input
                      type="text"
                      value={localConfig?.weekNumber || "01"}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          weekNumber: e.target.value,
                        }))
                      }
                      placeholder="예: 01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-bold text-slate-700">일자 표시</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={localConfig?.showDate !== false}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, showDate: e.target.checked }))}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {localConfig?.showDate !== false && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      일자 (Date)
                    </label>
                    <input
                      type="text"
                      value={localConfig?.date !== undefined ? localConfig.date : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/ /g, '')}
                      onChange={(e) =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      placeholder="예: 2026.09.10"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-bold text-slate-700">점수제도</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={localConfig?.showScore !== false}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, showScore: e.target.checked }))}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-bold text-slate-700">난이도</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={localConfig?.showDifficulty !== false}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, showDifficulty: e.target.checked }))}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700">정답표 위치</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLocalConfig(prev => ({ ...prev, answerKeyLocation: 'separate' }))}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${localConfig?.answerKeyLocation !== 'bottom' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  새 페이지 분리
                </button>
                <button
                  onClick={() => setLocalConfig(prev => ({ ...prev, answerKeyLocation: 'bottom' }))}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${localConfig?.answerKeyLocation === 'bottom' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  문항 하단 이어서
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <LayoutIcon size={16} />단 구성
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["1column", "2column"].map((col) => (
                  <button
                    key={col}
                    onClick={() =>
                      setLocalConfig((prev) => ({ ...prev, layout: col }))
                    }
                    className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${localConfig?.layout === col ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 text-slate-500 hover:border-slate-200"}`}
                  >
                    {col === "1column" ? "1단" : "2단"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-700">
                  문제 간격
                </label>
                <span className="text-xs font-bold text-indigo-600">
                  {localConfig?.spacing}px
                </span>
              </div>
              <div className="text-xs text-slate-700">
                ⓘ 슬라이더를 조절 후 마우스를 때면 문제의 위치가 a4 사이즈에
                맞게 재조정됩니다.
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={localConfig?.spacing || 20}
                onChange={(e) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    spacing: Number(e.target.value),
                  }))
                }
                className="w-full accent-indigo-600"
              />
            </div>

            {students && !isEditing && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <UserCheck size={16} />
                  오답노트 생성 대상
                </h3>
                <div className="space-y-2">
                  {students.map(({ student, existingNote }) => (
                    <button
                      key={student.id}
                      onClick={() =>
                        onNavigateToWrongNote(student, existingNote)
                      }
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all group ${existingNote ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-800">
                          {student.name}
                        </div>
                        {existingNote && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div
                        className={`text-[10px] ${existingNote ? "text-emerald-600" : "text-slate-400 group-hover:text-indigo-500"}`}
                      >
                        {existingNote
                          ? "생성됨 (상세보기) \u2192"
                          : "오답노트 만들기 \u2192"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}