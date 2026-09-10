import React from 'react';

export default function ExamHeaderTemplate({ title, config }) {
  if (config?.template === 'jschool') {
    return (
      <div className="w-full flex flex-col mb-8 border-b-2 border-dashed border-slate-300 pb-4 box-border">
        <div className="w-full bg-slate-900 text-white text-[10pt] font-bold py-1 px-4 mb-4 flex justify-between box-border rounded-t-sm">
          <span>J SCHOOL EDU • WEEKLY WORKSHEET</span>
        </div>
        <div className="flex justify-between items-end px-2">
          <div className="flex items-center gap-4">
            <h1 className="text-[28pt] font-black m-0 tracking-tighter leading-none">
              {title}
            </h1>
            {config?.showWeek !== false && (
              <span className="bg-blue-600 text-white font-black px-3 py-1 rounded text-[12pt] leading-tight">
                WEEK {config?.weekNumber || '01'}
              </span>
            )}
          </div>
          <div className="flex gap-6 text-[11pt] font-bold text-slate-700">
            {config?.showDate !== false && (
              <span>
                일자: {config?.date || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/ /g, '')}
              </span>
            )}
            <span>이름: ________________</span>
          </div>
        </div>
      </div>
    );
  }

  // Default template
  return (
    <div className="text-center border-b-4 border-double border-black pb-2 mb-8 box-border">
      <h1 className="text-[24pt] font-black m-0 mb-2 tracking-tighter leading-tight">
        {title}
      </h1>
      <div className="flex justify-end gap-8 text-[12pt] font-bold mb-2">
        <span>이름: ________________</span>
      </div>
    </div>
  );
}
