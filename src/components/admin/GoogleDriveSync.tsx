import React, { useState, useEffect } from 'react';
import {
  Cloud, RefreshCw, CheckCircle2, ShieldCheck, ExternalLink,
  AlertTriangle, FileSpreadsheet, DatabaseBackup, Loader2
} from 'lucide-react';
import { SampleHousehold } from '../../types/survey';
import { apiGetDriveStatus, apiDriveBackup, apiDriveExportReports } from '../../services/apiClient';

interface GoogleDriveSyncProps {
  samples: SampleHousehold[];
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ samples }) => {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [configured, setConfigured] = useState(false);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState<{ fileName: string; fileLink: string; counts: any } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const [isExportingReports, setIsExportingReports] = useState(false);
  const [reportFiles, setReportFiles] = useState<{ communeCode: string; communeName: string; fileName: string; fileLink: string }[] | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await apiGetDriveStatus();
      setConfigured(res.configured);
    } catch {
      setConfigured(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupError(null);
    setBackupResult(null);
    try {
      const res = await apiDriveBackup();
      setBackupResult({ fileName: res.fileName, fileLink: res.fileLink, counts: res.counts });
    } catch (err: any) {
      setBackupError(err?.message || 'Sao lưu thất bại.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportReports = async () => {
    setIsExportingReports(true);
    setReportError(null);
    setReportFiles(null);
    try {
      const res = await apiDriveExportReports();
      setReportFiles(res.files);
    } catch (err: any) {
      setReportError(err?.message || 'Xuất báo cáo thất bại.');
    } finally {
      setIsExportingReports(false);
    }
  };

  const completedCount = samples.filter(s => s.surveyStatus === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" /> Sao Lưu & Báo Cáo Lên Google Drive Của Anh
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Dữ liệu chính vẫn lưu trên server (nhanh, an toàn khi nhiều ĐTV cùng ghi). Mục này chỉ
          đẩy <strong>bản sao lưu</strong> và <strong>báo cáo</strong> thật sang Google Drive của anh để phòng khi mất dữ liệu và tiện xem.
        </p>
      </div>

      {checkingStatus ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 p-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra kết nối Google Drive...
        </div>
      ) : !configured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 text-sm">Chưa kết nối Google Drive</h3>
            <p className="text-xs text-amber-800 mt-1">
              Server chưa được cấu hình để đẩy dữ liệu lên Google Drive. Cần thiết lập 1 lần: tạo
              Service Account trên Google Cloud, chia sẻ 1 thư mục Drive cho nó, rồi khai báo 2 biến
              môi trường <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_KEY_BASE64</code> và{' '}
              <code className="bg-amber-100 px-1 rounded">GOOGLE_DRIVE_FOLDER_ID</code> trên server (Render).
              Xem chi tiết từng bước trong file <strong>HUONG_DAN_DEPLOY.md</strong> đi kèm mã nguồn.
            </p>
            <button
              onClick={loadStatus}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Đã cấu hình xong, kiểm tra lại
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-emerald-900 text-sm">Đã kết nối Google Drive</h3>
            <p className="text-xs text-emerald-700">
              Server tự động sao lưu định kỳ mỗi 6 giờ. Anh cũng có thể bấm sao lưu/xuất báo cáo ngay bên dưới.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sao lưu toàn bộ dữ liệu */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <DatabaseBackup className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Sao Lưu Toàn Bộ Dữ Liệu</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Đẩy 1 file JSON chứa toàn bộ ĐTV, Bảng kê hộ, Hộ mẫu và phiếu điều tra hiện có lên thư mục{' '}
            <code className="bg-slate-100 px-1 rounded">Sao_Luu_Du_Lieu_TKCS</code> trên Drive — dùng để khôi phục nếu server gặp sự cố.
          </p>
          <button
            onClick={handleBackup}
            disabled={!configured || isBackingUp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isBackingUp ? 'Đang sao lưu...' : 'Sao Lưu Ngay'}
          </button>

          {backupError && <p className="text-xs text-red-600 mt-2">{backupError}</p>}
          {backupResult && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <p className="text-slate-700">
                Đã sao lưu <strong>{backupResult.counts.enumerators}</strong> ĐTV,{' '}
                <strong>{backupResult.counts.listings}</strong> hộ trong bảng kê,{' '}
                <strong>{backupResult.counts.samples}</strong> hộ mẫu.
              </p>
              {backupResult.fileLink && (
                <a
                  href={backupResult.fileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-blue-600 hover:underline font-semibold"
                >
                  Mở file trên Google Drive <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Xuất báo cáo Excel theo xã */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Xuất Báo Cáo Excel Theo Từng Xã</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Tạo 1 file Excel danh sách hộ mẫu (trạng thái, tiến độ, ĐTV phụ trách) cho từng xã, đẩy vào
            thư mục <code className="bg-slate-100 px-1 rounded">Bao_Cao_TKCS/&lt;Xã&gt;</code> trên Drive để anh xem trực tiếp trên Drive.
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            Hiện có {completedCount}/{samples.length} phiếu đã hoàn thành trong hệ thống.
          </p>
          <button
            onClick={handleExportReports}
            disabled={!configured || isExportingReports}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {isExportingReports ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {isExportingReports ? 'Đang xuất báo cáo...' : 'Xuất Báo Cáo Ngay'}
          </button>

          {reportError && <p className="text-xs text-red-600 mt-2">{reportError}</p>}
          {reportFiles && reportFiles.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
              {reportFiles.map(f => (
                <a
                  key={f.communeCode}
                  href={f.fileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs transition-colors"
                >
                  <span className="text-slate-700 truncate">{f.communeName} — {f.fileName}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
