import React, { useState } from 'react';
import { 
  Smartphone, UserCheck, MapPin, Phone, CheckCircle2, Clock, 
  AlertTriangle, Search, Filter, 
  ShieldAlert, Sparkles, Navigation, RefreshCw, BookOpen, 
  FolderTree, Compass, ListFilter, AlertCircle, Building2, Users,
  FileSpreadsheet
} from 'lucide-react';
import { Enumerator, SampleHousehold } from '../../types/survey';
import { HouseholdIncomeSurveyModal } from './income/HouseholdIncomeSurveyModal';
import { FieldMapNavigator } from './FieldMapNavigator';
import { SyncQueuePanel } from './SyncQueuePanel';
import { GsoHandbookPanel } from './GsoHandbookPanel';
import { ReplaceSampleModal } from './ReplaceSampleModal';

interface EnumeratorAppProps {
  currentEnumerator: Enumerator;
  samples: SampleHousehold[];
  onSurveyUpdated: () => void;
  onLogout: () => void;
}

export const EnumeratorApp: React.FC<EnumeratorAppProps> = ({
  currentEnumerator,
  samples,
  onSurveyUpdated,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'households' | 'map' | 'sync' | 'handbook'>('households');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sampleTypeFilter, setSampleTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeIncomeSurveySample, setActiveIncomeSurveySample] = useState<SampleHousehold | null>(null);
  const [replacingSample, setReplacingSample] = useState<SampleHousehold | null>(null);

  // Server đã lọc sẵn (GET /api/samples/mine): "samples" ở đây CHỈ gồm đúng số hộ được phân quyền
  // cho tài khoản ĐTV đang đăng nhập (10 chính thức + 4 dự phòng / địa bàn phụ trách).
  const assignedSamples = samples;

  const filteredSamples = assignedSamples.filter(s => {
    const matchStatus = statusFilter === 'all' || s.surveyStatus === statusFilter;
    const matchType = sampleTypeFilter === 'all' || s.sampleType === sampleTypeFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      s.tkcsCode.toLowerCase().includes(term) ||
      s.householdName.toLowerCase().includes(term) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(term)) ||
      s.address.toLowerCase().includes(term) ||
      s.phone.includes(searchTerm);
    return matchStatus && matchType && matchSearch;
  });

  const completedCount = assignedSamples.filter(s => s.surveyStatus === 'completed').length;
  const inProgressCount = assignedSamples.filter(s => s.surveyStatus === 'in_progress').length;
  const notStartedCount = assignedSamples.filter(s => s.surveyStatus === 'not_started').length;
  const movedOrReplacedCount = assignedSamples.filter(s => s.surveyStatus === 'moved' || s.surveyStatus === 'refused').length;
  const completionRate = assignedSamples.length > 0 ? Math.round((completedCount / assignedSamples.length) * 100) : 0;

  // Danh sách mẫu dự phòng khả dụng cùng xã của ĐTV
  const availableReserveSamples = samples.filter(s => 
    s.sampleType === 'reserve' && 
    s.surveyStatus === 'not_started' &&
    currentEnumerator?.assignedCommunes.includes(s.communeCode)
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* Container phong cách Mobile / Tablet app */}
      <div className="w-full max-w-2xl bg-white min-h-screen shadow-md flex flex-col">
        
        {/* App Bar trên cùng */}
        <div className="bg-blue-600 text-white p-4 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/40 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight">Ứng Dụng Điều Tra Viên (CAPI)</h1>
                <p className="text-[11px] text-blue-100">Cục Thống Kê • Thu thập dữ liệu thực địa</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="text-xs bg-red-600/90 hover:bg-red-700 text-white px-2.5 py-1 rounded-md font-semibold transition-colors"
            >
              Đăng xuất
            </button>
          </div>

          {/* Thông tin tài khoản ĐTV đang đăng nhập (xác thực thật qua server) */}
          <div className="mt-3 p-2.5 bg-blue-700/60 rounded-xl border border-blue-500/40 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {currentEnumerator?.name.split(' ').pop()?.charAt(0) || 'D'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">{currentEnumerator?.name} ({currentEnumerator?.code})</div>
              <div className="text-[10px] text-blue-200 truncate">
                Xã: {currentEnumerator?.assignedCommunes.join(', ')} • ĐB: {currentEnumerator?.assignedWards.join(', ')}
              </div>
            </div>
          </div>

          {/* Tab navigation bên trong App ĐTV */}
          <div className="mt-3 grid grid-cols-4 gap-1 bg-blue-800/60 p-1 rounded-xl text-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('households')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'households' ? 'bg-white text-blue-800 shadow-xs' : 'text-blue-100 hover:bg-blue-700/40'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Hộ điều tra
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'map' ? 'bg-white text-blue-800 shadow-xs' : 'text-blue-100 hover:bg-blue-700/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Bản đồ
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'sync' ? 'bg-white text-blue-800 shadow-xs' : 'text-blue-100 hover:bg-blue-700/40'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" /> Đồng bộ
            </button>

            <button
              onClick={() => setActiveTab('handbook')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'handbook' ? 'bg-white text-blue-800 shadow-xs' : 'text-blue-100 hover:bg-blue-700/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Sổ tay
            </button>
          </div>
        </div>

        {/* Tab 1: Danh sách hộ điều tra */}
        {activeTab === 'households' && (
          <div className="flex-1 flex flex-col">
            {/* Thanh tóm tắt tiến độ ĐTV */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600">Tiến độ điều tra cá nhân:</span>
                <span className="text-blue-700 font-bold">{completedCount} / {assignedSamples.length} hộ ({completionRate}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Chưa làm</span>
                  <span className="font-bold text-slate-800">{notStartedCount}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-blue-500 block text-[10px]">Đang làm</span>
                  <span className="font-bold text-blue-700">{inProgressCount}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-emerald-500 block text-[10px]">Đã xong</span>
                  <span className="font-bold text-emerald-700">{completedCount}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-rose-500 block text-[10px]">Thay thế</span>
                  <span className="font-bold text-rose-700">{movedOrReplacedCount}</span>
                </div>
              </div>
            </div>

            {/* Bộ lọc và Tìm kiếm */}
            <div className="p-3 border-b border-slate-200 bg-white space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm tên chủ hộ, mã TKCS, số điện thoại, địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-1 overflow-x-auto text-xs pb-0.5">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'not_started', label: 'Chưa làm' },
                    { id: 'in_progress', label: 'Đang làm' },
                    { id: 'completed', label: 'Đã nộp' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium text-[11px] transition-colors ${
                        statusFilter === tab.id
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'Tất cả mẫu' },
                    { id: 'official', label: 'Chính thức' },
                    { id: 'reserve', label: 'Dự phòng' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSampleTypeFilter(tab.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        sampleTypeFilter === tab.id
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Danh sách các hộ mẫu */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {filteredSamples.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Không có hộ điều tra nào trong danh mục này.
                </div>
              ) : (
                filteredSamples.map(sample => {
                  const isCompleted = sample.surveyStatus === 'completed';
                  const isInProgress = sample.surveyStatus === 'in_progress';
                  const isReplacedOrMoved = sample.surveyStatus === 'moved' || sample.surveyStatus === 'refused';

                  return (
                    <div
                      key={sample.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {sample.tkcsCode}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              sample.sampleType === 'official' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {sample.sampleType === 'official' ? 'Mẫu chính thức' : 'Mẫu dự phòng'}
                            </span>
                            {sample.memberCount && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                <Users className="w-3 h-3" /> {sample.memberCount} NK
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-tight">
                            {sample.householdName}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Chủ hộ: <strong>{sample.ownerName || sample.householdName}</strong>
                            {sample.mainIncomeSourceName && (
                              <span className="ml-2 text-slate-500 font-normal">
                                • {sample.mainIncomeSourceName}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã nộp
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Clock className="w-3.5 h-3.5" /> Đang làm ({sample.progressPercent}%)
                            </span>
                          ) : isReplacedOrMoved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5" /> Đã thay mẫu
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Chưa bắt đầu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ngành nghề & Địa chỉ & liên hệ */}
                      <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <span className="font-mono font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border text-[10px]">
                            {sample.industryCode}
                          </span>
                          <span className="truncate">{sample.industryName}</span>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span>{sample.address}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono">{sample.phone}</span>
                          </div>
                          <a
                            href={`tel:${sample.phone}`}
                            className="text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            Gọi điện ngay
                          </a>
                        </div>
                      </div>

                      {/* Thông tin mã xã và địa bàn */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Xã: <strong>{sample.communeName} ({sample.communeCode})</strong></span>
                        <span>Địa bàn: <strong>{sample.areaCode}</strong></span>
                      </div>

                      {sample.notes && (
                        <div className="p-2 bg-amber-50 rounded text-[11px] text-amber-800 border border-amber-200">
                          {sample.notes}
                        </div>
                      )}

                      {/* Nút hành động phỏng vấn và thay mẫu */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        {sample.sampleType === 'official' && !isCompleted && !isReplacedOrMoved && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => setReplacingSample(sample)}
                              className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 hover:underline"
                              title="Thay thế bằng mẫu dự phòng khi cơ sở giải thể/chuyển đi/từ chối"
                            >
                              <RefreshCw className="w-3 h-3" /> Đổi sang mẫu dự phòng
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => setActiveIncomeSurveySample(sample)}
                            className="py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white transition-all"
                            title="Phiếu thu thập thông tin về thu nhập của hộ dân cư (Phụ lục II)"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-yellow-300" />
                            <span>Phiếu Thu Nhập (Phụ lục II)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Bản đồ Thực địa */}
        {activeTab === 'map' && (
          <div className="p-3 flex-1 flex flex-col">
            <FieldMapNavigator
              samples={assignedSamples}
              onSelectSample={(sample) => setActiveIncomeSurveySample(sample)}
            />
          </div>
        )}

        {/* Tab 3: Hàng đợi đồng bộ Google Drive */}
        {activeTab === 'sync' && (
          <div className="p-4 flex-1 overflow-y-auto">
            <SyncQueuePanel
              samples={assignedSamples}
              onSyncCompleted={onSurveyUpdated}
            />
          </div>
        )}

        {/* Tab 4: Sổ tay Nghiệp vụ */}
        {activeTab === 'handbook' && (
          <div className="p-4 flex-1 overflow-y-auto">
            <GsoHandbookPanel />
          </div>
        )}

      </div>

      {/* Modal Phiếu thu nhập Phụ lục II (Chuẩn hóa chính xác theo Tổng cục Thống kê) */}
      {activeIncomeSurveySample && (
        <HouseholdIncomeSurveyModal
          sample={activeIncomeSurveySample}
          enumeratorName={currentEnumerator?.name}
          onClose={() => setActiveIncomeSurveySample(null)}
          onSaved={() => {
            onSurveyUpdated();
          }}
        />
      )}

      {/* Modal Đổi mẫu dự phòng */}
      {replacingSample && (
        <ReplaceSampleModal
          officialSample={replacingSample}
          availableReserveSamples={availableReserveSamples}
          onSuccess={() => {
            onSurveyUpdated();
            setReplacingSample(null);
          }}
          onClose={() => setReplacingSample(null)}
        />
      )}
    </div>
  );
};
