import React from 'react';

export default function AnswerKeyTemplate({ title, images, config, isBottom = false }) {
  const hasScore = !(config?.template === 'jschool' && config?.showScore === false);
  const half = Math.ceil(images.length / 2);
  const rows = [];
  for (let i = 0; i < half; i++) {
    const img1 = images[i];
    const img2 = images[i + half];
    rows.push({
      idx1: i + 1,
      ans1: img1?.answer || "-",
      score1: img1?.score || "-",
      idx2: img2 ? i + 1 + half : "",
      ans2: img2 ? (img2.answer || "-") : "",
      score2: img2 ? (img2.score || "-") : ""
    });
  }

  return (
    <>
      {config?.template === 'jschool' ? (
        <div className={`w-full flex flex-col mb-8 border-b-2 border-dashed border-slate-300 pb-4 ${isBottom ? 'mt-8 border-t-2 pt-8' : ''}`}>
          <div className="w-full bg-slate-900 text-white text-[10px] font-bold py-1 px-4 mb-4 flex justify-between rounded-t-sm">
            <span>J SCHOOL EDU • WEEKLY WORKSHEET</span>
          </div>
          <div className="flex items-center gap-4 px-2">
            <h1 className="text-3xl font-black tracking-tighter m-0">
              {title} - {config?.showScore === false ? '정답표' : '정답 및 배점'}
            </h1>
            {config?.showWeek !== false && (
              <span className="bg-blue-600 text-white font-black px-3 py-1 rounded text-sm">
                WEEK {config?.weekNumber || '01'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={`border-b-4 border-double border-slate-900 pb-4 mb-8 text-center ${isBottom ? 'mt-8 border-t-4 pt-8' : ''}`}>
          <h1 className="text-2xl font-black mb-2 tracking-tighter">
            {title} - {config?.showScore === false ? '정답표' : '정답 및 배점'}
          </h1>
        </div>
      )}

      <table className="w-full border-collapse text-center text-sm border border-slate-200">
        <thead className="bg-slate-50 text-slate-700 font-bold">
          <tr>
            <th className="border border-slate-200 p-2">번호</th>
            <th className="border border-slate-200 p-2">정답</th>
            {hasScore && (
              <th className="border border-slate-200 p-2">배점</th>
            )}
            <th className="border border-slate-200 p-2">번호</th>
            <th className="border border-slate-200 p-2">정답</th>
            {hasScore && (
              <th className="border border-slate-200 p-2">배점</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border border-slate-200 p-2 font-bold">{row.idx1}</td>
              <td className="border border-slate-200 p-2">{row.ans1}</td>
              {hasScore && (
                <td className="border border-slate-200 p-2">{row.score1}</td>
              )}
              <td className="border border-slate-200 p-2 font-bold">{row.idx2}</td>
              <td className="border border-slate-200 p-2">{row.ans2}</td>
              {hasScore && (
                <td className="border border-slate-200 p-2">{row.score2}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
