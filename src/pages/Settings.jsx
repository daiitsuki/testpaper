import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, AlertCircle, CheckCircle2, ChevronLeft, Settings as SettingsIcon } from 'lucide-react';
import { db } from '../db/db';
import { exportDB, importDB } from 'dexie-export-import';

export default function Settings() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      setStatus({ type: 'info', message: '데이터를 내보내는 중...' });
      
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.download = `testpaper_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus({ type: 'success', message: '데이터 내보내기가 완료되었습니다.' });
    } catch (error) {
      console.error('Export failed:', error);
      setStatus({ type: 'error', message: '데이터 내보내기에 실패했습니다.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('현재 저장된 모든 데이터가 덮어씌워집니다. 계속하시겠습니까?')) {
      e.target.value = '';
      return;
    }

    try {
      setIsProcessing(true);
      setStatus({ type: 'info', message: '데이터를 가져오는 중...' });
      
      // Clear existing data or dexie-export-import can overwrite
      await importDB(file, {
        overwriteValues: true,
        clearTablesBeforeImport: true
      });
      
      setStatus({ type: 'success', message: '데이터를 성공적으로 가져왔습니다. 페이지를 새로고침합니다.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Import failed:', error);
      setStatus({ type: 'error', message: '데이터 가져오기에 실패했습니다. 올바른 백업 파일인지 확인해주세요.' });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        뒤로가기
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
          <SettingsIcon size={24} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">설정</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-800 mb-2">데이터 백업 및 복구</h2>
          <p className="text-slate-500 text-sm">
            모든 시험지, 클래스, 학생 정보를 파일로 저장하거나 이전에 저장한 파일에서 복구할 수 있습니다.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {status.message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 ${
              status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
              'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all group disabled:opacity-50"
            >
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <Download className="text-indigo-600" size={24} />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800">데이터 내보내기</p>
                <p className="text-xs text-slate-400 mt-1">JSON 파일로 다운로드</p>
              </div>
            </button>

            <label className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group cursor-pointer ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="text-emerald-600" size={24} />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800">데이터 가져오기</p>
                <p className="text-xs text-slate-400 mt-1">백업 파일 선택</p>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
        
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
          <div className="flex gap-3 text-slate-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              가져오기를 사용하면 현재 브라우저에 저장된 데이터가 모두 삭제되고 파일의 내용으로 교체됩니다. 
              중요한 데이터가 있다면 미리 '내보내기'를 통해 백업해두시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
