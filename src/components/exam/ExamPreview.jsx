import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Maximize2, X, GripVertical, Trash2 } from "lucide-react";
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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExamHeaderTemplate, QuestionMetaTemplate, AnswerKeyTemplate } from "./templates";

// A4 specs
const A4_HEIGHT_MM = 297;
const PADDING_MM = 10; // Match print margin: 10mm
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PADDING_MM * 2;
const MM_TO_PX = 3.78;
const PAGE_CONTENT_HEIGHT_PX = CONTENT_HEIGHT_MM * MM_TO_PX;

const MeasureItem = memo(({ url, scale, score, idx, spacing, config, img }) => (
  <div
    style={{ paddingBottom: `${spacing}px` }}
    className="question-item break-inside-avoid relative group block w-full align-top"
  >
    <QuestionMetaTemplate img={img} config={config} />
    <div className="flex items-start gap-2">
      <span 
        className="font-bold shrink-0" 
        style={{ fontSize: '14pt', lineHeight: '1', paddingTop: '0.2rem', fontFamily: config?.template === 'jschool' ? 'monospace' : 'inherit' }}
      >
        {config?.template === 'jschool' ? String(idx + 1).padStart(2, '0') : `${idx + 1}.`}
      </span>
      <div className="flex-1 relative min-w-0">
        <div className="relative inline-block w-full text-center">
          <img
            src={url}
            alt={`Q${idx + 1}`}
            style={{ width: `${scale}%` }}
            className="max-w-full h-auto mx-auto block"
          />
          {!(config?.template === 'jschool' && config?.showScore === false) && score > 0 && (
            <div 
              className="text-right font-bold text-black"
              style={{ fontSize: '10pt', marginTop: '5px' }}
            >
              ({score}점)
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));

// Helper to render a single question item (reused for display)
const QuestionItem = memo(
  ({
    img,
    idx,
    config,
    isEditing,
    onImageScale,
    onImageDelete,
    onImageUpdate,
    measureRef, // Optional ref for measuring
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: img.id, disabled: !isEditing });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      paddingBottom: `${config?.spacing}px`,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : "auto",
    };

    return (
      <div
        ref={(node) => {
          // Merge refs: measureRef (if exists) and setNodeRef (for DnD)
          if (measureRef) measureRef.current = node;
          setNodeRef(node);
        }}
        style={style}
        className="question-item break-inside-avoid relative group block w-full align-top"
      >
        <QuestionMetaTemplate img={img} config={config} />
        <div className="flex items-start gap-2">
          <span 
            className="font-bold shrink-0" 
            style={{ fontSize: '14pt', lineHeight: '1', paddingTop: '0.2rem', fontFamily: config?.template === 'jschool' ? 'monospace' : 'inherit' }}
          >
            {config?.template === 'jschool' ? String(idx + 1).padStart(2, '0') : `${idx + 1}.`}
          </span>
          <div className="flex-1 relative min-w-0">
            <div className="relative inline-block w-full text-center">
              <img
                src={img.url}
                alt={`Q${idx + 1}`}
                style={{ width: `${img.scale}%` }}
                className="max-w-full h-auto mx-auto block"
              />
              {!(config?.template === 'jschool' && config?.showScore === false) && img.score > 0 && (
                <div 
                  className="text-right font-bold text-black"
                  style={{ fontSize: '10pt', marginTop: '5px' }}
                >
                  ({img.score}점)
                </div>
              )}

              {isEditing && !measureRef && (
                <>
                  {/* Subtle hover border highlight */}
                  <div className="no-print absolute -inset-1 border-2 border-dashed border-transparent group-hover:border-indigo-400/60 rounded-xl pointer-events-none transition-all duration-150" />

                  {/* Clean Floating Toolbar */}
                  <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-150 z-30 pointer-events-none group-hover:pointer-events-auto shadow-xl rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200/90 p-1.5 flex flex-col gap-1.5 max-w-[calc(100%-0.5rem)]">
                    {/* Primary controls row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Drag Handle */}
                      <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        title="드래그하여 순서 이동"
                      >
                        <GripVertical size={16} />
                      </div>

                      <div className="w-px h-4 bg-slate-200 shrink-0" />

                      {/* Scale Slider */}
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70" title="문제 이미지 크기">
                        <Maximize2 size={12} className="text-slate-400 shrink-0" />
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="5"
                          value={img.scale || 100}
                          onChange={(e) => onImageScale(img.id, e.target.value)}
                          className="w-14 h-1 accent-indigo-600 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-slate-600 min-w-[2.2rem] text-right font-mono">
                          {img.scale || 100}%
                        </span>
                      </div>

                      {/* Answer Input */}
                      <div className="flex items-center bg-slate-50 border border-slate-200/70 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500" title="정답">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 border-r border-slate-200/70">
                          답
                        </span>
                        <input
                          type="text"
                          value={img.answer || ""}
                          onChange={(e) =>
                            onImageUpdate(img.id, { answer: e.target.value })
                          }
                          placeholder="-"
                          className="w-10 px-1 py-0.5 text-xs text-center font-medium bg-transparent outline-none"
                        />
                      </div>

                      {/* Score Input */}
                      {!(config?.template === 'jschool' && config?.showScore === false) && (
                        <div className="flex items-center bg-slate-50 border border-slate-200/70 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500" title="배점">
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 border-r border-slate-200/70">
                            점
                          </span>
                          <input
                            type="number"
                            value={img.score || ""}
                            onChange={(e) =>
                              onImageUpdate(img.id, {
                                score: Number(e.target.value),
                              })
                            }
                            placeholder="0"
                            className="w-10 px-1 py-0.5 text-xs text-center font-medium bg-transparent outline-none"
                          />
                        </div>
                      )}

                      <div className="w-px h-4 bg-slate-200 shrink-0" />

                      {/* Delete Button */}
                      <button
                        onClick={() => onImageDelete(img.id)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title="문제 삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Secondary row for J SCHOOL template metadata */}
                    {config?.template === 'jschool' && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 text-xs flex-wrap">
                        {/* Badge */}
                        <div className="flex items-center bg-slate-50 border border-slate-200/70 rounded-lg overflow-hidden focus-within:border-indigo-500" title="배지">
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 border-r border-slate-200/70">
                            배지
                          </span>
                          <select
                            value={img.badge || ""}
                            onChange={(e) => onImageUpdate(img.id, { badge: e.target.value })}
                            className="px-1.5 py-0.5 text-xs text-center bg-transparent outline-none font-medium cursor-pointer"
                          >
                            <option value="">없음</option>
                            <option value="기본">기본</option>
                            <option value="심화">심화</option>
                            <option value="발전">발전</option>
                            {img.badge && !["기본", "심화", "발전", ""].includes(img.badge) && (
                              <option value={img.badge}>{img.badge}</option>
                            )}
                          </select>
                        </div>

                        {/* Difficulty Stars */}
                        {config?.showDifficulty !== false && (
                          <div className="flex items-center bg-slate-50 border border-slate-200/70 rounded-lg px-1.5 py-0.5" title="난이도 (클릭하여 변경)">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">
                              난이도
                            </span>
                            {[1, 2, 3].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => onImageUpdate(img.id, { difficulty: star })}
                                className={`text-xs leading-none transition-transform hover:scale-125 px-0.5 ${
                                  star <= (img?.difficulty || 1)
                                    ? 'text-amber-400'
                                    : 'text-slate-200 hover:text-amber-300'
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Question ID */}
                        <div className="flex items-center bg-slate-50 border border-slate-200/70 rounded-lg overflow-hidden focus-within:border-indigo-500" title="문제 ID">
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 border-r border-slate-200/70">
                            ID
                          </span>
                          <input
                            type="text"
                            value={img.questionId || ""}
                            onChange={(e) => onImageUpdate(img.id, { questionId: e.target.value })}
                            placeholder="ID"
                            className="w-14 px-1 py-0.5 text-xs text-center bg-transparent outline-none font-medium"
                          />
                        </div>
                      </div>
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

export default function ExamPreview({
  title,
  config,
  images,
  isEditing,
  onImageScale,
  onImageDelete,
  onImageUpdate,
  onReorder,
}) {
  const [pages, setPages] = useState([]);
  const [measuring, setMeasuring] = useState(true);
  const measureContainerRef = useRef(null);

  const renderAnswerKey = (isBottom) => (
    <AnswerKeyTemplate
      title={title}
      images={images}
      config={config}
      isBottom={isBottom}
    />
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      if (onReorder) onReorder(oldIndex, newIndex);
    }
  };

  const layoutHash = useMemo(() => {
    const itemsKey = images
      .map((i) => `${i.id}-${i.scale}-${i.score || ""}`)
      .join("|");
    const configKey = `${config?.template}-${config?.showScore}-${config?.showDifficulty}-${config?.showWeek}-${config?.showDate}-${config?.layout}-${config?.spacing}-${config?.imageSize}`;
    return `${title}-${itemsKey}-${configKey}`;
  }, [images, config, title]);

  const measureAndPaginate = () => {
    if (!measureContainerRef.current) return;

    const children = measureContainerRef.current.children;
    const headerElement = children[0];
    const questionElements = Array.from(children).slice(1);
    
    // Header height including margin
    const getFullHeight = (el) => {
      const style = window.getComputedStyle(el);
      return el.offsetHeight + parseInt(style.marginTop || 0) + parseInt(style.marginBottom || 0);
    };

    const measuredHeaderHeight = getFullHeight(headerElement);
    const heights = questionElements.map(el => el.offsetHeight);

    // Precise A4 content area height: 297mm - 20mm padding = 277mm
    const tempPage = document.createElement('div');
    tempPage.style.height = '277mm';
    tempPage.style.visibility = 'hidden';
    tempPage.style.position = 'absolute';
    document.body.appendChild(tempPage);
    const CONTENT_HEIGHT = tempPage.offsetHeight;
    document.body.removeChild(tempPage);

    const SAFE_PAGE_HEIGHT = CONTENT_HEIGHT - 2;

    const newPages = [];
    let currentPageItems = [];
    let currentColHeight = 0;
    let currentColIndex = 0;

    const isTwoCol = config?.layout === "2column";
    const maxCols = isTwoCol ? 2 : 1;

    images.forEach((img, idx) => {
      const itemHeight = (heights[idx] || 150);
      const isFirstPage = newPages.length === 0;
      
      const availableColHeight = (isFirstPage && (currentColIndex === 0 || isTwoCol)) 
        ? (SAFE_PAGE_HEIGHT - measuredHeaderHeight) 
        : SAFE_PAGE_HEIGHT;

      if (currentColHeight + itemHeight > availableColHeight) {
        currentColIndex++;
        if (currentColIndex >= maxCols) {
          newPages.push(currentPageItems);
          currentPageItems = [idx];
          currentColHeight = itemHeight;
          currentColIndex = 0;
        } else {
          currentPageItems.push(idx);
          currentColHeight = itemHeight;
        }
      } else {
        currentPageItems.push(idx);
        currentColHeight += itemHeight;
      }
    });

    if (currentPageItems.length > 0) {
      newPages.push(currentPageItems);
    }

    setPages(newPages);
    setMeasuring(false);
  };

  useEffect(() => {
    setMeasuring(true);
    const timer = setTimeout(() => {
      measureAndPaginate();
    }, 300);
    return () => clearTimeout(timer);
  }, [layoutHash]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-y-auto p-8 bg-slate-200">
        <div className="flex flex-col items-center gap-8 pb-16">
          {/* Hidden Measure Container - EXACT width as print area */}
          <div style={{ height: 0, overflow: "hidden", visibility: "hidden", position: 'absolute', top: 0, left: 0 }}>
            <div
              ref={measureContainerRef}
              className="pointer-events-none"
              style={{
                width: config?.layout === "2column" 
                  ? "calc((210mm - 20mm - 3rem) / 2)" 
                  : "calc(210mm - 20mm)", 
              }}
            >
              {/* Header for measurement */}
              <ExamHeaderTemplate title={title} config={config} />

              {images.map((img, idx) => (
                <MeasureItem
                  key={img.id}
                  url={img.url}
                  scale={img.scale}
                  score={img.score}
                  idx={idx}
                  spacing={config?.spacing}
                  config={config}
                  img={img}
                />
              ))}
            </div>
          </div>

          {/* Display Pages */}
          <div id="exam-preview-pages" className="flex flex-col items-center gap-8 w-full">
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              {pages.map((pageItems, pageIdx) => (
                <div
                  key={pageIdx}
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  className="a4-paper bg-white shadow-2xl h-[297mm] w-[210mm] p-[10mm] box-border relative overflow-hidden"
                >
                  <div
                    className={`questions-container h-full ${config?.layout === "2column" ? "columns-2 gap-12" : "columns-1"} space-y-0 text-black`}
                    style={{
                      columnRule:
                        config?.layout === "2column"
                          ? "1px solid #e2e8f0"
                          : "none",
                      columnGap: config?.layout === "2column" ? "3rem" : "0",
                      columnFill: "auto",
                    }}
                  >
                    {pageIdx === 0 && (
                      <div 
                        style={{ 
                          columnSpan: config?.layout === "2column" ? "all" : "none",
                          WebkitColumnSpan: config?.layout === "2column" ? "all" : "none",
                        }}
                      >
                        <ExamHeaderTemplate title={title} config={config} />
                      </div>
                    )}

                    {pageItems.map((imgIdx) => {
                      const img = images[imgIdx];
                      return (
                        <QuestionItem
                          key={img.id}
                          img={img}
                          idx={imgIdx}
                          config={config}
                          isEditing={isEditing}
                          onImageScale={onImageScale}
                          onImageDelete={onImageDelete}
                          onImageUpdate={onImageUpdate}
                        />
                      );
                    })}
                    {pageIdx === pages.length - 1 && config?.answerKeyLocation === 'bottom' && (
                      <div 
                        className="mt-12"
                        style={{ 
                          columnSpan: config?.layout === "2column" ? "all" : "none",
                          WebkitColumnSpan: config?.layout === "2column" ? "all" : "none",
                        }}
                      >
                        {renderAnswerKey(true)}
                      </div>
                    )}
                  </div>

                  <div className="no-print absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
                    <span className="text-xs text-slate-400 font-medium">
                      {pageIdx + 1} / {pages.length} 페이지
                    </span>
                  </div>
                </div>
              ))}
            </SortableContext>

            {/* Answer Key Page (Separate) */}
            {config?.answerKeyLocation !== 'bottom' && (
              <div 
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                className="a4-paper bg-white shadow-2xl min-h-[297mm] w-[210mm] p-[20mm] box-border relative overflow-hidden"
              >
                {renderAnswerKey(false)}
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}