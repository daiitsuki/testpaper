import { ChevronLeft, Printer, FileEdit, Save, Trash2 } from "lucide-react";

export default function ExamHeader({
  title,
  isEditing,
  onTitleChange,
  onBack,
  onSave,
  onEdit,
  onPrint,
  onDelete,
  deleteTooltip = "삭제",
}) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        {isEditing ? (
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-xl font-bold border-b-2 border-indigo-600 outline-none px-1"
          />
        ) : (
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Save size={18} />
              저장
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-2"
              title={deleteTooltip}
            >
              <Trash2 size={20} />
              삭제
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              <FileEdit size={18} />
              수정
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              <Printer size={18} />
              인쇄하기
            </button>
          </>
        )}
      </div>
    </header>
  );
}
