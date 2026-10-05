import {
  Layout as LayoutIcon,
  Settings2,
  UserCheck,
  Plus,
  AlertTriangle,
  FilePlus,
  Users,
  GripVertical,
  ChevronDown,
  ChevronRight,
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

function SortableSimpleItem({
  img,
  idx,
  onImageUpdate,
  showScore = true,
  showDifficulty = true,
}) {
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
            value={img.score === 0 ? "0" : img.score || ""}
            onChange={(e) =>
              onImageUpdate(img.id, {
                score: e.target.value === "" ? "" : Number(e.target.value),
              })
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
            onChange={(e) =>
              onImageUpdate(img.id, { difficulty: Number(e.target.value) })
            }
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
          onChange={(e) =>
            onImageUpdate(img.id, { questionId: e.target.value })
          }
          placeholder="문제 ID"
          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
}


const AccordionSection = ({ id, isExpanded, onToggle, title, icon: Icon, children }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-left group outline-none transition-colors ${
          isExpanded
            ? "bg-slate-50/80 border-b border-slate-100"
            : "hover:bg-slate-50"
        }`}
      >
        <div
          className={`flex items-center gap-3 font-bold text-sm transition-colors ${
            isExpanded
              ? "text-indigo-700"
              : "text-slate-700 group-hover:text-indigo-600"
          }`}
        >
          {Icon && (
            <Icon
              size={18}
              className={
                isExpanded
                  ? "text-indigo-500"
                  : "text-slate-400 group-hover:text-indigo-400"
              }
            />
          )}
          {title}
        </div>
        <div
          className={`transition-transform duration-200 ${
            isExpanded
              ? "text-indigo-400 rotate-180"
              : "text-slate-300 group-hover:text-indigo-400"
          }`}
        >
          <ChevronDown size={18} />
        </div>
      </button>
      {isExpanded && (
        <div className="p-5 space-y-6 animate-in slide-in-from-top-1 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
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

  const [expandedSections, setExpandedSections] = useState({
    manage: false,
    questions: false,
    layout: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };


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
          files: e.dataTransfer.files,
        },
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
    <aside className="w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto scrollbar-stable">
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
              {!(
                localConfig?.template === "jschool" &&
                localConfig?.showScore === false
              ) && <span className="w-12 text-center">배점</span>}
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
                      showScore={
                        !(
                          localConfig?.template === "jschool" &&
                          localConfig?.showScore === false
                        )
                      }
                      showDifficulty={
                        !(
                          localConfig?.template === "jschool" &&
                          localConfig?.showDifficulty === false
                        )
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {!(
              localConfig?.template === "jschool" &&
              localConfig?.showScore === false
            ) && (
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
          <div className="space-y-6">
            {/* 3. 레이아웃 및 템플릿 */}
            <AccordionSection id="layout" isExpanded={expandedSections["layout"]} onToggle={() => toggleSection("layout")}
              title="레이아웃 및 템플릿"
              icon={LayoutIcon}
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  템플릿
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "default", label: "기본 양식" },
                    { id: "jschool", label: "J SCHOOL" },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          template: tpl.id,
                        }))
                      }
                      className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                        (localConfig?.template || "default") === tpl.id
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {localConfig?.template === "jschool" && (
                <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden mt-3">
                  <div className="divide-y divide-slate-100">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">
                          주차 표시
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={localConfig?.showWeek !== false}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({
                                ...prev,
                                showWeek: e.target.checked,
                              }))
                            }
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                      </div>
                      {localConfig?.showWeek !== false && (
                        <input
                          type="text"
                          value={localConfig?.weekNumber || "01"}
                          onChange={(e) =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              weekNumber: e.target.value,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                          placeholder="예: 01"
                        />
                      )}
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">
                          일자 표시
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={localConfig?.showDate !== false}
                            onChange={(e) =>
                              setLocalConfig((prev) => ({
                                ...prev,
                                showDate: e.target.checked,
                              }))
                            }
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                      </div>
                      {localConfig?.showDate !== false && (
                        <input
                          type="text"
                          value={
                            localConfig?.date !== undefined
                              ? localConfig.date
                              : new Date()
                                  .toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  })
                                  .replace(/\./g, ".")
                                  .replace(/ /g, "")
                          }
                          onChange={(e) =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                        />
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        점수 표시
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={localConfig?.showScore !== false}
                          onChange={(e) =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              showScore: e.target.checked,
                            }))
                          }
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        난이도 표시
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={localConfig?.showDifficulty !== false}
                          onChange={(e) =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              showDifficulty: e.target.checked,
                            }))
                          }
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 mt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    정답표 위치
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          answerKeyLocation: "separate",
                        }))
                      }
                      className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${localConfig?.answerKeyLocation !== "bottom" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      새 페이지
                    </button>
                    <button
                      onClick={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          answerKeyLocation: "bottom",
                        }))
                      }
                      className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${localConfig?.answerKeyLocation === "bottom" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      하단 이어서
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    단 구성
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {["1column", "2column"].map((col) => (
                      <button
                        key={col}
                        onClick={() =>
                          setLocalConfig((prev) => ({ ...prev, layout: col }))
                        }
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${localConfig?.layout === col ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {col === "1column" ? "1단 구성" : "2단 구성"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      문제 간격
                    </label>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      {localConfig?.spacing}px
                    </span>
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
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 leading-tight">
                    슬라이더를 조절하면 A4 용지 규격에 맞춰 비율이 다시
                    계산됩니다.
                  </p>
                </div>
              </div>
            </AccordionSection>

            {/* 1. 클래스 및 오답노트 */}
            <AccordionSection id="manage" isExpanded={expandedSections["manage"]} onToggle={() => toggleSection("manage")}
              title="클래스 및 오답노트"
              icon={Users}
            >
              {allClasses && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    클래스 배정
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClassId || ""}
                      onChange={(e) => onClassChange(Number(e.target.value))}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    >
                      {allClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {onCreateNewWrongNote && (
                <div className="pt-2">
                  <button
                    onClick={onCreateNewWrongNote}
                    className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 rounded-2xl transition-colors group"
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm text-indigo-700">
                        새 오답노트 생성
                      </span>
                      <span className="text-xs text-indigo-400/80 mt-0.5">
                        현재 시험지 복제하기
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                      <FilePlus size={16} />
                    </div>
                  </button>
                </div>
              )}

              {students && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      오답노트 진행 현황
                    </h3>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {students.filter((s) => s.existingNote).length} /{" "}
                      {students.length}명
                    </span>
                  </div>
                  <div className="space-y-2">
                    {students.map(({ student, existingNote }) => (
                      <button
                        key={student.id}
                        onClick={() =>
                          onNavigateToWrongNote(student, existingNote)
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          existingNote
                            ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200"
                            : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${existingNote ? "bg-emerald-500" : "bg-slate-200"}`}
                          />
                          <span
                            className={`text-sm font-medium ${existingNote ? "text-slate-800" : "text-slate-600"}`}
                          >
                            {student.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold ${existingNote ? "text-emerald-600" : "text-slate-300"}`}
                        >
                          {existingNote ? "보기 →" : "생성 →"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </AccordionSection>

            {/* 2. 문항 및 배점 편집 */}
            <AccordionSection id="questions" isExpanded={expandedSections["questions"]} onToggle={() => toggleSection("questions")}
              title="문항 및 배점 편집"
              icon={FilePlus}
            >
              {onAutoDistribute &&
                !(
                  localConfig?.template === "jschool" &&
                  localConfig?.showScore === false
                ) &&
                totalScore !== 100 && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/50 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-900 leading-none mt-1">
                          총점 불일치 ({totalScore}점)
                        </p>
                        <p className="text-xs text-amber-700/80 mt-1.5 leading-relaxed">
                          총점이 100점이 되도록 모든 문항의 배점을 균등하게
                          재조정합니다.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onAutoDistribute}
                      className="w-full py-2 bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-sm font-bold transition-colors"
                    >
                      자동 분배하기
                    </button>
                  </div>
                )}

              <div className="pt-2">
                <label
                  className={`flex flex-col items-center justify-center w-full py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    isDragOver
                      ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div
                    className={`p-3 rounded-full mb-3 transition-colors ${isDragOver ? "bg-indigo-100 text-indigo-600" : "bg-white text-slate-400 shadow-sm"}`}
                  >
                    <Plus size={20} />
                  </div>
                  <p
                    className={`text-sm font-bold mb-1 ${isDragOver ? "text-indigo-700" : "text-slate-700"}`}
                  >
                    문항 이미지 추가
                  </p>
                  <p
                    className={`text-[11px] ${isDragOver ? "text-indigo-500" : "text-slate-400"}`}
                  >
                    클릭하거나 드래그 앤 드롭
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={onAddImage}
                  />
                </label>
              </div>
            </AccordionSection>
          </div>
        )}
      </div>
    </aside>
  );
}
