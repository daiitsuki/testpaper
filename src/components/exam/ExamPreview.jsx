import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Maximize2, X, GripVertical } from "lucide-react";
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

// A4 specs
const A4_HEIGHT_MM = 297;
const PADDING_MM = 20;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PADDING_MM * 2;
const MM_TO_PX = 3.78;
const PAGE_CONTENT_HEIGHT_PX = CONTENT_HEIGHT_MM * MM_TO_PX;

// Optimized item for measurement - only re-renders if layout props change
const MeasureItem = memo(({ url, scale, score, idx, spacing }) => (
  <div
    style={{ marginBottom: `${spacing}px` }}
    className="question-item break-inside-avoid relative group inline-block w-full align-top"
  >
    <div className="flex items-start gap-2 mb-2">
      <span className="font-bold text-lg leading-none pt-1">{idx + 1}.</span>
      <div className="flex-1 relative">
        <div className="relative inline-block w-full text-center">
          <img
            src={url}
            alt={`Q${idx + 1}`}
            style={{ width: `${scale}%` }}
            className="max-w-full h-auto mx-auto"
          />
          {score && (
            <div className="text-right font-bold mt-1 text-sm text-slate-800">
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
      marginBottom: `${config?.spacing}px`,
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
        className="question-item break-inside-avoid relative group inline-block w-full align-top"
      >
        <div className="flex items-start gap-2 mb-2">
          <span className="font-bold text-lg leading-none pt-1">
            {idx + 1}.
          </span>
          <div className="flex-1 relative">
            <div className="relative inline-block w-full text-center">
              <img
                src={img.url}
                alt={`Q${idx + 1}`}
                style={{ width: `${img.scale}%` }}
                className="max-w-full h-auto mx-auto"
              />
              {img.score && (
                <div className="text-right font-bold mt-1 text-sm text-slate-800">
                  ({img.score}점)
                </div>
              )}

              {isEditing && !measureRef && (
                <>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-400/50 rounded-lg pointer-events-none transition-all" />
                  <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end gap-2 z-10 p-2">
                    <div className="bg-white shadow-lg rounded-lg p-2 flex items-center gap-2 border border-slate-100 mb-1">
                      {/* Drag Handle */}
                      <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab p-1 hover:bg-slate-100 rounded text-slate-400 mr-1"
                      >
                        <GripVertical size={16} />
                      </div>
                      <label className="text-xs font-bold text-slate-500">
                        답:
                      </label>
                      <input
                        type="text"
                        value={img.answer || ""}
                        onChange={(e) =>
                          onImageUpdate(img.id, { answer: e.target.value })
                        }
                        className="w-12 text-xs border rounded px-1"
                      />
                      <label className="text-xs font-bold text-slate-500 ml-2">
                        점수:
                      </label>
                      <input
                        type="number"
                        value={img.score || ""}
                        onChange={(e) =>
                          onImageUpdate(img.id, {
                            score: Number(e.target.value),
                          })
                        }
                        className="w-10 text-xs border rounded px-1"
                      />
                    </div>
                    <div className="bg-white shadow-lg rounded-lg p-2 flex items-center gap-2 border border-slate-100">
                      <Maximize2 size={14} className="text-indigo-500" />
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={img.scale}
                        onChange={(e) => onImageScale(img.id, e.target.value)}
                        className="w-24 accent-indigo-600 h-1.5"
                      />
                      <span className="text-xs font-bold text-slate-600 w-8 text-right">
                        {img.scale}%
                      </span>
                    </div>
                    <button
                      onClick={() => onImageDelete(img.id)}
                      className="bg-red-500 text-white p-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                      title="문제 삭제"
                    >
                      <X size={16} />
                    </button>
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
    const configKey = `${config?.layout}-${config?.spacing}-${config?.imageSize}`;
    return `${title}-${itemsKey}-${configKey}`;
  }, [images, config, title]);

  const measureAndPaginate = () => {
    if (!measureContainerRef.current) return;

    const items = measureContainerRef.current.children;
    const heights = [];
    for (let i = 0; i < items.length; i++) {
      heights.push(items[i].offsetHeight);
    }

    const headerHeight = 120;
    const PAGE_HEIGHT = 960;

    const newPages = [];
    let currentPage = { items: [], currentHeight: 0 };

    currentPage.currentHeight += headerHeight;

    const isTwoCol = config?.layout === "2column";
    const effectivePageCapacity = isTwoCol ? PAGE_HEIGHT * 2 : PAGE_HEIGHT;

    images.forEach((img, idx) => {
      const itemHeight = (heights[idx] || 150) + (config?.spacing || 0);

      if (currentPage.currentHeight + itemHeight > effectivePageCapacity) {
        newPages.push(currentPage.items);
        currentPage = { items: [], currentHeight: 0 };
      }
      currentPage.items.push(idx);
      currentPage.currentHeight += itemHeight;
    });

    if (currentPage.items.length > 0) {
      newPages.push(currentPage.items);
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
          {/* Hidden Measure Container */}
          <div style={{ height: 0, overflow: "hidden", visibility: "hidden" }}>
            <div
              ref={measureContainerRef}
              className="pointer-events-none"
              style={{
                width: config?.layout === "2column" ? "330px" : "700px",
              }}
            >
              {images.map((img, idx) => (
                <MeasureItem
                  key={img.id}
                  url={img.url}
                  scale={img.scale}
                  score={img.score}
                  idx={idx}
                  spacing={config?.spacing}
                />
              ))}
            </div>
          </div>

          {/* Display Pages */}
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            {pages.map((pageItems, pageIdx) => (
              <div
                key={pageIdx}
                className="a4-paper bg-white shadow-2xl min-h-[297mm] w-[210mm] p-[20mm] box-border relative overflow-hidden"
              >
                {pageIdx === 0 && (
                  <div className="border-b-4 border-double border-slate-900 pb-4 mb-8 text-center">
                    <h1 className="text-3xl font-black mb-2 tracking-tighter">
                      {title}
                    </h1>
                    <div className="text-right text-lg font-bold">
                      <span>이름: ________</span>
                    </div>
                  </div>
                )}

                <div
                  className={`questions-container ${config?.layout === "2column" ? "columns-2 gap-12" : "columns-1"} space-y-0`}
                  style={{
                    columnRule:
                      config?.layout === "2column"
                        ? "1px solid #e2e8f0"
                        : "none",
                  }}
                >
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
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {pageIdx + 1} / {pages.length} 페이지
                  </span>
                </div>
              </div>
            ))}
          </SortableContext>

          {/* Answer Key Page */}
          <div className="a4-paper bg-white shadow-2xl min-h-[297mm] w-[210mm] p-[20mm] box-border relative overflow-hidden">
            <div className="border-b-4 border-double border-slate-900 pb-4 mb-8 text-center">
              <h1 className="text-2xl font-black mb-2 tracking-tighter">
                {title} - 정답 및 배점
              </h1>
            </div>

            <table className="w-full border-collapse text-center text-sm border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="border border-slate-200 p-2">번호</th>
                  <th className="border border-slate-200 p-2">정답</th>
                  <th className="border border-slate-200 p-2">배점</th>
                  <th className="border border-slate-200 p-2">번호</th>
                  <th className="border border-slate-200 p-2">정답</th>
                  <th className="border border-slate-200 p-2">배점</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const half = Math.ceil(images.length / 2);
                  const rows = [];
                  for (let i = 0; i < half; i++) {
                    const img1 = images[i];
                    const img2 = images[i + half];
                    rows.push(
                      <tr key={i}>
                        <td className="border border-slate-200 p-2 font-bold">
                          {i + 1}
                        </td>
                        <td className="border border-slate-200 p-2">
                          {img1.answer || "-"}
                        </td>
                        <td className="border border-slate-200 p-2">
                          {img1.score || "-"}
                        </td>
                        <td className="border border-slate-200 p-2 font-bold">
                          {img2 ? i + 1 + half : ""}
                        </td>
                        <td className="border border-slate-200 p-2">
                          {img2 ? img2.answer || "-" : ""}
                        </td>
                        <td className="border border-slate-200 p-2">
                          {img2 ? img2.score || "-" : ""}
                        </td>
                      </tr>,
                    );
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
