import React from 'react';
import { 
  CheckCircle2, AlertCircle, AlertTriangle, X, 
  ArrowRight, ShieldCheck, FileCheck, HelpCircle 
} from 'lucide-react';
import { ValidationResult } from '../../utils/surveyValidator';

interface LogicAuditModalProps {
  result: ValidationResult;
  onNavigateToSection: (sectionNumber: number) => void;
  onClose: () => void;
}

export const LogicAuditModal: React.FC<LogicAuditModalProps> = ({
  result,
  onNavigateToSection,
  onClose
}) => {
  const { isValid, errors, warnings, passedCount, totalChecks } = result;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className={`p-4 text-white flex items-center justify-between ${
          isValid ? 'bg-emerald-700' : 'bg-rose-700'
        }`}>
          <div className="flex items-center gap-2.5">
            {isValid ? (
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-200" />
            )}
            <div>
              <h3 className="font-bold text-sm">Kiểm Tra Tính Logic Của Phiếu Điều Tra</h3>
              <p className="text-[11px] text-white/80">Đối soát quy chuẩn Phương án Thống kê cơ sở cá thể</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/20 rounded-lg text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary metric card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2.5 rounded-xl border ${
              errors.length === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <span className="block text-[10px] uppercase font-bold tracking-wider">Lỗi Logic</span>
              <span className="text-xl font-black">{errors.length}</span>
              <span className="block text-[10px] mt-0.5">{errors.length === 0 ? 'Tuyệt vời, không có lỗi' : 'Bắt buộc phải sửa'}</span>
            </div>

            <div className="p-2.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <span className="block text-[10px] uppercase font-bold tracking-wider">Cảnh Báo</span>
              <span className="text-xl font-black">{warnings.length}</span>
              <span className="block text-[10px] mt-0.5">Cần xác minh lại</span>
            </div>

            <div className="p-2.5 rounded-xl border bg-blue-50 border-blue-200 text-blue-800">
              <span className="block text-[10px] uppercase font-bold tracking-wider">Chỉ Tiêu Chuẩn</span>
              <span className="text-xl font-black">{passedCount} / {totalChecks}</span>
              <span className="block text-[10px] mt-0.5">Đã đạt yêu cầu</span>
            </div>
          </div>
        </div>

        {/* List of issues */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Lỗi đỏ */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Các Lỗi Vi Phạm Phương Án ({errors.length})
              </h4>
              <div className="space-y-2">
                {errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-rose-900 bg-rose-200/60 px-2 py-0.5 rounded text-[10px]">
                        {err.sectionName}
                      </span>
                      <button
                        onClick={() => {
                          onNavigateToSection(err.section);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline"
                      >
                        Sửa ngay <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {err.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cảnh báo vàng */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Cảnh Báo Cần Chú Ý ({warnings.length})
              </h4>
              <div className="space-y-2">
                {warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded text-[10px]">
                        {warn.sectionName}
                      </span>
                      <button
                        onClick={() => {
                          onNavigateToSection(warn.section);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline"
                      >
                        Xem xét <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {warn.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Khi hoàn toàn hợp lệ */}
          {errors.length === 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-sm">
                Phiếu điều tra đã vượt qua tất cả các bài kiểm tra logic!
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Số liệu đã cân đối đầy đủ về Lao động, Doanh thu, 6 khoản Chi phí chi tiết, Vốn kinh doanh và Định vị GPS. Bạn có thể tự tin nộp phiếu lên Google Drive của Ban chỉ đạo.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Đã hiểu & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
