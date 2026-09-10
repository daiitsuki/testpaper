import { ChevronLeft, Printer, FileEdit, Trash2, LayoutList, Check, RefreshCw } from "lucide-react";

export default function ExamHeader({
  title,
  subtitle,
  isEditing,
  onTitleChange,
  onBack,
  onEdit,
  onPrint,
  onDelete,
  deleteTooltip = "삭제",
  extraActions,
  onToggleSimpleEdit,
  isSimpleEditing,
  saveStatus = "saved",
}) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
      <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 shrink-0"
          title="뒤로 가기"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col min-w-0 flex-1">
          <input
            value={title}
            onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
            className="text-xl font-bold text-slate-900 bg-transparent hover:bg-slate-100/70 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded px-1.5 py-0.5 outline-none transition-all border border-transparent focus:border-indigo-500 w-full max-w-xl"
            placeholder="시험지 제목 입력"
          />
          {subtitle && (
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {extraActions}

        {/* Real-time auto-save indicator */}
        <div className="flex items-center text-xs font-medium px-2 py-1 select-none">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-slate-400">
              <RefreshCw size={13} className="animate-spin text-indigo-500" />
              저장 중...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Check size={14} className="stroke-[2.5]" />
              자동 저장됨
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-rose-500">
              저장 실패
            </span>
          )}
        </div>

        {onToggleSimpleEdit && (
          <button
            onClick={onToggleSimpleEdit}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors ${
              isSimpleEditing
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 bg-slate-100 hover:bg-slate-200"
            }`}
          >
            <LayoutList size={17} />
            간단 편집
          </button>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors ${
              isEditing
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 bg-slate-100 hover:bg-slate-200"
            }`}
          >
            {isEditing ? (
              <>
                <Check size={17} />
                편집 완료
              </>
            ) : (
              <>
                <FileEdit size={17} />
                문제 편집
              </>
            )}
          </button>
        )}

        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Printer size={17} />
            인쇄하기
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-0.5"
            title={deleteTooltip}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
