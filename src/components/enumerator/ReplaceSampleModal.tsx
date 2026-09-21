import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import { SampleHousehold } from '../../types/survey';
import { apiReplaceSample } from '../../services/apiClient';

interface ReplaceSampleModalProps {
  officialSample: SampleHousehold;
  availableReserveSamples: SampleHousehold[];
  onSuccess: () => void;
  onClose: () => void;
}

export const ReplaceSampleModal: React.FC<ReplaceSampleModalProps> = ({
  officialSample,
  availableReserveSamples,
  onSuccess,
  onClose
}) => {
  const [selectedReserveId, setSelectedReserveId] = useState<string>(
    availableReserveSamples[0]?.id || ''
  );
  const [reasonCategory, setReasonCategory] = useState<string>(
    '1. Cơ sở đã ngừng hoạt động hẳn/giải thể'
  );
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lọc mẫu dự phòng cùng xã/địa bàn ưu tiên
  const sameAreaReserve = availableReserveSamples.filter(
    r => r.communeCode === officialSample.communeCode && r.areaCode === officialSample.areaCode
  );
  const sameCommuneReserve = availableReserveSamples.filter(
    r => r.communeCode === officialSample.communeCode && r.areaCode !== officialSample.areaCode
  );

  const handleConfirmReplace = async () => {
    if (!selectedReserveId) {
      alert('Vui lòng chọn một hộ trong danh sách mẫu dự phòng để thay thế.');
      return;
    }

    const fullReason = `${reasonCategory}. ${customReason.trim()}`.trim();
    setIsSubmitting(true);

    try {
      await apiReplaceSample(officialSample.id, selectedReserveId, fullReason);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi thực hiện đổi mẫu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-bold text-sm">Thủ Tục Thay Thế Mẫu Điều Tra</h3>
              <p className="text-[11px] text-amber-100">Kích hoạt Mẫu dự phòng theo Quy định của Phương án</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-700 rounded-lg text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Thông tin hộ chính thức bị thay thế */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
            <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block">
              Mẫu chính thức cần thay thế:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-amber-900">{officialSample.tkcsCode}</span>
              <span className="text-[11px] text-amber-800 font-semibold">Địa bàn: {officialSample.areaCode}</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{officialSample.householdName}</p>
            <p className="text-slate-600">Chủ hộ: {officialSample.ownerName || officialSample.householdName}</p>
            <p className="text-slate-500 text-[11px]">{officialSample.address}</p>
          </div>

          {/* Lý do thay thế */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">Lý do thay thế (Quy định phương án):</label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              <option value="1. Cơ sở đã ngừng hoạt động hẳn/giải thể">1. Cơ sở đã ngừng hoạt động hẳn/giải thể</option>
              <option value="2. Cơ sở đã chuyển hẳn khỏi địa bàn điều tra">2. Cơ sở đã chuyển hẳn khỏi địa bàn điều tra</option>
              <option value="3. Không tìm thấy cơ sở sau khi xác minh địa phương">3. Không tìm thấy cơ sở sau khi xác minh địa phương</option>
              <option value="4. Chủ hộ từ chối cung cấp thông tin sau nhiều lần vận động">4. Chủ hộ từ chối cung cấp thông tin sau nhiều lần vận động</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">Biên bản / Chi tiết xác minh thực địa:</label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Ghi rõ thời gian xác minh, người làm chứng (trưởng thôn/tổ trưởng dân phố)..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Chọn hộ mẫu dự phòng thay thế */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">
              Chọn hộ mẫu dự phòng thay thế (Thuộc xã {officialSample.communeName}):
            </label>

            {availableReserveSamples.length === 0 ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-center">
                Không còn hộ mẫu dự phòng nào khả dụng trong xã này. Vui lòng liên hệ Quản trị viên để chọn thêm mẫu.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...sameAreaReserve, ...sameCommuneReserve].map(r => {
                  const isSelected = r.id === selectedReserveId;
                  const isSameArea = r.areaCode === officialSample.areaCode;

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReserveId(r.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-700">{r.tkcsCode}</span>
                          {isSameArea ? (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              Cùng ĐB {r.areaCode} (Ưu tiên)
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              ĐB {r.areaCode}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="font-bold text-slate-900 mt-1">{r.householdName}</p>
                      <p className="text-[11px] text-slate-500">{r.address} • {r.industryName}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleConfirmReplace}
            disabled={isSubmitting || availableReserveSamples.length === 0}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Đổi Mẫu'}
          </button>
        </div>

      </div>
    </div>
  );
};
