import { memo } from "react";
import { Maximize2, GripVertical, Trash2, Scissors } from "lucide-react";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuestionMetaTemplate } from "./templates";

const QuestionItem = memo(
  ({
    img,
    idx,
    config,
    onImageScale,
    onImageDelete,
    onImageUpdate,
    measureRef,
  }) => {
    const animateLayoutChanges = (args) => {
      const { isSorting, wasDragging } = args;
      if (isSorting || wasDragging) {
        return defaultAnimateLayoutChanges(args);
      }
      return false;
    };

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: img.id,
      animateLayoutChanges,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      paddingBottom: `${config?.spacing}px`,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : "auto",
      breakBefore: img.pageBreak && idx > 0 ? "column" : "auto",
      WebkitColumnBreakBefore: img.pageBreak && idx > 0 ? "always" : "auto",
      maxHeight: '277mm',
      overflow: 'hidden'
    };

    return (
      <div
        ref={(node) => {
          if (measureRef) measureRef.current = node;
          setNodeRef(node);
        }}
        style={style}
        className={`question-item break-inside-avoid relative group block w-full align-top ${
          img.pageBreak && idx > 0 ? "break-before-column" : ""
        }`}
      >
        {!measureRef && img.pageBreak && idx > 0 && (
          <div className="no-print absolute -top-3 left-0 right-0 flex items-center justify-center gap-2 opacity-60 z-10 pointer-events-none">
            <div className="h-px bg-indigo-500 border-t-2 border-dashed border-indigo-400 flex-1"></div>
            <span className="text-[11px] text-indigo-500 font-bold px-2 flex items-center gap-1 bg-white rounded-full border border-indigo-200">
              <Scissors size={12} className="-rotate-90" /> 단 나누기
            </span>
            <div className="h-px bg-indigo-500 border-t-2 border-dashed border-indigo-400 flex-1"></div>
          </div>
        )}

        <QuestionMetaTemplate img={img} config={config} />

        <div className="flex items-start gap-2">
          <span
            className="font-bold shrink-0"
            style={{
              fontSize: "14pt",
              lineHeight: "1",
              paddingTop: "0.2rem",
              fontFamily:
                config?.template === "jschool" ? "monospace" : "inherit",
            }}
          >
            {config?.template === "jschool"
              ? String(idx + 1).padStart(2, "0")
              : `${idx + 1}.`}
          </span>
          <div className="flex-1 relative min-w-0">
            <div className="relative inline-block w-full text-center">
              <img
                src={img.url}
                alt={`Q${idx + 1}`}
                style={{ 
                  width: `${img.scale}%`,
                  maxHeight: `calc(967px - ${config?.spacing || 0}px)`,
                  objectFit: 'contain'
                }}
                className="max-w-full h-auto mx-auto block"
              />
              {!(
                config?.template === "jschool" && config?.showScore === false
              ) &&
                img.score > 0 && (
                  <div
                    className="text-right font-bold text-black"
                    style={{ fontSize: "10pt", marginTop: "5px" }}
                  >
                    ({img.score}점)
                  </div>
                )}

              {!measureRef && (
                <>
                  <div className="no-print absolute -inset-1 border-2 border-dashed border-transparent group-hover:border-indigo-400/50 rounded-xl pointer-events-none transition-all duration-200" />

                  {/* Floating Toolbar Panel (Single Cohesive Design) */}
                  <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 pointer-events-none group-hover:pointer-events-auto shadow-[0_4px_20px_rgb(0,0,0,0.08)] rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-1 flex flex-col items-end">
                    
                    {/* Row 1: Tools & Actions */}
                    <div className="flex items-center gap-1 p-0.5">
                      <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                        title="드래그하여 순서 이동"
                      >
                        <GripVertical size={16} />
                      </div>

                      <div className="w-px h-4 bg-slate-200" />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageUpdate(img.id, { pageBreak: !img.pageBreak });
                        }}
                        className={`p-1.5 rounded-xl transition-colors ${
                          img.pageBreak
                            ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        }`}
                        title="여기서부터 단/페이지 나누기"
                      >
                        <Scissors
                          size={14}
                          className={img.pageBreak ? "-rotate-90" : ""}
                        />
                      </button>

                      <div className="w-px h-4 bg-slate-200" />

                      <div
                        className="flex items-center gap-1.5 px-2 group/scale"
                        title="문제 크기 조절"
                      >
                        <Maximize2 size={14} className="text-slate-400" />
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="5"
                          value={img.scale || 100}
                          onChange={(e) => onImageScale(img.id, e.target.value)}
                          className="w-16 h-1 accent-indigo-500 cursor-pointer opacity-70 group-hover/scale:opacity-100 transition-opacity"
                        />
                        <span className="text-[10px] font-semibold text-slate-500 w-6 text-right font-mono">
                          {img.scale || 100}%
                        </span>
                      </div>

                      <div className="w-px h-4 bg-slate-200 mx-0.5" />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageDelete(img.id);
                        }}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors mr-0.5"
                        title="문제 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="w-full h-px bg-slate-100/80 my-0.5" />
                    
                    {/* Row 2: Data Inputs (Answer & Score) */}
                    <div className="flex items-center gap-1 p-0.5 w-full justify-end">
                      <div className="flex items-center px-1.5" title="정답">
                        <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">
                          답
                        </span>
                        <input
                          type="text"
                          value={img.answer || ""}
                          onChange={(e) =>
                            onImageUpdate(img.id, { answer: e.target.value })
                          }
                          placeholder="-"
                          className="w-12 text-sm text-center font-bold text-indigo-600 bg-transparent outline-none placeholder:font-normal placeholder:text-slate-300 focus:bg-indigo-50 rounded transition-colors"
                        />
                      </div>

                      {!(
                        config?.template === "jschool" &&
                        config?.showScore === false
                      ) && (
                        <>
                          <div className="w-px h-4 bg-slate-200" />
                          <div
                            className="flex items-center px-1.5"
                            title="배점"
                          >
                            <input
                              type="text"
                              value={img.score || ""}
                              onChange={(e) =>
                                onImageUpdate(img.id, {
                                  score: Number(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="w-10 text-sm text-center font-bold text-indigo-600 bg-transparent outline-none placeholder:font-normal placeholder:text-slate-300 focus:bg-indigo-50 rounded transition-colors"
                            />
                            <span className="text-[10px] font-bold text-slate-400 ml-1 select-none">
                              점
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Row 3: Secondary row for J SCHOOL template metadata */}
                    {config?.template === "jschool" && (
                      <>
                        <div className="w-full h-px bg-slate-100/80 my-0.5" />
                        <div className="flex items-center gap-1.5 p-0.5 px-2 w-full justify-end">
                        {config?.showDifficulty !== false && (
                          <>
                            <div className="flex items-center" title="배지">
                              <select
                                value={img.badge || "기본"}
                                onChange={(e) => {
                                  const newBadge = e.target.value;
                                  const updates = { badge: newBadge };
                                  if (newBadge === "기본")
                                    updates.difficulty = 1;
                                  else if (newBadge === "심화")
                                    updates.difficulty = 2;
                                  else if (newBadge === "발전")
                                    updates.difficulty = 3;
                                  onImageUpdate(img.id, updates);
                                }}
                                className={`text-[11px] font-bold outline-none cursor-pointer appearance-none bg-transparent ${
                                  (img.badge || "기본") === "기본"
                                    ? "text-emerald-600"
                                    : (img.badge || "기본") === "심화"
                                      ? "text-orange-600"
                                      : (img.badge || "기본") === "발전"
                                        ? "text-red-600"
                                        : "text-slate-600"
                                }`}
                              >
                                <option value="기본">기본</option>
                                <option value="심화">심화</option>
                                <option value="발전">발전</option>
                                {img.badge &&
                                  !["기본", "심화", "발전"].includes(
                                    img.badge,
                                  ) && (
                                    <option value={img.badge}>
                                      {img.badge}
                                    </option>
                                  )}
                              </select>
                            </div>

                            <div className="w-px h-3 bg-slate-200" />

                            <div
                              className="flex items-center gap-0.5"
                              title="난이도"
                            >
                              {[1, 2, 3].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    const badgeMap = {
                                      1: "기본",
                                      2: "심화",
                                      3: "발전",
                                    };
                                    onImageUpdate(img.id, {
                                      difficulty: star,
                                      badge: badgeMap[star],
                                    });
                                  }}
                                  className={`text-[14px] leading-none transition-transform hover:scale-125 px-0.5 ${
                                    star <= (img?.difficulty || 1)
                                      ? "text-amber-400 drop-shadow-sm"
                                      : "text-slate-200 hover:text-amber-300"
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>

                            <div className="w-px h-3 bg-slate-200" />
                          </>
                        )}

                        <div className="flex items-center" title="문제 ID">
                          <span className="text-[10px] font-medium text-slate-400 mr-1 select-none">
                            ID
                          </span>
                          <input
                            type="text"
                            value={img.questionId || ""}
                            onChange={(e) =>
                              onImageUpdate(img.id, {
                                questionId: e.target.value,
                              })
                            }
                            placeholder="번호입력"
                            className="w-14 text-[11px] text-center font-bold text-slate-600 bg-transparent outline-none placeholder:font-normal placeholder:text-slate-300 focus:bg-slate-100 rounded transition-colors"
                          />
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default QuestionItem;
