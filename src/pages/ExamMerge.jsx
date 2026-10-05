import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, FileText, CheckSquare, Square, Save, Layers, ZoomIn, X } from "lucide-react";
import { db } from "../db/db";

export default function ExamMerge() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = Number(searchParams.get("classId"));
  const idsParam = searchParams.get("ids");
  const examIds = idsParam ? idsParam.split(',').map(Number) : [];

  const [sourceExams, setSourceExams] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [title, setTitle] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const loadExams = async () => {
      if (!classId || examIds.length < 2) {
        alert("잘못된 접근입니다.");
        navigate(-1);
        return;
      }

      const exams = await Promise.all(examIds.map(id => db.exams.get(id)));
      const validExams = exams.filter(Boolean);
      
      if (validExams.length < 2) {
        alert("합칠 수 있는 시험지가 부족합니다.");
        navigate(-1);
        return;
      }

      // Generate a default title: "Exam 1 + Exam 2 + ..."
      const defaultTitle = validExams.map(ex => ex.title).join(' + ');
      setTitle(defaultTitle.length > 40 ? defaultTitle.substring(0, 37) + '...' : defaultTitle);
      
      setSourceExams(validExams);

      const flattened = [];
      const urlsToRevoke = [];
      const initialSelected = new Set();
      
      validExams.forEach(exam => {
        exam.images.forEach(img => {
          // Generate a truly unique ID for the new exam context
          const uniqueId = `merge_${exam.id}_${img.id}_${crypto.randomUUID().slice(0, 8)}`;
          const url = URL.createObjectURL(img.file);
          urlsToRevoke.push(url);

          flattened.push({
            ...img,
            id: uniqueId,
            url, // Store persistent URL for both thumbnail and modal
            originalExamTitle: exam.title // Keep track of source for UI purposes
          });
          initialSelected.add(uniqueId);
        });
      });

      setAllImages(flattened);
      setSelectedIds(initialSelected);
      setIsReady(true);
      
      // Cleanup URLs on unmount
      return () => {
        urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
      };
    };

    const cleanup = loadExams();
    return () => {
      cleanup.then(cleanupFn => {
        if (typeof cleanupFn === 'function') cleanupFn();
      });
    };
  }, [classId, idsParam, navigate]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleMerge = async () => {
    if (selectedIds.size === 0) {
      return alert("최소 하나 이상의 문항을 선택하세요.");
    }
    if (!title.trim()) {
      return alert("새로 생성될 시험지 제목을 입력하세요.");
    }

    // Prepare final images array (keep only selected ones, reorder them)
    const finalImages = allImages
      .filter(img => selectedIds.has(img.id))
      .map((img, index) => {
        // Strip out temporary UI fields and persistent URL
        const { originalExamTitle, url, ...rest } = img;
        return {
          ...rest,
          order: index
        };
      });

    // We use the config of the very first exam as base config
    const baseConfig = sourceExams[0]?.config || {
      school: "",
      grade: "",
      subject: "",
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/ /g, '')
    };

    const newExamData = {
      title: title.trim(),
      classId: classId,
      images: finalImages,
      config: baseConfig,
      createdAt: Date.now()
    };

    try {
      const newExamId = await db.exams.add(newExamData);
      
      // Navigate to the newly created exam
      navigate(`/exam/${newExamId}`);
    } catch (err) {
      console.error("Failed to merge exams:", err);
      alert("시험지를 합치는 중 오류가 발생했습니다.");
    }
  };

  if (!isReady) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto pb-32">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        뒤로가기
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
            <Layers size={16} />
            시험지 병합
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="새 시험지 제목"
            className="w-full text-3xl md:text-4xl font-bold bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-2 placeholder-slate-300 transition-colors"
          />
        </div>
        <button
          onClick={handleMerge}
          disabled={selectedIds.size === 0}
          className="shrink-0 flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save size={20} />
          {selectedIds.size}문제로 합치기
        </button>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-8 text-sm text-blue-800 flex items-center justify-between">
        <p>합치고 싶은 문항만 선택하세요. 기본적으로 모든 문항이 선택되어 있습니다.</p>
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedIds(new Set(allImages.map(i => i.id)))}
            className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            전체 선택
          </button>
          <button 
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors text-slate-600"
          >
            전체 해제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allImages.map((img) => {
          const isSelected = selectedIds.has(img.id);

          return (
            <div
              key={img.id}
              onClick={() => toggleSelect(img.id)}
              className={`group relative aspect-[3/4] rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? "border-indigo-500 shadow-md shadow-indigo-100"
                  : "border-slate-200 hover:border-indigo-300 opacity-60"
              }`}
            >
              <img
                src={img.url}
                alt="문항 썸네일"
                className="w-full h-full object-cover bg-white"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute top-3 left-3 z-10 transition-transform group-hover:scale-110">
                {isSelected ? (
                  <CheckSquare className="text-indigo-500 fill-white" size={24} />
                ) : (
                  <Square className="text-white drop-shadow-md" size={24} />
                )}
              </div>

              {/* Zoom Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage(img.url);
                }}
                className="absolute top-3 right-3 z-10 p-1.5 bg-slate-900/50 hover:bg-slate-900 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                title="크게 보기"
              >
                <ZoomIn size={18} />
              </button>

              {/* Source Exam Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/70 backdrop-blur-sm p-2 text-xs text-white truncate text-center">
                {img.originalExamTitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center p-4 md:p-12 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="크게 보기" 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>
      )}
    </div>
  );
}
