import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, MapPin, AlertTriangle, Eye, 
  Search, Filter, Globe, Radio, ExternalLink, CheckCircle2 
} from 'lucide-react';
import { SampleHousehold } from '../../types/survey';

interface FakeIpMonitorProps {
  samples: SampleHousehold[];
  onViewSurvey: (sample: SampleHousehold) => void;
}

export const FakeIpMonitor: React.FC<FakeIpMonitorProps> = ({ samples, onViewSurvey }) => {
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'normal'>('flagged');
  const [searchTerm, setSearchTerm] = useState('');

  const flaggedSamples = samples.filter(s => s.fakeIpDetails?.isFlagged);
  const normalSamples = samples.filter(s => s.fakeIpDetails && !s.fakeIpDetails.isFlagged);

  const displayedSamples = samples.filter(s => {
    const hasDetails = !!s.fakeIpDetails;
    if (!hasDetails) return false;

    if (filterType === 'flagged' && !s.fakeIpDetails?.isFlagged) return false;
    if (filterType === 'normal' && s.fakeIpDetails?.isFlagged) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.tkcsCode.toLowerCase().includes(q) ||
        s.householdName.toLowerCase().includes(q) ||
        (s.assignedEnumeratorName || '').toLowerCase().includes(q) ||
        (s.fakeIpDetails?.detectedIp || '').includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" /> Hệ Thống Giám Sát & Cảnh Báo Fake IP / Định Vị Bất Thường
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động phát hiện và đánh dấu cờ cảnh báo các phiếu điều tra có dấu hiệu dùng IP ảo (VPN/Proxy) hoặc tọa độ GPS lệch ngoài địa bàn điều tra.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-bold text-red-700">
              {flaggedSamples.length} Phiếu Cảnh Báo
            </span>
          </div>
        </div>
      </div>

      {/* Thông tin nghiệp vụ quản trị */}
      <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Nguyên tắc hoạt động của cơ chế Giám sát Fake IP:
        </div>
        <p className="text-slate-700">
          • <strong>Không chặn ĐTV:</strong> Ứng dụng điều tra viên vẫn cho phép nhập và gửi phiếu bình thường để không làm gián đoạn cuộc phỏng vấn ngoài hiện trường.
        </p>
        <p className="text-slate-700">
          • <strong>Đánh dấu ngầm:</strong> Hệ thống tự động ghi nhận IP thực tế, WebRTC, múi giờ, Mock GPS provider và độ sai lệch khoảng cách so với địa bàn được phân công.
        </p>
        <p className="text-slate-700">
          • <strong>Hậu kiểm Quản trị:</strong> Ban giám sát quản trị căn cứ vào danh sách cờ đỏ dưới đây để gọi điện phúc tra hoặc yêu cầu ĐTV giải trình.
        </p>
      </div>

      {/* Thẻ thống kê radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Tổng số phiếu đã kiểm tra IP</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {samples.filter(s => s.fakeIpDetails).length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Được kiểm tra tự động tại thời điểm nộp phiếu</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-200 bg-red-50/20 shadow-xs">
          <span className="text-xs font-bold text-red-600 uppercase block">Số phiếu bị đánh dấu Cờ Đỏ</span>
          <div className="mt-2 text-2xl font-bold text-red-700">
            {flaggedSamples.length}
          </div>
          <p className="text-xs text-red-600/80 mt-1">Phát hiện địa chỉ IP VPN/Proxy hoặc GPS ngoại vùng</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase block">Số phiếu Hợp lệ</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {normalSamples.length}
          </div>
          <p className="text-xs text-emerald-600/80 mt-1">Tọa độ nằm đúng trong phạm vi địa bàn điều tra</p>
        </div>
      </div>

      {/* Bộ lọc và Bảng danh sách giám sát */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('flagged')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'flagged' ? 'bg-red-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Chỉ xem cảnh báo Fake IP ({flaggedSamples.length})
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Tất cả ({samples.filter(s => s.fakeIpDetails).length})
            </button>
            <button
              onClick={() => setFilterType('normal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'normal' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Hợp lệ ({normalSamples.length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã TKCS, ĐTV, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Mã TKCS</th>
                <th className="py-3 px-4">Tên Hộ / Cơ Sở</th>
                <th className="py-3 px-3">Xã / Địa Bàn</th>
                <th className="py-3 px-4">Điều Tra Viên</th>
                <th className="py-3 px-3">Địa Chỉ IP</th>
                <th className="py-3 px-3">Tọa Độ GPS</th>
                <th className="py-3 px-3 text-right">Sai Lệch (Km)</th>
                <th className="py-3 px-4">Trạng Thái Đánh Dấu</th>
                <th className="py-3 px-4">Lý Do Cảnh Báo</th>
                <th className="py-3 px-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedSamples.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500">
                    Không có bản ghi nào phù hợp.
                  </td>
                </tr>
              ) : (
                displayedSamples.map(s => {
                  const ip = s.fakeIpDetails!;
                  const isFlagged = ip.isFlagged;
                  return (
                    <tr key={s.id} className={isFlagged ? 'bg-red-50/40 hover:bg-red-50/70 transition-colors' : 'hover:bg-slate-50'}>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{s.tkcsCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-[180px] truncate" title={s.householdName}>
                        {s.householdName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {s.communeCode} - {s.areaCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {s.assignedEnumeratorName || 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {ip.detectedIp}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {ip.gpsCoordinates ? (
                          <span>{ip.gpsCoordinates.latitude.toFixed(4)}, {ip.gpsCoordinates.longitude.toFixed(4)}</span>
                        ) : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={ip.distanceDeviationKm && ip.distanceDeviationKm > 10 ? 'text-red-700' : 'text-slate-700'}>
                          {ip.distanceDeviationKm ? `${ip.distanceDeviationKm.toFixed(1)} km` : '< 0.5 km'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                            CẢNH BÁO FAKE IP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Hợp lệ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-[220px]">
                        {isFlagged ? (
                          <span className="text-red-700 font-medium">{ip.reason || 'IP Proxy / Tọa độ lệch'}</span>
                        ) : (
                          <span className="text-slate-400">Định vị đúng địa bàn</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onViewSurvey(s)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
