import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import {
  Upload,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Layout as LayoutIcon,
  Settings2,
  CheckCircle2,
  ChevronLeft,
  LayoutGrid,
  List,
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableImage({ image, onRemove, onUpdate, viewMode = "grid" }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (viewMode === "list") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center p-2 gap-3 mb-2"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 hover:bg-slate-100 rounded text-slate-400"
        >
          <GripVertical size={18} />
        </div>
        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={image.preview}
            alt="preview"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-sm font-medium text-slate-700 truncate flex-1">
          {image.name}
        </span>
        <div className="flex gap-2 w-48 shrink-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="정답"
              value={image.answer || ""}
              onChange={(e) => onUpdate(image.id, { answer: e.target.value })}
              className="w-full text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="배점"
              value={image.score || ""}
              onChange={(e) =>
                onUpdate(image.id, {
                  score: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="w-full text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => onRemove(image.id)}
          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors ml-1"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col"
    >
      <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden relative">
        <img
          src={image.preview}
          alt="preview"
          className="w-full h-full object-contain"
        />
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-3 bg-white">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 hover:bg-slate-100 rounded text-slate-400"
          >
            <GripVertical size={18} />
          </div>
          <span className="text-xs text-slate-500 truncate flex-1">
            {image.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              정답
            </label>
            <input
              type="text"
              placeholder="답 입력"
              value={image.answer || ""}
              onChange={(e) => onUpdate(image.id, { answer: e.target.value })}
              className="w-full text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              배점
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="자동"
                value={image.score || ""}
                onChange={(e) =>
                  onUpdate(image.id, {
                    score: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none transition-all pl-2"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                점
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classes = useLiveQuery(() => db.classes.toArray()) || [];

  const [title, setTitle] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(
    searchParams.get("classId") || "",
  );
  const [images, setImages] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [layout, setLayout] = useState("1column"); // 1column, 2column
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [spacing, setSpacing] = useState(20);
  const [imageSize, setImageSize] = useState(100); // percentage

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      preview: URL.createObjectURL(file),
      lastModified: file.lastModified,
      size: file.size,
      answer: "",
      score: "",
      difficulty: 1,
      badge: "기본",
      pageBreak: false,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      preview: URL.createObjectURL(file),
      lastModified: file.lastModified,
      size: file.size,
      answer: "",
      score: "",
      difficulty: 1,
      badge: "기본",
      pageBreak: false,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const updateImage = (id, updates) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img)),
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const sortImages = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sorted = [...images].sort((a, b) => {
      if (key === "name") {
        return direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (key === "date") {
        return direction === "asc"
          ? a.lastModified - b.lastModified
          : b.lastModified - a.lastModified;
      }
      return 0;
    });
    setImages(sorted);
  };

  const distributeScores = (items) => {
    const totalScore = 100;
    let currentTotal = 0;
    let unassignedCount = 0;

    items.forEach((img) => {
      if (img.score && img.score > 0) {
        currentTotal += Number(img.score);
      } else {
        unassignedCount++;
      }
    });

    if (unassignedCount === 0) {
      return items;
    }

    const remainingScore = totalScore - currentTotal;

    if (remainingScore <= 0) {
      return items.map((img) => ({
        ...img,
        score: img.score || 0,
      }));
    }

    const baseScore = Math.floor(remainingScore / unassignedCount);
    const remainder = remainingScore % unassignedCount;

    let remainderCount = remainder;

    return items.map((img) => {
      if (img.score && img.score > 0) return img;

      let newScore = baseScore;
      if (remainderCount > 0) {
        newScore += 1;
        remainderCount--;
      }
      return { ...img, score: newScore };
    });
  };

  const handleSave = async () => {
    if (!title) return alert("시험지 제목을 입력하세요.");
    if (!selectedClassId) return alert("대상 클래스를 선택하세요.");
    if (images.length === 0)
      return alert("최소 하나 이상의 이미지를 추가하세요.");

    const scoredImages = distributeScores(images);

    const newExam = {
      title,
      classId: Number(selectedClassId),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      images: scoredImages.map((img, index) => ({
        id: img.id,
        name: img.name,
        file: img.file,
        order: index,
        answer: img.answer || "",
        score: img.score,
      })),
      config: {
        template: "default",
        layout,
        spacing,
        imageSize,
        date: new Date()
          .toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
          .replace(/\./g, ".")
          .replace(/ /g, ""),
      },
    };

    const id = await db.exams.add(newExam);
    navigate(`/exam/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        뒤로가기
      </button>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex-1 w-full space-y-4">
          <input
            type="text"
            placeholder="시험지 제목을 입력하세요"
            className="text-3xl font-bold bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-slate-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <select
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">클래스 선택</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <CheckCircle2 size={20} />
            시험지 생성
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group cursor-pointer relative"
          >
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*"
            />
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              이미지 업로드
            </h3>
            <p className="text-slate-500 text-sm">
              파일을 드래그하거나 클릭하여 추가하세요 (여러 개 선택 가능)
            </p>
          </div>

          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings2 size={18} className="text-indigo-500" />
                  문제 정렬 ({images.length})
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                      title="갤러리 뷰"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                      title="리스트 뷰"
                    >
                      <List size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sortImages("name")}
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${sortConfig.key === "name" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      이름순{" "}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        ))}
                    </button>
                    <button
                      onClick={() => sortImages("date")}
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${sortConfig.key === "date" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      날짜순{" "}
                      {sortConfig.key === "date" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        ))}
                    </button>
                  </div>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 gap-4"
                      : "flex flex-col gap-0"
                  }
                >
                  <SortableContext
                    items={images.map((img) => img.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {images.map((img) => (
                      <SortableImage
                        key={img.id}
                        image={img}
                        onRemove={removeImage}
                        onUpdate={updateImage}
                        viewMode={viewMode}
                      />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
            </div>
          )}
        </div>

        {/* Right Column: Layout Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-8 sticky top-8">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <LayoutIcon size={20} className="text-indigo-500" />
              레이아웃 설정
            </h3>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700">
                시험지 배열
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLayout("1column")}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${layout === "1column" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-slate-200 text-slate-500"}`}
                >
                  1단 구성
                </button>
                <button
                  onClick={() => setLayout("2column")}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${layout === "2column" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-slate-200 text-slate-500"}`}
                >
                  2단 구성
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">
                  문제 간격 (여백)
                </label>
                <span className="text-xs font-bold text-indigo-600">
                  {spacing}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">
                  이미지 크기
                </label>
                <span className="text-xs font-bold text-indigo-600">
                  {imageSize}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={imageSize}
                onChange={(e) => setImageSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl text-amber-800 text-xs leading-relaxed">
                <Settings2 size={16} className="shrink-0" />
                <p>
                  설정된 레이아웃은 시험지 생성 후에도 개별적으로 수정하고 인쇄
                  미리보기에서 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
