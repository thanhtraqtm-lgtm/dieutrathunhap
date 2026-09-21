import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  CheckCircle2, Clock, AlertTriangle, XCircle, Search, Filter, 
  Eye, FileSpreadsheet, ShieldAlert, ArrowUpRight, Building2, MapPin
} from 'lucide-react';
import { SampleHousehold, SurveyStatus } from '../../types/survey';
import { StorageService } from '../../services/storageService';

interface ProgressTrackerProps {
  samples: SampleHousehold[];
  onViewSurvey: (sample: SampleHousehold) => void;
  onRefresh: () => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ samples, onViewSurvey }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedEnumerator, setSelectedEnumerator] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFakeIpOnly, setShowFakeIpOnly] = useState(false);

  // Danh sách xã và địa bàn duy nhất
  const communes = Array.from(new Set(samples.map(s => JSON.stringify({ code: s.communeCode, name: s.communeName })))).map(s => JSON.parse(s));
  const areas = Array.from(new Set(samples.map(s => s.areaCode))).sort();
  const enumerators = Array.from(new Set(samples.map(s => s.assignedEnumeratorName).filter(Boolean)));

  // Lọc dữ liệu
  const filteredSamples = samples.filter(s => {
    const matchSearch = 
      s.tkcsCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.householdName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.assignedEnumeratorName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchCommune = selectedCommune === 'all' || s.communeCode === selectedCommune;
    const matchArea = selectedArea === 'all' || s.areaCode === selectedArea;
    const matchEnumerator = selectedEnumerator === 'all' || s.assignedEnumeratorName === selectedEnumerator;
    const matchStatus = selectedStatus === 'all' || s.surveyStatus === selectedStatus;
    const matchFakeIp = !showFakeIpOnly || s.fakeIpDetails?.isFlagged;

    return matchSearch && matchCommune && matchArea && matchEnumerator && matchStatus && matchFakeIp;
  });

  // Số liệu tổng quan KPI
  const totalHouseholds = samples.length;
  const completedCount = samples.filter(s => s.surveyStatus === 'completed').length;
  const inProgressCount = samples.filter(s => s.surveyStatus === 'in_progress').length;
  const notStartedCount = samples.filter(s => s.surveyStatus === 'not_started').length;
  const refusedCount = samples.filter(s => s.surveyStatus === 'refused' || s.surveyStatus === 'moved').length;
  const flaggedCount = samples.filter(s => s.fakeIpDetails?.isFlagged).length;
  const overallPercentage = totalHouseholds > 0 ? Math.round((completedCount / totalHouseholds) * 100) : 0;

  // Dữ liệu biểu đồ theo xã
  const chartDataByCommune = communes.map((c: { code: string; name: string }) => {
    const list = samples.filter(s => s.communeCode === c.code);
    const comp = list.filter(s => s.surveyStatus === 'completed').length;
    return {
      name: c.name.replace('Xã ', ''),
      'Tổng số': list.length,
      'Hoàn thành': comp,
      'Tỷ lệ (%)': list.length > 0 ? Math.round((comp / list.length) * 100) : 0
    };
  });

  // Dữ liệu biểu đồ trạng thái
  const statusPieData = [
    { name: 'Đã hoàn thành', value: completedCount, color: '#10B981' },
    { name: 'Đang điều tra', value: inProgressCount, color: '#3B82F6' },
    { name: 'Chưa thực hiện', value: notStartedCount, color: '#9CA3AF' },
    { name: 'Từ chối / Vắng', value: refusedCount, color: '#EF4444' }
  ].filter(d => d.value > 0);

  const getStatusBadge = (status: SurveyStatus, isFakeIp?: boolean) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" /> Đang điều tra
          </span>
        );
      case 'refused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Từ chối
          </span>
        );
      case 'moved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Đã chuyển đi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Chưa điều tra
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Thẻ KPI trên cùng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số hộ mẫu</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-lg"><Building2 className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalHouseholds}</span>
            <span className="text-xs text-slate-500">hộ trong mẫu</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Bao gồm mẫu chính thức và dự phòng</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Tiến độ hoàn thành</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{overallPercentage}%</span>
            <span className="text-xs text-emerald-600 font-medium">({completedCount}/{totalHouseholds})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${overallPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Đang điều tra</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">{inProgressCount}</span>
            <span className="text-xs text-slate-500">hộ đang phỏng vấn</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Đang thực hiện ngoài thực địa</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Chưa làm / Vắng</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{notStartedCount + refusedCount}</span>
            <span className="text-xs text-slate-500">hộ còn lại</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Cần phân công hoặc kích hoạt mẫu thay thế</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Cảnh báo Fake IP</span>
            <span className="p-2 bg-red-100 text-red-700 rounded-lg"><ShieldAlert className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-700">{flaggedCount}</span>
            <span className="text-xs text-red-600 font-semibold">phiếu bị đánh dấu</span>
          </div>
          <p className="mt-1 text-xs text-red-600/80">Phát hiện IP Proxy hoặc GPS lệch vùng</p>
        </div>
      </div>

      {/* Biểu đồ phân tích tiến độ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tiến độ điều tra theo từng Xã</h3>
              <p className="text-xs text-slate-500">So sánh số lượng mẫu cần làm và số hộ đã điều tra xong</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">Thời gian thực</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByCommune} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="Tổng số" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Hoàn thành" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cơ cấu trạng thái điều tra</h3>
              <p className="text-xs text-slate-500">Tỷ lệ hoàn thành trên toàn bộ các địa bàn</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bộ lọc và Bảng theo dõi tiến độ chi tiết */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bảng theo dõi tiến độ từng Điều tra viên & Mã TKCS</h3>
              <p className="text-xs text-slate-500">Tra cứu nhanh căn cứ vào Mã TKCS, Mã Xã và Mã Địa Bàn</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => StorageService.exportSampleListToExcel(filteredSamples)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> Xuất Excel tiến độ
              </button>
            </div>
          </div>

          {/* Hàng bộ lọc */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã TKCS, tên hộ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả Xã (Mã xã)</option>
                {communes.map((c: any) => (
                  <option key={c.code} value={c.code}>[{c.code}] {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả Địa bàn</option>
                {areas.map(a => (
                  <option key={a} value={a}>Địa bàn {a}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedEnumerator}
                onChange={(e) => setSelectedEnumerator(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả ĐTV</option>
                {enumerators.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="in_progress">Đang điều tra</option>
                <option value="not_started">Chưa điều tra</option>
                <option value="refused">Từ chối / Chuyển đi</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => setShowFakeIpOnly(!showFakeIpOnly)}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  showFakeIpOnly 
                    ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {showFakeIpOnly ? 'Đang lọc Fake IP' : 'Lọc cờ Fake IP'}
              </button>
            </div>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Mã TKCS</th>
                <th className="py-3 px-3">Mã Xã</th>
                <th className="py-3 px-3">Mã ĐB</th>
                <th className="py-3 px-4">Tên Hộ / Cơ Sở</th>
                <th className="py-3 px-4">ĐTV Phụ Trách</th>
                <th className="py-3 px-3">Loại Mẫu</th>
                <th className="py-3 px-3">Tiến Độ</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-3">Cảnh Báo Fake IP</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500">
                    Không tìm thấy hộ mẫu nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredSamples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {s.tkcsCode}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{s.communeCode}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{s.areaCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 max-w-[200px] truncate" title={s.householdName}>
                        {s.householdName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={s.address}>
                        {s.address}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{s.assignedEnumeratorName || 'Chưa gán'}</div>
                      <div className="text-[11px] text-slate-400">{s.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      {s.sampleType === 'official' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Chính thức
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Dự phòng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              s.progressPercent === 100 ? 'bg-emerald-500' : s.progressPercent > 0 ? 'bg-blue-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${s.progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">{s.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(s.surveyStatus)}
                    </td>
                    <td className="py-3 px-3">
                      {s.fakeIpDetails?.isFlagged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-800 font-semibold text-[11px] animate-pulse" title={s.fakeIpDetails.reason}>
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                          PHÁT HIỆN FAKE IP
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">Hợp lệ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewSurvey(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md font-medium text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem phiếu
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
