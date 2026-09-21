import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudOff, CheckCircle2, RefreshCw, FolderTree, 
  HardDrive, FileCheck, ArrowUpRight, ShieldCheck 
} from 'lucide-react';
import { SampleHousehold } from '../../types/survey';
import { apiUpdateSample } from '../../services/apiClient';

interface SyncQueuePanelProps {
  samples: SampleHousehold[];
  onSyncCompleted: () => void;
}

export const SyncQueuePanel: React.FC<SyncQueuePanelProps> = ({
  samples,
  onSyncCompleted
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const completedSamples = samples.filter(s => s.surveyStatus === 'completed');
  const syncedSamples = completedSamples.filter(s => s.driveSynced);
  const pendingSyncSamples = completedSamples.filter(s => !s.driveSynced);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      await Promise.all(pendingSyncSamples.map(s => apiUpdateSample(s.id, { driveSynced: true })));
      setSyncFeedback(`Đã đồng bộ thành công ${pendingSyncSamples.length} phiếu (đã lưu trên server dùng chung)!`);
      onSyncCompleted();
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Đồng bộ thất bại. Kiểm tra kết nối mạng và thử lại.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Network & Drive Connection Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
          isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {isOnline ? (
            <Cloud className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <CloudOff className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <span className="font-bold block text-xs">
              {isOnline ? 'Đang Trực Tuyến (Online)' : 'Ngoại Tuyến (Offline)'}
            </span>
            <span className="text-[10px] text-slate-500">
              {isOnline ? 'Sẵn sàng đẩy dữ liệu về Drive' : 'Dữ liệu lưu an toàn trên máy'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center gap-2.5">
          <FolderTree className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold block text-xs">Google Drive Ban Chỉ Đạo</span>
            <span className="text-[10px] text-blue-700">Tự động cấu trúc theo Cây thư mục</span>
          </div>
        </div>
      </div>

      {/* Sync stats card */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">Hàng Đợi Đồng Bộ Thực Địa:</span>
          <button
            onClick={handleSyncAll}
            disabled={isSyncing || !isOnline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang đẩy lên Drive...' : 'Đồng bộ ngay'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Phiếu đã nộp</span>
            <span className="font-bold text-slate-800 text-base">{completedSamples.length}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-emerald-500 block text-[10px]">Đã lên Drive</span>
            <span className="font-bold text-emerald-700 text-base">{syncedSamples.length}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-amber-500 block text-[10px]">Chờ đồng bộ</span>
            <span className="font-bold text-amber-700 text-base">{pendingSyncSamples.length}</span>
          </div>
        </div>

        {syncFeedback && (
          <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* Sync List */}
      <div className="space-y-2">
        <h4 className="font-bold text-slate-800 text-xs">Cấu Trúc Lưu Trữ Trên Drive Của Từng Phiếu:</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {completedSamples.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Chưa có phiếu hoàn thành nào cần đồng bộ.
            </div>
          ) : (
            completedSamples.map(sample => (
              <div
                key={sample.id}
                className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                      {sample.tkcsCode}
                    </span>
                    <span className="font-bold text-slate-900">{sample.householdName}</span>
                  </div>

                  {sample.driveSynced ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Đã lưu Drive
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Đang chờ
                    </span>
                  )}
                </div>

                <div className="font-mono text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded truncate border border-slate-100">
                  📁 {sample.driveSyncPath || `DIEU_TRA_TKCS_2026/XA_${sample.communeCode}/DB_${sample.areaCode}/TKCS_${sample.tkcsCode}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
