import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, Sparkles, Filter, Search, 
  CheckCircle, CheckCircle2, AlertCircle, RefreshCw, Layers, MapPin, 
  ArrowRight, ShieldCheck, HelpCircle, X, Printer, Phone, Users,
  BarChart3, CheckSquare, FileText, Info
} from 'lucide-react';
import { HouseholdListing, SampleHousehold, SamplingSummary } from '../../types/survey';
import { StorageService } from '../../services/storageService';
import { apiRunSampling, apiImportListings } from '../../services/apiClient';

interface SamplingEngineProps {
  listings: HouseholdListing[];
  samples: SampleHousehold[];
  onSamplingComplete: () => void;
}

export const SamplingEngine: React.FC<SamplingEngineProps> = ({ listings, samples, onSamplingComplete }) => {
  const [activeTab, setActiveTab] = useState<'sampling' | 'listing'>('sampling');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [sampleSizeInput, setSampleSizeInput] = useState<number>(10);
  const [reserveRatio, setReserveRatio] = useState<number>(4);
  const [samplingMethod, setSamplingMethod] = useState<'stratified_by_income' | 'systematic'>('stratified_by_income');
  const [samplingSummary, setSamplingSummary] = useState<SamplingSummary | null>(null);
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState<number | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Danh sách các xã có trong bảng kê
  const communes = Array.from(new Set(listings.map(h => JSON.stringify({ code: h.communeCode, name: h.communeName })))).map(s => JSON.parse(s));

  // Kiểm tra nếu xã được chọn chưa có trong danh sách thì lấy xã đầu tiên
  const currentCommuneCode = communes.some(c => c.code === selectedCommune) ? selectedCommune : (communes[0]?.code || '');

  // Thống kê số hộ trong xã được chọn
  const communeHouseholds = listings.filter(h => h.communeCode === currentCommuneCode);
  const N = communeHouseholds.length;
  // Số địa bàn trong xã đang chọn + ước tính quy mô mẫu theo TỪNG địa bàn (chỉ tiêu n hộ/địa bàn)
  const areaCodesInCommune = Array.from(new Set(communeHouseholds.map(h => h.areaCode || 'Chưa xác định')));
  const areaCountInCommune = areaCodesInCommune.length;
  const n = sampleSizeInput; // Chỉ tiêu số hộ chính thức cho MỖI địa bàn (không phải toàn xã)
  const estimatedTotalOfficial = areaCodesInCommune.reduce((sum, code) => {
    const areaN = communeHouseholds.filter(h => (h.areaCode || 'Chưa xác định') === code).length;
    return sum + Math.min(n, areaN);
  }, 0);
  const kEstimate = areaCountInCommune > 0
    ? Math.max(1, Math.floor((N / areaCountInCommune) / Math.max(n, 1)))
    : 1;

  // Thống kê 4 nhóm ngành nguồn thu nhập trong xã được chọn
  const sectorCounts = {
    1: communeHouseholds.filter(h => (h.mainIncomeSourceCode || 4) === 1).length,
    2: communeHouseholds.filter(h => (h.mainIncomeSourceCode || 4) === 2).length,
    3: communeHouseholds.filter(h => (h.mainIncomeSourceCode || 4) === 3).length,
    4: communeHouseholds.filter(h => (h.mainIncomeSourceCode || 4) === 4).length,
  };

  // Xuất Bảng kê hộ của xã đang chọn: 1 xã = 1 file Excel, mỗi địa bàn trong xã = 1 trang (sheet)
  const handleExportCommuneListing = () => {
    try {
      const count = StorageService.exportIncomeHouseholdListingByCommune(listings, currentCommuneCode);
      setImportStatus({
        success: true,
        message: `Đã xuất file Bảng kê hộ cho xã đã chọn (${count} địa bàn, mỗi địa bàn 1 trang)!`
      });
    } catch (err: any) {
      setImportStatus({ success: false, message: err.message || 'Lỗi khi xuất Bảng kê hộ theo xã' });
    }
  };

  // Xuất toàn bộ các xã: mỗi xã tải về 1 file riêng, mỗi địa bàn trong xã là 1 trang
  const handleExportAllCommunes = () => {
    try {
      const count = StorageService.exportIncomeHouseholdListingAllCommunes(listings);
      setImportStatus({
        success: true,
        message: `Đã xuất ${count} file Excel (mỗi xã 1 file, mỗi địa bàn 1 trang)!`
      });
    } catch (err: any) {
      setImportStatus({ success: false, message: err.message || 'Lỗi khi xuất Bảng kê hộ toàn bộ các xã' });
    }
  };

  // Thực hiện chọn mẫu ngẫu nhiên hệ thống (giờ chạy trên SERVER -> mọi thiết bị đăng nhập đều thấy chung kết quả)
  const handleExecuteSampling = async () => {
    setIsProcessing(true);
    try {
      const { summary } = await apiRunSampling(currentCommuneCode, sampleSizeInput, reserveRatio, samplingMethod);
      setSamplingSummary(summary);
      setImportStatus({
        success: true,
        message: `Đã chọn mẫu thành công: ${summary.officialSampleCount} hộ chính thức + ${summary.reserveSampleCount} hộ dự phòng cho ${summary.communeName}!`
      });
      onSamplingComplete();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chọn mẫu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload file Bảng kê hộ từ Excel -> đọc ở trình duyệt rồi gửi lên SERVER dùng chung
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await StorageService.parseHouseholdsFromExcel(file);
      const { inserted } = await apiImportListings(parsed);
      setImportStatus({
        success: true,
        message: `Đã tải lên và tích hợp thành công ${inserted} hộ gia đình vào Bảng Kê Mẫu từ file Excel!`
      });
      onSamplingComplete();
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `Lỗi nhập Excel: ${err.message || 'Vui lòng kiểm tra lại cấu trúc file'}`
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Lọc danh sách hộ ở Tab toàn bộ bảng kê
  const filteredListings = listings.filter(h => {
    const matchesSearch = 
      h.householdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.tkcsCode.includes(searchQuery) ||
      h.phone.includes(searchQuery);
    
    const matchesSector = filterSector === 'all' || (h.mainIncomeSourceCode || 4) === filterSector;
    return matchesSearch && matchesSector;
  });

  const selectedCommuneSamples = samples.filter(s => s.communeCode === currentCommuneCode);

  return (
    <div className="space-y-6">
      {/* Banner tải nhanh Bảng kê theo ảnh người dùng gửi & Xuất/Nhập Excel */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Phương Án Điều Tra Thu Nhập Bình Quân Đầu Người Cấp Xã (Chuẩn GSO)
            </div>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
              Quản Lý Bảng Kê Hộ & Thuật Toán Chọn Mẫu Hệ Thống
            </h2>
            <p className="text-xs text-blue-100/90 max-w-2xl mt-1 leading-relaxed">
              Hỗ trợ đầy đủ biểu mẫu Bảng kê hộ điều tra thu nhập (STT, Chủ hộ, Địa chỉ, Số nhân khẩu, Nguồn thu nhập lớn nhất: 1, 2, 3, 4). Tự động phân bổ mẫu chính thức & dự phòng cho ĐTV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            <button
              onClick={handleExportCommuneListing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="Xuất Bảng kê hộ của xã đang chọn: 1 file, mỗi địa bàn 1 trang"
            >
              <CheckSquare className="w-4 h-4 text-slate-900" />
              Xuất Bảng Kê Xã Này (Mỗi Địa Bàn 1 Trang)
            </button>

            <button
              onClick={handleExportAllCommunes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-400/80 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="Xuất tất cả các xã: mỗi xã 1 file, mỗi địa bàn 1 trang"
            >
              <CheckSquare className="w-4 h-4 text-slate-900" />
              Xuất Tất Cả Các Xã
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-300" /> Tải lên Bảng Kê Excel
            </button>

            <a
              href="/phuong_an_chon_mau_ho_thu_nhap.docx"
              download="Phuong_An_Chon_Mau_Ho_Thu_Nhap_GSO.docx"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              title="Tải văn bản Phương Án Chọn Mẫu định dạng file DOCX"
            >
              <FileText className="w-4 h-4 text-white" />
              Tải File Phương Án (.DOCX)
            </a>

            <button
              onClick={() => setShowMethodologyModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
              title="Đọc toàn văn phương án và quy định chọn mẫu GSO"
            >
              <Info className="w-4 h-4 text-amber-300" />
              Đọc Quy Định Chọn Mẫu
            </button>

            <button
              onClick={() => StorageService.exportIncomeHouseholdTemplate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
              title="Tải file Excel mẫu đúng như ảnh chụp phương án"
            >
              <Download className="w-4 h-4 text-emerald-300" /> File Mẫu Thu Nhập
            </button>

            <button
              onClick={() => StorageService.exportSampleListToExcel(samples)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel Mẫu Đã Chọn
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo Import / Kết quả */}
      {importStatus && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between animate-fadeIn ${
          importStatus.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {importStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium leading-normal">{importStatus.message}</span>
          </div>
          <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab chuyển đổi giữa Công cụ chọn mẫu và Xem toàn bộ bảng kê */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sampling')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'sampling'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Công Cụ Chọn Mẫu Theo Xã (Phương Án GSO)
        </button>
        <button
          onClick={() => setActiveTab('listing')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'listing'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Toàn Bộ Bảng Kê Hộ ({listings.length} hộ)
        </button>
      </div>

      {activeTab === 'sampling' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Cấu hình chọn mẫu */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between border-b pb-3 border-slate-100">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Cấu Hình Chọn Mẫu Hệ Thống
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                GSO Standard
              </span>
            </h3>

            {/* 1. Chọn Xã */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                1. Chọn Xã/Phường cần chọn mẫu:
              </label>
              <select
                value={currentCommuneCode}
                onChange={(e) => setSelectedCommune(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {communes.map((c: any) => {
                  const cnt = listings.filter(h => h.communeCode === c.code).length;
                  return (
                    <option key={c.code} value={c.code}>
                      [{c.code}] {c.name} ({cnt} hộ trong bảng kê)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. Phương pháp chọn mẫu */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                2. Phương pháp chọn mẫu theo Phương án:
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50">
                  <input
                    type="radio"
                    name="samplingMethod"
                    value="stratified_by_income"
                    checked={samplingMethod === 'stratified_by_income'}
                    onChange={() => setSamplingMethod('stratified_by_income')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-indigo-950 block">
                      Phân tầng hệ thống theo 4 nhóm ngành (Khuyến nghị GSO)
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Sắp xếp hộ theo 4 nhóm nguồn thu nhập lớn nhất (1, 2, 3, 4) rồi chọn mẫu hệ thống để đảm bảo tính đại diện cơ cấu ngành.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50">
                  <input
                    type="radio"
                    name="samplingMethod"
                    value="systematic"
                    checked={samplingMethod === 'systematic'}
                    onChange={() => setSamplingMethod('systematic')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Ngẫu nhiên hệ thống theo thứ tự Bảng kê gốc
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Chọn trực tiếp theo thứ tự STT hộ đã ghi trên bảng kê rà soát.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Cơ cấu 4 nhóm ngành của xã */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Cơ cấu nguồn thu nhập ({N} hộ):
                </span>
                <span className="text-[11px] text-slate-500">Mã ngành (Cột 2)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">🌾 1. Nông nghiệp:</span>
                  <span className="font-bold text-emerald-700">{sectorCounts[1]} ({N ? Math.round((sectorCounts[1]/N)*100) : 0}%)</span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">🏭 2. Công nghiệp:</span>
                  <span className="font-bold text-blue-700">{sectorCounts[2]} ({N ? Math.round((sectorCounts[2]/N)*100) : 0}%)</span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">🏪 3. Thương mại:</span>
                  <span className="font-bold text-amber-700">{sectorCounts[3]} ({N ? Math.round((sectorCounts[3]/N)*100) : 0}%)</span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">💼 4. Nguồn khác:</span>
                  <span className="font-bold text-purple-700">{sectorCounts[4]} ({N ? Math.round((sectorCounts[4]/N)*100) : 0}%)</span>
                </div>
              </div>
            </div>

            {/* Cấu hình số mẫu chính thức + dự phòng CHO MỖI ĐỊA BÀN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Số hộ chính thức / 1 địa bàn:
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={sampleSizeInput}
                  onChange={(e) => setSampleSizeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Số hộ dự phòng / 1 địa bàn:
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={reserveRatio}
                  onChange={(e) => setReserveRatio(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-amber-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Khung công thức toán học phương án điều tra */}
            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs space-y-1.5">
              <span className="font-bold text-indigo-950 block">Công thức chọn mẫu hệ thống theo địa bàn (GSO):</span>
              <p className="text-[11px] text-slate-500 italic pb-1">
                Tính tỷ trọng 4 nhóm ngành nguồn thu nhập trên TOÀN XÃ (cộng dồn hộ cùng ngành của mọi địa
                bàn lại) rồi áp đúng tỷ trọng đó vào chỉ tiêu {n} hộ/địa bàn — mỗi địa bàn chọn ra bấy
                nhiêu hộ mỗi ngành theo tỷ trọng xã. Ngành nào trong 1 địa bàn không đủ hộ thì phần thiếu
                được lấy bù bằng hộ của ngành khác trong CHÍNH địa bàn đó cho đủ {n} hộ.
              </p>
              <div className="flex justify-between text-slate-700">
                <span>Tổng thể trong xã (N):</span>
                <span className="font-bold text-slate-900">{N} hộ / {areaCountInCommune} địa bàn</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Chỉ tiêu / địa bàn (n):</span>
                <span className="font-bold text-indigo-700">{n} chính thức + {reserveRatio} dự phòng</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Ước tính tổng số hộ chính thức toàn xã:</span>
                <span className="font-bold text-indigo-700">≈ {estimatedTotalOfficial} hộ</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Khoảng cách mẫu trong 1 địa bàn (k ≈ ⌊N_địa_bàn/n⌋):</span>
                <span className="font-bold text-indigo-700">{kEstimate}</span>
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-indigo-200/60">
                Dãy số thứ tự mẫu được chọn trong mỗi địa bàn: S_i = r + (i - 1) × k (với i = 1, 2, ..., n)
              </p>
            </div>

            <button
              onClick={handleExecuteSampling}
              disabled={isProcessing || N === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Đang tính toán theo Phương án GSO...' : 'Thực Hiện Chọn Mẫu Theo Xã'}
            </button>

            {samplingSummary && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center justify-between text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Đã chốt mẫu theo Phương án!
                  </span>
                  <button
                    onClick={() => setShowProtocolModal(true)}
                    className="text-[11px] font-bold text-indigo-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Biên bản
                  </button>
                </div>
                <div className="text-[11px] space-y-0.5 text-emerald-950">
                  <p>• Mẫu chính thức: <strong>{samplingSummary.officialSampleCount} hộ</strong></p>
                  <p>• Mẫu dự phòng: <strong>{samplingSummary.reserveSampleCount} hộ</strong></p>
                  <p>• Bước nhảy k = {samplingSummary.samplingIntervalK}, Số xuất phát r = {samplingSummary.randomStartR}</p>
                  <p>• Phương pháp: <strong>{samplingSummary.samplingMethod === 'stratified_by_income' ? 'Phân tầng 4 nhóm ngành' : 'Hệ thống tuần tự'}</strong></p>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Danh sách kết quả chọn mẫu */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Danh Sách Hộ Mẫu Được Chọn — {communeHouseholds[0]?.communeName || 'Xã được chọn'}
                </h3>
                <p className="text-xs text-slate-500">
                  Bao gồm mẫu chính thức và dự phòng, đã gán ĐTV phụ trách địa bàn
                </p>
              </div>

              <div className="flex items-center gap-2">
                {samplingSummary && (
                  <button
                    onClick={() => setShowProtocolModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> In Biên Bản Chọn Mẫu
                  </button>
                )}
                <span className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  {selectedCommuneSamples.length} hộ mẫu
                </span>
              </div>
            </div>

            {/* Bảng so sánh cơ cấu ngành giữa Bảng kê và Mẫu được chọn */}
            {samplingSummary?.sectorDistribution && (
              <div className="p-3 bg-indigo-50/40 border-b border-indigo-100">
                <div className="text-[11px] font-bold text-indigo-950 mb-1.5 flex items-center justify-between">
                  <span>Kiểm tra tính đại diện cơ cấu theo 4 nhóm ngành:</span>
                  <span className="font-normal text-slate-500">Tổng mẫu chính thức: {samplingSummary.officialSampleCount} hộ</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {samplingSummary.sectorDistribution.map(sec => (
                    <div key={sec.code} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                      <div className="font-semibold text-slate-800 truncate" title={sec.name}>{sec.name}</div>
                      <div className="flex items-center justify-between mt-1 text-slate-600">
                        <span>Bảng kê: <strong>{sec.totalCount} ({sec.percentage}%)</strong></span>
                        <span className="text-indigo-700 font-bold">Mẫu: {sec.selectedCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 overflow-y-auto max-h-[560px] divide-y divide-slate-100">
              {selectedCommuneSamples.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <p>Chưa có hộ mẫu nào được chọn cho xã này.</p>
                  <p className="text-slate-500">Vui lòng bấm nút <strong>"Thực Hiện Chọn Mẫu Theo Xã"</strong> ở cột bên trái.</p>
                </div>
              ) : (
                selectedCommuneSamples.map((s, idx) => (
                  <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mt-0.5 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{s.householdName}</span>
                          {s.sampleType === 'official' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Mẫu chính thức
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Mẫu dự phòng
                            </span>
                          )}
                          {s.memberCount && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                              <Users className="w-3 h-3" /> {s.memberCount} nhân khẩu
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600">
                          {s.address} • Ngành thu nhập: <strong className="text-slate-800">{s.mainIncomeSourceName || s.industryName}</strong>
                        </p>

                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-semibold">
                            Mã TKCS: {s.tkcsCode}
                          </span>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            Địa bàn: {s.areaCode}
                          </span>
                          {s.phone && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {s.phone}
                            </span>
                          )}
                          <span className="text-slate-700">
                            ĐTV phụ trách: <strong>{s.assignedEnumeratorName || 'Chưa gán'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right whitespace-nowrap shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.surveyStatus === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        s.surveyStatus === 'in_progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.surveyStatus === 'completed' ? '✓ Đã hoàn thành' : s.surveyStatus === 'in_progress' ? 'Đang điều tra' : 'Chưa thực hiện'}
                      </span>
                      {s.surveyStatus === 'in_progress' && (
                        <span className="text-[10px] text-blue-700 font-semibold">{s.progressPercent}%</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab Danh sách toàn bộ bảng kê hộ */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Toàn Bộ Danh Sách Bảng Kê Hộ Đã Nạp ({listings.length} hộ gia đình)
              </h3>
              <p className="text-xs text-slate-500">
                Lập dàn chọn mẫu cho Điều tra thu nhập bình quân đầu người cấp xã và Điều tra cơ sở cá thể
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm chủ hộ, địa chỉ, SĐT, mã TKCS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tất cả ngành nguồn thu nhập</option>
                <option value="1">1. Nông lâm thủy sản</option>
                <option value="2">2. Công nghiệp - Xây dựng</option>
                <option value="3">3. Thương mại - Dịch vụ</option>
                <option value="4">4. Nguồn khác (Lương/Trợ cấp...)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-3">STT (A)</th>
                  <th className="py-2.5 px-3">Mã TKCS</th>
                  <th className="py-2.5 px-3">Địa Bàn</th>
                  <th className="py-2.5 px-4">Họ Và Tên Chủ Hộ (B)</th>
                  <th className="py-2.5 px-4">Địa Chỉ Của Hộ (C)</th>
                  <th className="py-2.5 px-3 text-center">Số Nhân Khẩu (1)</th>
                  <th className="py-2.5 px-4">Nguồn Thu Nhập Lớn Nhất (2)</th>
                  <th className="py-2.5 px-3">Ghi Chú / SĐT (3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      Không tìm thấy hộ gia đình nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono font-semibold">{h.stt}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{h.tkcsCode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{h.areaCode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{h.householdName}</td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-[220px] truncate">{h.address}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-800">
                        {h.memberCount || 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (h.mainIncomeSourceCode || 4) === 1 ? 'bg-emerald-100 text-emerald-800' :
                          (h.mainIncomeSourceCode || 4) === 2 ? 'bg-blue-100 text-blue-800' :
                          (h.mainIncomeSourceCode || 4) === 3 ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {h.mainIncomeSourceName || h.industryName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{h.phone || h.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal In & Xem Biên Bản Chọn Mẫu Theo Phương Án */}
      {showProtocolModal && samplingSummary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Biên Bản Chọn Mẫu Điều Tra — Chuẩn Phương Án Thống Kê
                </h3>
              </div>
              <button onClick={() => setShowProtocolModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung biên bản chuẩn GSO */}
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed border p-5 rounded-xl bg-slate-50/50">
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-700 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-semibold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-slate-400 text-[10px]">---o0o---</p>
                <h4 className="font-bold text-slate-900 text-sm uppercase pt-2">
                  BIÊN BẢN CHỌN MẪU NGẪU NHIÊN HỆ THỐNG
                </h4>
                <p className="italic text-[11px] text-slate-500">
                  (Căn cứ theo Phương án điều tra thu nhập bình quân đầu người cấp xã / Điều tra TKCS)
                </p>
              </div>

              <div className="pt-2 space-y-1">
                <p><strong>Thời gian thực hiện:</strong> {samplingSummary.createdAt}</p>
                <p><strong>Đơn vị hành chính:</strong> {samplingSummary.communeName} (Mã xã: {samplingSummary.communeCode})</p>
                <p><strong>Tổng số hộ trong bảng kê (N):</strong> {samplingSummary.totalListHouseholds} hộ / {samplingSummary.areaCount} địa bàn</p>
                <p><strong>Chỉ tiêu mỗi địa bàn:</strong> {samplingSummary.householdsPerAreaTarget} hộ chính thức + {samplingSummary.reservePerAreaTarget} hộ dự phòng</p>
                <p><strong>Tổng mẫu chính thức đã chọn:</strong> {samplingSummary.targetSampleSize} hộ</p>
                <p><strong>Số lượng mẫu dự phòng:</strong> {samplingSummary.reserveSampleCount} hộ</p>
                {(samplingSummary.compensatedCount || 0) > 0 && (
                  <p><strong>Số hộ được bù từ ngành khác trong cùng địa bàn:</strong> {samplingSummary.compensatedCount} hộ (do 1 vài địa bàn thiếu hộ ở đúng ngành theo tỷ trọng xã)</p>
                )}
                <p><strong>Phương pháp chọn mẫu:</strong> {samplingSummary.samplingMethod === 'stratified_by_income' ? 'Phân tầng ngẫu nhiên hệ thống theo 4 nhóm ngành nguồn thu nhập (trong từng địa bàn)' : 'Ngẫu nhiên hệ thống tuần tự (trong từng địa bàn)'}</p>
                <p><strong>Bước nhảy mẫu k (địa bàn cuối cùng xử lý) = ⌊N_địa_bàn/n⌋:</strong> {samplingSummary.samplingIntervalK}</p>
                <p><strong>Số ngẫu nhiên ban đầu r (địa bàn cuối cùng xử lý):</strong> {samplingSummary.randomStartR}</p>
              </div>

              <div className="pt-2">
                <p className="font-bold mb-1.5 text-slate-900">Danh sách các hộ mẫu được chọn chính thức:</p>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                      <tr>
                        <th className="p-2">STT Mẫu</th>
                        <th className="p-2">Mã TKCS</th>
                        <th className="p-2">Tên Chủ Hộ</th>
                        <th className="p-2">Địa Chỉ</th>
                        <th className="p-2">Nhóm Ngành (Cột 2)</th>
                        <th className="p-2">ĐTV Phụ Trách</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedCommuneSamples.filter(s => s.sampleType === 'official').map((s, i) => (
                        <tr key={s.id}>
                          <td className="p-2 font-mono">{i + 1}</td>
                          <td className="p-2 font-mono font-bold text-blue-700">{s.tkcsCode}</td>
                          <td className="p-2 font-bold">{s.householdName}</td>
                          <td className="p-2 text-slate-600">{s.address}</td>
                          <td className="p-2">{s.mainIncomeSourceName || s.industryName}</td>
                          <td className="p-2 font-medium">{s.assignedEnumeratorName || 'ĐTV địa bàn'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="font-bold">ĐIỀU TRA VIÊN / NGƯỜI LẬP</p>
                  <p className="italic text-slate-400 text-[10px]">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-semibold text-slate-700">Đỗ Văn Tuấn</p>
                </div>
                <div>
                  <p className="font-bold">GIÁM SÁT VIÊN / QUẢN TRỊ VIÊN</p>
                  <p className="italic text-slate-400 text-[10px]">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-semibold text-slate-700">Cục Thống Kê</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> In Biên Bản Ngay
              </button>
              <button
                onClick={() => setShowProtocolModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Toàn Văn Phương Án Chọn Mẫu GSO (File DOCX) */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Toàn Văn Phương Án Điều Tra Thu Nhập & Thuật Toán Chọn Mẫu (Chuẩn GSO)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/phuong_an_chon_mau_ho_thu_nhap.docx"
                  download="Phuong_An_Chon_Mau_Ho_Thu_Nhap_GSO.docx"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải Tệp .DOCX
                </a>
                <button 
                  onClick={() => setShowMethodologyModal(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-800 leading-relaxed max-h-[65vh] overflow-y-auto pr-2">
              <div className="text-center space-y-1 pb-3 border-b border-slate-100">
                <p className="font-bold text-slate-600 uppercase">TỔNG CỤC THỐNG KÊ - CỤC THỐNG KÊ</p>
                <h4 className="font-black text-blue-900 text-base uppercase">
                  PHƯƠNG ÁN ĐIỀU TRA THU NHẬP BÌNH QUÂN ĐẦU NGƯỜI CẤP XÃ
                </h4>
                <p className="text-slate-500 italic">
                  Quy định quy trình lập bảng kê hộ, thuật toán chọn mẫu hệ thống và công thức tổng hợp
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 text-sm text-blue-900">I. MỤC ĐÍCH VÀ YÊU CẦU CỦA PHƯƠNG ÁN</h5>
                <p>• <strong>Mục đích:</strong> Thu thập thông tin định kỳ về mức thu nhập bình quân đầu người một tháng/năm của các xã, phường, thị trấn nhằm đánh giá thực trạng đời sống kinh tế - xã hội của cư dân nông thôn và đô thị; phục vụ công nhận xã đạt chuẩn Nông thôn mới và Nông thôn mới nâng cao theo Bộ tiêu chí quốc gia (Tiêu chí số 10 về Thu nhập).</p>
                <p>• <strong>Yêu cầu:</strong> ĐTV phải đến trực tiếp từng hộ mẫu để phỏng vấn chủ hộ và các thành viên, ghi nhận tọa độ GPS thực tế tại hộ, tuyệt đối không được ngồi tại trụ sở để ghi hộ hoặc suy đoán số liệu.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="font-bold text-slate-900 text-sm text-blue-900">II. ĐỐI TƯỢNG VÀ ĐƠN VỊ ĐIỀU TRA</h5>
                <p>• <strong>Đối tượng:</strong> Hộ gia đình và toàn bộ nhân khẩu thực tế thường trú (NKTT) tại xã/phường tại thời điểm lập bảng kê và thời điểm điều tra.</p>
                <p>• <strong>Đơn vị điều tra:</strong> Hộ dân cư được chọn vào mẫu điều tra từ dàn chọn mẫu (Bảng kê hộ) của địa bàn/xã.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="font-bold text-slate-900 text-sm text-blue-900">III. QUY TRÌNH LẬP BẢNG KÊ HỘ (DÀN CHỌN MẪU)</h5>
                <p>ĐTV phối hợp cùng Trưởng thôn / Tổ trưởng tổ dân phố tiến hành rà soát từng hộ trong địa bàn để ghi Bảng kê hộ với các cột chỉ tiêu:</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                  <p>• <strong>Cột A:</strong> Số thứ tự (STT) từ 1 đến N của các hộ trong địa bàn.</p>
                  <p>• <strong>Cột B:</strong> Họ và tên chủ hộ.</p>
                  <p>• <strong>Cột C:</strong> Địa chỉ cụ thể của hộ (số nhà, đường/ngõ/xóm/thôn/TDP).</p>
                  <p>• <strong>Cột 1:</strong> Số nhân khẩu thực tế thường trú của hộ (NKTT) khi lập bảng kê.</p>
                  <p>• <strong>Cột 2:</strong> Nguồn thu nhập lớn nhất của hộ thuộc ngành nào (Mã hóa theo 4 nhóm GSO):</p>
                  <p className="pl-4 text-emerald-800 font-semibold">- Mã 1: Nông lâm nghiệp, thủy sản (trồng trọt, chăn nuôi, thủy sản, lâm nghiệp)</p>
                  <p className="pl-4 text-blue-800 font-semibold">- Mã 2: Công nghiệp, xây dựng (gia công, may mặc, cơ khí, thợ xây, mộc, điện...)</p>
                  <p className="pl-4 text-amber-800 font-semibold">- Mã 3: Thương mại, dịch vụ (bán buôn, bán lẻ, vận tải, ăn uống, dịch vụ đời sống...)</p>
                  <p className="pl-4 text-purple-800 font-semibold">- Mã 4: Nguồn khác (tiền lương, tiền công công nhân/viên chức, lương hưu, trợ cấp, kiều hối...)</p>
                  <p>• <strong>Cột 3:</strong> Ghi chú hoặc số điện thoại liên hệ của chủ hộ.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="font-bold text-slate-900 text-sm text-blue-900">IV. THUẬT TOÁN VÀ CÁCH CHỌN MẪU HỘ ĐIỀU TRA THEO PHƯƠNG ÁN</h5>
                <p>Phương pháp chọn mẫu chuẩn của Tổng cục Thống kê là <strong>Chọn Mẫu Ngẫu Nhiên Hệ Thống (Systematic Random Sampling)</strong>, ưu tiên phân tầng theo 4 nhóm ngành nguồn thu nhập:</p>
                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2">
                  <p><strong>1. Khoảng cách chọn mẫu (Bước nhảy k):</strong></p>
                  <div className="text-center font-mono font-bold text-indigo-900 bg-white py-1.5 rounded-lg border border-indigo-200">
                    k = ⌊ N / n ⌋
                  </div>
                  <p className="text-[11px] text-slate-600">Trong đó N là tổng số hộ trong bảng kê, n là số hộ mẫu chính thức cần chọn (lấy phần nguyên).</p>
                  <p><strong>2. Xác định số ngẫu nhiên ban đầu (r):</strong></p>
                  <p className="text-[11px] text-slate-600">Sinh một số ngẫu nhiên r trong khoảng [1, k]. Hộ thứ r chính là hộ mẫu đầu tiên.</p>
                  <p><strong>3. Dãy số thứ tự các hộ mẫu được chọn:</strong></p>
                  <div className="text-center font-mono font-bold text-indigo-900 bg-white py-1.5 rounded-lg border border-indigo-200">
                    S_i = r + (i - 1) × k    (với i = 1, 2, ..., n)
                  </div>
                  <p><strong>4. Cơ cấu phân tầng 4 nhóm ngành:</strong></p>
                  <p className="text-[11px] text-slate-600">Sắp xếp các hộ trong dàn chọn mẫu theo 4 nhóm ngành (Nhóm 1 → 2 → 3 → 4) và giảm dần theo số nhân khẩu trước khi chạy bước nhảy k để mẫu trúng tuyển phản ánh đúng cơ cấu toàn xã.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="font-bold text-slate-900 text-sm text-blue-900">V. NGUYÊN TẮC THAY THẾ MẪU VÀ MẪU DỰ PHÒNG</h5>
                <p>• Chỉ được thay thế mẫu khi: Hộ đã chuyển hẳn đi nơi khác, toàn bộ hộ đi vắng trong suốt kỳ điều tra, chủ hộ chết hoặc hộ kiên quyết từ chối hợp tác sau khi đã vận động tối thiểu 3 lần.</p>
                <p>• <strong>Nguyên tắc thay mẫu:</strong> Phải chọn hộ thay thế từ danh sách MẪU DỰ PHÒNG có <strong>cùng nhóm ngành nguồn thu nhập (Mã 1, 2, 3 hoặc 4)</strong> và cùng địa bàn với hộ bị thay thế.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="font-bold text-slate-900 text-sm text-blue-900">VI. CÔNG THỨC TÍNH TOÁN VÀ TỔNG HỢP THEO PHIẾU ĐIỀU TRA</h5>
                <div className="text-center font-mono font-bold text-emerald-900 bg-emerald-50 py-2 rounded-lg border border-emerald-200">
                  Thu Nhập BQĐN = Tổng thu nhập của các hộ mẫu / Tổng số nhân khẩu của các hộ mẫu
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 border-slate-200">
              <a
                href="/phuong_an_chon_mau_ho_thu_nhap.docx"
                download="Phuong_An_Chon_Mau_Ho_Thu_Nhap_GSO.docx"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" /> Tải File DOCX Ngay
              </a>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
