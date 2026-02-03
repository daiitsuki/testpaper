import { Maximize2, X } from 'lucide-react';

export default function ExamPreview({ 
  title, 
  config, 
  images, 
  isEditing, 
  onImageScale, 
  onImageDelete 
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-200">
      <div className="flex flex-col items-center gap-8 pb-16">
        <div className="a4-paper bg-white shadow-2xl min-h-[297mm] w-[210mm] p-[20mm] box-border relative overflow-hidden">
          {/* Header */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-8 text-center">
            <h1 className="text-3xl font-black mb-2 tracking-tighter">{title}</h1>
            <div className="text-right text-lg font-bold">
              <span>이름: ________</span>
            </div>
          </div>

          {/* Content */}
          <div 
            className={`questions-container grid ${config?.layout === '2column' ? 'grid-cols-2 gap-x-12 relative' : 'grid-cols-1'} gap-y-0`}
          >
            {/* Visual column divider for 2-column layout */}
            {config?.layout === '2column' && (
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -translate-x-1/2 pointer-events-none" />
            )}

            {images.map((img, idx) => (
              <div 
                key={img.id} 
                style={{ marginBottom: `${config?.spacing}px` }}
                className="question-item break-inside-avoid relative group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="font-bold text-lg leading-none pt-1">{idx + 1}.</span>
                  <div className="flex-1 relative">
                    <div className="relative inline-block w-full text-center">
                      <img 
                        src={img.url} 
                        alt={`Q${idx + 1}`} 
                        style={{ width: `${img.scale}%` }}
                        className="max-w-full h-auto mx-auto"
                      />
                      
                      {/* Editing Overlays */}
                      {isEditing && (
                        <>
                          <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-400/50 rounded-lg pointer-events-none transition-all" />
                          <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-10">
                            <div className="bg-white shadow-lg rounded-lg p-2 flex items-center gap-2 border border-slate-100">
                              <Maximize2 size={14} className="text-indigo-500" />
                              <input 
                                type="range" min="20" max="100" step="5"
                                value={img.scale}
                                onChange={(e) => onImageScale(img.id, e.target.value)}
                                className="w-24 accent-indigo-600 h-1.5"
                              />
                              <span className="text-xs font-bold text-slate-600 w-8 text-right">{img.scale}%</span>
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
            ))}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
            <span className="text-xs text-slate-400 font-medium">실제 인쇄 시 다음 페이지로 이어집니다</span>
          </div>
        </div>
      </div>
    </div>
  );
}
