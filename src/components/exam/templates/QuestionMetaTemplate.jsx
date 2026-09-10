import React from 'react';

export default function QuestionMetaTemplate({ img, config }) {
  if (config?.template === 'jschool') {
    return (
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          {img?.badge && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
              {img.badge}
            </span>
          )}
          {config?.showDifficulty !== false && (
            <div className="flex text-amber-400 text-xs">
              {[1, 2, 3].map((star) => (
                <span key={star}>{star <= (img?.difficulty || 1) ? '★' : '☆'}</span>
              ))}
            </div>
          )}
        </div>
        {img?.questionId && (
          <span className="text-[10px] font-bold text-slate-400">
            {img.questionId}
          </span>
        )}
      </div>
    );
  }

  return null;
}
