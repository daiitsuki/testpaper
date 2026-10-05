import { useState, useEffect, useRef, useMemo, memo } from "react";
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
} from "@dnd-kit/sortable";
import { ExamHeaderTemplate, QuestionMetaTemplate, AnswerKeyTemplate } from "./templates";
import QuestionItem from "./QuestionItem";

// A4 specs
const A4_HEIGHT_MM = 297;
const PADDING_MM = 10; // Match print margin: 10mm
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PADDING_MM * 2;
const MM_TO_PX = 3.78;
const PAGE_CONTENT_HEIGHT_PX = CONTENT_HEIGHT_MM * MM_TO_PX;

const MeasureItem = memo(({ url, scale, score, idx, spacing, config, img, onLoad }) => (
  <div
    style={{ 
      paddingBottom: `${spacing}px`,
      maxHeight: '277mm',
      overflow: 'hidden'
    }}
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
            onLoad={onLoad}
            style={{ 
              width: `${scale}%`,
              maxHeight: `calc(967px - ${spacing || 0}px)`,
              objectFit: 'contain'
            }}
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



export default function ExamPreview({
  title,
  config,
  images,
  onImageScale,
  onImageDelete,
  onImageUpdate,
  onReorder,
}) {
  const [pages, setPages] = useState([]);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
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
      .map((i) => `${i.id}-${i.scale}-${i.score || ""}-${i.pageBreak || false}`)
      .join("|");
    const configKey = `${config?.template}-${config?.showScore}-${config?.showDifficulty}-${config?.showWeek}-${config?.showDate}-${config?.layout}-${config?.spacing}-${config?.imageSize}-${config?.answerKeyLocation}`;
    return `${title}-${itemsKey}-${configKey}`;
  }, [images, config, title]);

  const measureAndPaginate = () => {
    if (!measureContainerRef.current) return;

    if (!images || images.length === 0) {
      setPages([[]]);
      return;
    }

    const children = measureContainerRef.current.children;
    const headerElement = children[0];
    
    // 문제 요소와 정답표 요소를 구분합니다.
    const questionElements = [];
    let answerKeyElement = null;

    Array.from(children).slice(1).forEach(el => {
      if (el.id === 'measure-answer-key') {
        answerKeyElement = el;
      } else {
        questionElements.push(el);
      }
    });
    
    // Header height including margin
    const getFullHeight = (el) => {
      const style = window.getComputedStyle(el);
      return el.offsetHeight + parseInt(style.marginTop || 0) + parseInt(style.marginBottom || 0);
    };

    const measuredHeaderHeight = getFullHeight(headerElement);
    const heights = questionElements.map(el => el.offsetHeight);
    const answerKeyHeight = answerKeyElement ? getFullHeight(answerKeyElement) : 0;

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

      // pageBreak 속성이 켜져 있고 첫 번째 아이템이 아닌 경우 강제로 다음 구역(단/페이지)으로 분할
      const forceBreak = img.pageBreak && idx > 0;

      if (forceBreak || currentColHeight + itemHeight > availableColHeight) {
        if (currentPageItems.length > 0) {
          currentColIndex++;
          if (currentColIndex >= maxCols) {
            newPages.push(currentPageItems);
            currentPageItems = [img.id];
            currentColHeight = itemHeight;
            currentColIndex = 0;
          } else {
            currentPageItems.push(img.id);
            currentColHeight = itemHeight;
          }
        } else {
          // 이미 새로운 단/페이지의 첫 요소인 경우 강제 분할을 무시하고 그대로 삽입
          currentPageItems.push(img.id);
          currentColHeight = itemHeight;
        }
      } else {
        currentPageItems.push(img.id);
        currentColHeight += itemHeight;
      }
    });

    if (currentPageItems.length > 0) {
      newPages.push(currentPageItems);
    }

    // 정답표가 마지막 페이지에 충분히 들어갈 수 있는지 검사
    if (config?.answerKeyLocation === 'bottom' && answerKeyHeight > 0) {
      const isFirstPage = newPages.length === 1;
      const availableColHeight = (isFirstPage && (currentColIndex === 0 || isTwoCol)) 
        ? (SAFE_PAGE_HEIGHT - measuredHeaderHeight) 
        : SAFE_PAGE_HEIGHT;

      // 2단 레이아웃에서 두 번째 단으로 넘어갔거나,
      // 현재 단의 남은 공간보다 정답표가 더 크다면 정답표를 다음 페이지로 분리합니다.
      if (currentColIndex > 0 || currentColHeight + answerKeyHeight > availableColHeight) {
        newPages.push([]); // 정답표 전용 빈 페이지 추가
      }
    }

    setPages(newPages);
  };

  useEffect(() => {
    // Reset load count when layout hashes change (implies images changed)
    setLoadedImagesCount(0);
    const timer = setTimeout(() => {
      measureAndPaginate();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutHash]);

  useEffect(() => {
    if (loadedImagesCount === images?.length && images?.length > 0) {
      measureAndPaginate();
    }
  }, [loadedImagesCount]);

  const handleImageLoad = () => {
    setLoadedImagesCount(prev => prev + 1);
  };


  const answerKeyChunks = useMemo(() => {
    if (!images || images.length === 0) return [];
    const chunks = [];
    let currentIndex = 0;
    while (currentIndex < images.length) {
      const isFirst = currentIndex === 0;
      const chunkSize = isFirst ? 40 : 60;
      chunks.push({
        chunkImages: images.slice(currentIndex, currentIndex + chunkSize),
        startIndex: currentIndex,
        isFirstChunk: isFirst
      });
      currentIndex += chunkSize;
    }
    return chunks;
  }, [images]);

  const displayPages = useMemo(() => {
    if (!images || images.length === 0) return [[]];

    const validIdSet = new Set(images.map((img) => img.id));

    // 아직 페이지 계산이 완료되지 않았거나 pages가 비어있을 때는 1페이지에 임시로 렌더링
    if (pages.length === 0) {
      return [images.map((img) => img.id)];
    }

    // pages에 저장된 id 중 현재 존재하는 유효한 id만 필터링
    const filtered = pages.map((pageItems) =>
      pageItems.filter((id) => validIdSet.has(id))
    );

    // 삭제로 인해 빈 페이지가 발생했을 때 정리 (첫 페이지는 헤더 표시를 위해 빈 페이지라도 유지)
    // 단, 정답표 단독 표시를 위한 빈 마지막 페이지는 유지
    const nonEmptyPages = filtered.filter((pageItems, idx) => 
      idx === 0 || 
      pageItems.length > 0 ||
      (idx === filtered.length - 1 && config?.answerKeyLocation === 'bottom')
    );

    return nonEmptyPages.length > 0 ? nonEmptyPages : [[]];
  }, [pages, images, config?.answerKeyLocation]);

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
                  onLoad={handleImageLoad}
                />
              ))}
              
              {config?.answerKeyLocation === 'bottom' && (
                <div id="measure-answer-key" className="mt-12" style={{ width: 'calc(210mm - 20mm)' }}>
                  {answerKeyChunks.length > 0 && <AnswerKeyTemplate title={title} chunkImages={answerKeyChunks[0].chunkImages} config={config} isBottom={true} startIndex={answerKeyChunks[0].startIndex} isFirstChunk={answerKeyChunks[0].isFirstChunk} />}
                </div>
              )}
            </div>
          </div>

          {/* Display Pages */}
          <div id="exam-preview-pages" className="flex flex-col items-center gap-8 w-full">
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              {displayPages.map((pageItems, pageIdx) => (
                <div
                  key={pageIdx}
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  className="a4-paper bg-white shadow-2xl h-[297mm] w-[210mm] p-[10mm] box-border relative overflow-hidden"
                >
                  <div
                    className={`questions-container h-full ${config?.layout === "2column" ? "columns-2 gap-12" : "columns-1"} space-y-0 text-black`}
                    style={{
                      height: '100%',
                      columnCount: config?.layout === "2column" ? 2 : 1,
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

                    {pageItems.length === 0 && images.length === 0 && (
                      <div 
                        className="py-24 text-center text-slate-400 select-none flex flex-col items-center justify-center h-64"
                        style={{ 
                          columnSpan: config?.layout === "2column" ? "all" : "none",
                          WebkitColumnSpan: config?.layout === "2column" ? "all" : "none",
                        }}
                      >
                        <p className="text-base font-semibold text-slate-500">등록된 문제가 없습니다</p>
                        <p className="text-xs text-slate-400 mt-1">상단에서 문제를 추가해 시험지를 구성해보세요.</p>
                      </div>
                    )}

                    {pageItems.map((imgId) => {
                      const img = images.find((i) => i.id === imgId);
                      if (!img) return null;
                      const imgIdx = images.indexOf(img);
                      return (
                        <QuestionItem
                          key={img.id}
                          img={img}
                          idx={imgIdx}
                          config={config}
                          onImageScale={onImageScale}
                          onImageDelete={onImageDelete}
                          onImageUpdate={onImageUpdate}
                        />
                      );
                    })}
                    {pageIdx === displayPages.length - 1 && config?.answerKeyLocation === 'bottom' && (
                      <div 
                        className="mt-12"
                        style={{ 
                          columnSpan: config?.layout === "2column" ? "all" : "none",
                          WebkitColumnSpan: config?.layout === "2column" ? "all" : "none",
                        }}
                      >
                        {answerKeyChunks.length > 0 && <AnswerKeyTemplate title={title} chunkImages={answerKeyChunks[0].chunkImages} config={config} isBottom={true} startIndex={answerKeyChunks[0].startIndex} isFirstChunk={answerKeyChunks[0].isFirstChunk} />}
                      </div>
                    )}
                  </div>

                  <div className="no-print absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
                    <span className="text-xs text-slate-400 font-medium">
                      {pageIdx + 1} / {displayPages.length} 페이지
                    </span>
                  </div>
                </div>
              ))}
            </SortableContext>

            {/* Additional Answer Key Pages for bottom overflow */}
            {config?.answerKeyLocation === 'bottom' && answerKeyChunks.slice(1).map((chunk, idx) => (
              <div 
                key={`ans-chunk-bottom-${idx}`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                className="a4-paper bg-white shadow-2xl h-[297mm] w-[210mm] p-[10mm] box-border relative"
              >
                <AnswerKeyTemplate title={title} chunkImages={chunk.chunkImages} config={config} isBottom={false} startIndex={chunk.startIndex} isFirstChunk={chunk.isFirstChunk} />
              </div>
            ))}

            {/* Answer Key Page (Separate) */}
            {config?.answerKeyLocation !== 'bottom' && answerKeyChunks.map((chunk, idx) => (
              <div 
                key={`ans-chunk-sep-${idx}`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                className="a4-paper bg-white shadow-2xl h-[297mm] w-[210mm] p-[10mm] box-border relative"
              >
                <AnswerKeyTemplate title={title} chunkImages={chunk.chunkImages} config={config} isBottom={false} startIndex={chunk.startIndex} isFirstChunk={chunk.isFirstChunk} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}