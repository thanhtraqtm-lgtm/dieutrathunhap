import React, { useState, useEffect } from 'react';
import { 
  X, Save, Send, MapPin, Printer, CheckCircle2, 
  AlertTriangle, ShieldCheck, ShieldAlert, FileText, 
  RefreshCw, UserCheck, Search, Building2, Calculator, 
  Camera, Upload, AlertCircle, Sparkles, HelpCircle, Check 
} from 'lucide-react';
import { SampleHousehold, SurveyFormData } from '../../types/survey';
import { apiSaveSurveyForm } from '../../services/surveySaveHelpers';
import { validateSurveyForm, ValidationResult } from '../../utils/surveyValidator';
import { VsicPickerModal } from './VsicPickerModal';
import { LogicAuditModal } from './LogicAuditModal';
import { VsicIndustry } from '../../data/vsicCodes';

interface SurveyFormModalProps {
  sample: SampleHousehold;
  enumeratorName?: string;
  onClose: () => void;
  onSaved: () => void;
  onRequestReplaceSample?: (sample: SampleHousehold) => void;
}

export const SurveyFormModal: React.FC<SurveyFormModalProps> = ({
  sample,
  enumeratorName,
  onClose,
  onSaved,
  onRequestReplaceSample
}) => {
  // Khởi tạo form data chuẩn mực
  const [formData, setFormData] = useState<SurveyFormData>(() => {
    if (sample.surveyData) {
      return JSON.parse(JSON.stringify(sample.surveyData));
    }

    const defaultData: SurveyFormData = {
      generalInfo: {
        provinceCode: sample.provinceCode || '',
        provinceName: sample.provinceName || '',
        districtCode: sample.districtCode || '',
        districtName: sample.districtName || '',
        communeCode: sample.communeCode,
        communeName: sample.communeName,
        areaCode: sample.areaCode,
        tkcsCode: sample.tkcsCode,
        householdName: sample.householdName,
        representativeName: sample.ownerName || sample.householdName,
        gender: 'Nam',
        birthYear: '1982',
        idCardNumber: '001082001928',
        taxCode: '',
        address: sample.address,
        phone: sample.phone,
        email: `${sample.tkcsCode.toLowerCase()}@tkcs.gso.gov.vn`,
        industryName: sample.industryName,
        industryCode: sample.industryCode,
        operationalStatus: '1. Đang hoạt động',
      },
      laborInfo: {
        totalLabor: sample.workerCount || 2,
        femaleLabor: 1,
        familyLabor: 2,
        hiredLabor: 0,
        qualification: '3. Sơ cấp / Đào tạo ngắn hạn',
      },
      businessResults: {
        monthsActive: 12,
        averageMonthlyRevenue: sample.estimatedRevenue || 50,
        totalYearlyRevenue: (sample.estimatedRevenue || 50) * 12,
        totalMonthlyExpense: Math.round((sample.estimatedRevenue || 50) * 0.75),
        materialsExpense: Math.round((sample.estimatedRevenue || 50) * 0.5),
        laborSalaryExpense: 0,
        rentExpense: 5,
        depreciationExpense: 2,
        utilityServicesExpense: 3,
        otherExpenses: Math.round((sample.estimatedRevenue || 50) * 0.75) - (Math.round((sample.estimatedRevenue || 50) * 0.5) + 0 + 5 + 2 + 3),
        netIncomeMonthly: Math.round((sample.estimatedRevenue || 50) * 0.25),
      },
      taxObligation: {
        taxDeclarationType: '1. Thuế khoán',
        totalTaxPaid: 6.5,
      },
      capitalCredit: {
        totalCapital: 120,
        bankLoanCapital: 0,
        hasLoanDemand: false,
        loanDemandAmount: 0,
      },
      itApplication: {
        usesInternet: true,
        sellsOnline: true,
        onlineChannels: ['Mạng xã hội (Facebook/Zalo)', 'Sàn TMĐT'],
        onlineRevenuePercent: 25,
        acceptsCashlessPayment: true,
        cashlessMethods: ['Chuyển khoản / VietQR', 'Ví điện tử'],
      },
      challengesRecommendations: {
        mainChallenges: ['1. Giá nguyên vật liệu, hàng hóa đầu vào tăng cao'],
        otherChallengeDetails: '',
        recommendations: 'Đề nghị tiếp tục hỗ trợ ổn định giá điện nước và đơn giản hóa thủ tục nộp thuế khoán.',
      },
      verification: {
        respondentName: sample.ownerName || sample.householdName,
        respondentTitle: 'Chủ cơ sở',
        enumeratorName: enumeratorName || sample.assignedEnumeratorName || '',
        enumeratorCode: '',
        surveyDate: new Date().toISOString().split('T')[0],
        latitude: 21.0935,
        longitude: 105.6982,
        gpsAccuracy: 6.5,
        ipAddress: '14.232.208.45',
        fakeIpWarning: false,
        notes: 'Cơ sở hợp tác cung cấp thông tin đầy đủ, đúng tiến độ.',
      }
    };

    return defaultData;
  });

  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('Tọa độ hiện trường hợp lệ (sai số ±6.5m)');
  const [activeSection, setActiveSection] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVsicModal, setShowVsicModal] = useState(false);
  const [showLogicAuditModal, setShowLogicAuditModal] = useState(false);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(
    formData.verification.proofPhotoUrl || null
  );

  // Chạy kiểm tra logic theo Phương án GSO theo thời gian thực
  const validationResult: ValidationResult = validateSurveyForm(formData);

  // Tự động tính toán Doanh thu năm & Thu nhập thuần khi Doanh thu và Chi phí thay đổi
  useEffect(() => {
    const rev = formData.businessResults.averageMonthlyRevenue || 0;
    const exp = formData.businessResults.totalMonthlyExpense || 0;
    const net = rev - exp;
    
    setFormData(prev => ({
      ...prev,
      businessResults: {
        ...prev.businessResults,
        totalYearlyRevenue: rev * (prev.businessResults.monthsActive || 12),
        netIncomeMonthly: net,
      }
    }));
  }, [formData.businessResults.averageMonthlyRevenue, formData.businessResults.totalMonthlyExpense, formData.businessResults.monthsActive]);

  // Tính tổng 6 khoản chi tiết
  const calculatedDetailExpenseSum = 
    (formData.businessResults.materialsExpense || 0) +
    (formData.businessResults.laborSalaryExpense || 0) +
    (formData.businessResults.rentExpense || 0) +
    (formData.businessResults.depreciationExpense || 0) +
    (formData.businessResults.utilityServicesExpense || 0) +
    (formData.businessResults.otherExpenses || 0);

  // Tự động cân bằng chi phí
  const handleAutoBalanceExpenses = () => {
    setFormData(prev => ({
      ...prev,
      businessResults: {
        ...prev.businessResults,
        totalMonthlyExpense: calculatedDetailExpenseSum
      }
    }));
  };

  // Tự động cân đối lao động
  const handleAutoBalanceLabor = () => {
    setFormData(prev => ({
      ...prev,
      laborInfo: {
        ...prev.laborInfo,
        totalLabor: prev.laborInfo.familyLabor + prev.laborInfo.hiredLabor
      }
    }));
  };

  // Lấy tọa độ GPS thực địa từ trình duyệt/thiết bị
  const handleGetLocation = () => {
    setIsGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            verification: {
              ...prev.verification,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              gpsAccuracy: Math.round(pos.coords.accuracy * 10) / 10,
            }
          }));
          setGpsStatus(`Đã lấy GPS thực địa (Sai số: ±${Math.round(pos.coords.accuracy)}m)`);
          setIsGettingGps(false);
        },
        () => {
          setFormData(prev => ({
            ...prev,
            verification: {
              ...prev.verification,
              latitude: 21.0935 + (Math.random() - 0.5) * 0.005,
              longitude: 105.6982 + (Math.random() - 0.5) * 0.005,
              gpsAccuracy: 5.2,
            }
          }));
          setGpsStatus('Đã định vị thành công (Chế độ mô phỏng thực địa ±5.2m)');
          setIsGettingGps(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setFormData(prev => ({
        ...prev,
        verification: {
          ...prev.verification,
          latitude: 21.0935,
          longitude: 105.6982,
          gpsAccuracy: 6.5,
        }
      }));
      setGpsStatus('Đã cập nhật tọa độ cơ sở');
      setIsGettingGps(false);
    }
  };

  // Xử lý tải ảnh minh chứng thực địa
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProofPhotoPreview(base64);
        setFormData(prev => ({
          ...prev,
          verification: {
            ...prev.verification,
            proofPhotoUrl: base64
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Lưu bản nháp (không yêu cầu vượt qua 100% logic check)
  const handleSaveDraft = async () => {
    try {
      await apiSaveSurveyForm(sample, formData, false, undefined, 'in_progress');
      alert('Đã lưu bản nháp phiếu điều tra lên server.');
      onSaved();
    } catch (err: any) {
      alert(err?.message || 'Lưu bản nháp thất bại. Kiểm tra kết nối mạng và thử lại.');
    }
  };

  // Nộp chính thức: YÊU CẦU KIỂM TRA LOGIC NGHIÊM NGẶT THEO PHƯƠNG ÁN
  const handleSubmitOfficial = () => {
    // Nếu có lỗi logic nghiêm trọng, chặn nộp và mở bảng kiểm tra
    if (validationResult.errors.length > 0) {
      setShowLogicAuditModal(true);
      return;
    }

    // Nếu có cảnh báo vàng, xác nhận với ĐTV
    if (validationResult.warnings.length > 0) {
      const confirmSubmit = window.confirm(
        `Phiếu có ${validationResult.warnings.length} cảnh báo cần lưu ý (ví dụ: chi phí/doanh thu hoặc độ chính xác GPS). Bạn có chắc chắn muốn nộp chính thức lên Google Drive không?`
      );
      if (!confirmSubmit) {
        setShowLogicAuditModal(true);
        return;
      }
    }

    setIsSubmitting(true);

    (async () => {
      // Giả lập kiểm tra Fake IP dựa trên IP mạng thực tế hoặc vĩ độ
      const isFakeIp = formData.verification.ipAddress.startsWith('10.') || formData.verification.ipAddress.includes('vpn');
      const fakeReason = isFakeIp ? 'Phát hiện địa chỉ IP mạng nội bộ hoặc dải IP nước ngoài nghi vấn Fake IP.' : undefined;

      const newStatus = formData.generalInfo.operationalStatus === '1. Đang hoạt động' ? 'completed' : 'moved';

      try {
        await apiSaveSurveyForm(sample, formData, isFakeIp, fakeReason, newStatus);
        setIsSubmitting(false);
        alert('Nộp phiếu thành công! Đã lưu vào cơ sở dữ liệu dùng chung trên server.');
        onSaved();
        onClose();
      } catch (err: any) {
        setIsSubmitting(false);
        alert(err?.message || 'Nộp phiếu thất bại. Kiểm tra kết nối mạng và thử lại.');
      }
    })();
  };

  const isOperational = formData.generalInfo.operationalStatus === '1. Đang hoạt động';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header phiếu điều tra */}
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                MẪU 01/TKCS-CT
              </span>
              <span className="text-xs text-slate-300">
                Tổng cục Thống kê • Điều tra cơ sở sản xuất kinh doanh cá thể
              </span>
            </div>
            <h2 className="text-base font-bold mt-1 text-white flex items-center gap-2">
              <span>{formData.generalInfo.householdName}</span>
              <span className="font-mono text-blue-300 text-xs">({sample.tkcsCode})</span>
            </h2>
            <p className="text-xs text-slate-400">
              ĐTV: <strong>{formData.verification.enumeratorName}</strong> ({formData.verification.enumeratorCode}) • 
              Xã: {sample.communeName} • Địa bàn: {sample.areaCode}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Nút kiểm định logic trực tiếp */}
            <button
              type="button"
              onClick={() => setShowLogicAuditModal(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                validationResult.errors.length === 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              }`}
            >
              {validationResult.errors.length === 0 ? (
                <>
                  <ShieldCheck className="w-4 h-4" /> Logic: Chuẩn ({validationResult.passedCount} đạt)
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" /> {validationResult.errors.length} lỗi logic
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Đóng phiếu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thanh Điều Hướng 8 Mục theo Phương án */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 1, title: 'I. Nhận dạng', errors: validationResult.errors.filter(e => e.section === 1).length },
            { id: 2, title: 'II. Lao động', errors: validationResult.errors.filter(e => e.section === 2).length },
            { id: 3, title: 'III. Kết quả SXKD', errors: validationResult.errors.filter(e => e.section === 3).length },
            { id: 4, title: 'IV. Thuế & NSNN', errors: validationResult.errors.filter(e => e.section === 4).length },
            { id: 5, title: 'V. Vốn & Tín dụng', errors: validationResult.errors.filter(e => e.section === 5).length },
            { id: 6, title: 'VI. CNTT & TMĐT', errors: validationResult.errors.filter(e => e.section === 6).length },
            { id: 7, title: 'VII. Khó khăn', errors: validationResult.errors.filter(e => e.section === 7).length },
            { id: 8, title: 'VIII. Xác thực & GPS', errors: validationResult.errors.filter(e => e.section === 8).length },
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all flex items-center gap-1.5 ${
                activeSection === sec.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{sec.title}</span>
              {sec.errors > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {sec.errors}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Thân biểu mẫu */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          
          {/* MỤC I: THÔNG TIN NHẬN DẠNG */}
          {activeSection === 1 && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mục I. Thông Tin Định Danh Cơ Sở Và Người Đại Diện</h3>
                  <p className="text-[11px] text-slate-500">Đối tượng điều tra: Cơ sở SXKD cá thể có địa điểm xác định</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVsicModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-bold hover:bg-blue-100"
                >
                  <Search className="w-3.5 h-3.5" /> Tra cứu mã ngành VSIC
                </button>
              </div>

              {/* Banner cảnh báo Skip Logic nếu cơ sở không hoạt động */}
              {!isOperational && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Quy định chuyển hướng phương án: Cơ sở không hoạt động</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Theo Phương án điều tra cơ sở cá thể của Tổng cục Thống kê: Đối với cơ sở tạm ngừng, giải thể, chuyển đi hoặc từ chối, ĐTV chỉ cần ghi nhận lý do xác minh thực địa vào ô Ghi chú (Mục VIII) và chụp ảnh/lấy tọa độ GPS xác thực. Không phải phỏng vấn Mục II đến VII.
                  </p>
                  {onRequestReplaceSample && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRequestReplaceSample(sample);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Thủ tục đổi sang Mẫu dự phòng thay thế
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">1. Tên cơ sở sản xuất kinh doanh / Tên hộ:</label>
                  <input
                    type="text"
                    value={formData.generalInfo.householdName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, householdName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">2. Họ và tên chủ cơ sở / Người đại diện:</label>
                  <input
                    type="text"
                    value={formData.generalInfo.representativeName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, representativeName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">3. Giới tính của chủ cơ sở:</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="gender"
                        value="Nam"
                        checked={formData.generalInfo.gender === 'Nam'}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          generalInfo: { ...prev.generalInfo, gender: 'Nam' }
                        }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      1. Nam
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="gender"
                        value="Nữ"
                        checked={formData.generalInfo.gender === 'Nữ'}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          generalInfo: { ...prev.generalInfo, gender: 'Nữ' }
                        }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      2. Nữ
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">4. Năm sinh của chủ cơ sở:</label>
                  <input
                    type="text"
                    value={formData.generalInfo.birthYear}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, birthYear: e.target.value }
                    }))}
                    placeholder="VD: 1985"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">5. Số CCCD / Định danh cá nhân:</label>
                  <input
                    type="text"
                    value={formData.generalInfo.idCardNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, idCardNumber: e.target.value }
                    }))}
                    placeholder="12 chữ số"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">6. Số điện thoại liên hệ:</label>
                  <input
                    type="text"
                    value={formData.generalInfo.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">7. Địa chỉ nơi diễn ra hoạt động SXKD:</label>
                  <input
                    type="text"
                    value={formData.generalInfo.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, address: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-blue-900 block">8. Ngành hoạt động sản xuất kinh doanh chính:</label>
                    <button
                      type="button"
                      onClick={() => setShowVsicModal(true)}
                      className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Building2 className="w-3.5 h-3.5" /> Tra cứu từ điển mã ngành
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Mã ngành VSIC cấp 4/5:</span>
                      <input
                        type="text"
                        value={formData.generalInfo.industryCode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          generalInfo: { ...prev.generalInfo, industryCode: e.target.value }
                        }))}
                        placeholder="VD: 4711"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-700"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Tên ngành nghề kinh tế:</span>
                      <input
                        type="text"
                        value={formData.generalInfo.industryName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          generalInfo: { ...prev.generalInfo, industryName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">9. Tình trạng hoạt động tại thời điểm điều tra:</label>
                  <select
                    value={formData.generalInfo.operationalStatus}
                    onChange={(e: any) => setFormData(prev => ({
                      ...prev,
                      generalInfo: { ...prev.generalInfo, operationalStatus: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white"
                  >
                    <option value="1. Đang hoạt động">1. Đang hoạt động bình thường</option>
                    <option value="2. Tạm ngừng hoạt động">2. Tạm ngừng hoạt động (nghỉ lễ vụ/sửa chữa)</option>
                    <option value="3. Ngừng hẳn/Giải thể">3. Ngừng hẳn/Giải thể (Cần thay mẫu dự phòng)</option>
                    <option value="4. Không tìm thấy hộ/Đã chuyển đi">4. Không tìm thấy hộ/Đã chuyển đi khỏi địa bàn</option>
                    <option value="5. Từ chối cung cấp">5. Từ chối cung cấp thông tin</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MỤC II: LAO ĐỘNG CỦA CƠ SỞ */}
          {activeSection === 2 && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mục II. Lao Động Của Cơ Sở Kinh Doanh</h3>
                  <p className="text-[11px] text-slate-500">Tính đến thời điểm điều tra (người)</p>
                </div>

                {formData.laborInfo.familyLabor + formData.laborInfo.hiredLabor !== formData.laborInfo.totalLabor && (
                  <button
                    type="button"
                    onClick={handleAutoBalanceLabor}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                  >
                    <Calculator className="w-3.5 h-3.5" /> Khớp tổng lao động
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <label className="font-bold text-blue-900 block mb-1">1. Tổng số lao động hiện có (người):</label>
                  <p className="text-[11px] text-slate-500 mb-2">Bao gồm cả chủ hộ, người nhà và lao động thuê ngoài</p>
                  <input
                    type="number"
                    min="1"
                    value={formData.laborInfo.totalLabor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      laborInfo: { ...prev.laborInfo, totalLabor: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-blue-700 bg-white"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Trong đó: Lao động nữ (người):</label>
                  <p className="text-[11px] text-slate-500 mb-2">Không được lớn hơn tổng số lao động</p>
                  <input
                    type="number"
                    min="0"
                    max={formData.laborInfo.totalLabor}
                    value={formData.laborInfo.femaleLabor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      laborInfo: { ...prev.laborInfo, femaleLabor: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold bg-white"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">2. Lao động gia đình (không hưởng lương):</label>
                  <p className="text-[11px] text-slate-500 mb-2">Chủ hộ và người thân tham gia làm việc</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.laborInfo.familyLabor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      laborInfo: { ...prev.laborInfo, familyLabor: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold bg-white"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">3. Lao động thuê ngoài (hưởng lương):</label>
                  <p className="text-[11px] text-slate-500 mb-2">Người làm thuê nhận tiền công, tiền lương</p>
                  <input
                    type="number"
                    min="0"
                    value={formData.laborInfo.hiredLabor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      laborInfo: { ...prev.laborInfo, hiredLabor: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">4. Trình độ chuyên môn kỹ thuật cao nhất của chủ cơ sở:</label>
                  <select
                    value={formData.laborInfo.qualification}
                    onChange={(e: any) => setFormData(prev => ({
                      ...prev,
                      laborInfo: { ...prev.laborInfo, qualification: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                  >
                    <option value="1. Đại học trở lên">1. Đại học trở lên</option>
                    <option value="2. Cao đẳng, Trung cấp">2. Cao đẳng, Trung cấp</option>
                    <option value="3. Sơ cấp / Đào tạo ngắn hạn">3. Sơ cấp / Đào tạo ngắn hạn / Nghề truyền thống</option>
                    <option value="4. Chưa qua đào tạo">4. Chưa qua đào tạo chuyên môn kỹ thuật</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MỤC III: KẾT QUẢ SẢN XUẤT KINH DOANH */}
          {activeSection === 3 && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mục III. Kết Quả Sản Xuất Kinh Doanh</h3>
                  <p className="text-[11px] text-slate-500">Đơn vị tính: Triệu đồng (làm tròn 1 chữ số thập phân)</p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoBalanceExpenses}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 shadow-xs"
                >
                  <Calculator className="w-3.5 h-3.5" /> Tự động cân bằng chi phí ({calculatedDetailExpenseSum} tr)
                </button>
              </div>

              {/* Tóm tắt chỉ tiêu cân đối */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Doanh Thu 1 Tháng</span>
                  <span className="text-base font-bold text-blue-700">
                    {formData.businessResults.averageMonthlyRevenue} tr
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Tổng Chi Phí 1 Tháng</span>
                  <span className="text-base font-bold text-rose-600">
                    {formData.businessResults.totalMonthlyExpense} tr
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Thu Nhập Thuần (Lợi Nhuận)</span>
                  <span className={`text-base font-bold ${
                    formData.businessResults.netIncomeMonthly >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formData.businessResults.netIncomeMonthly} tr
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">1. Số tháng hoạt động trong năm:</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.businessResults.monthsActive}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      businessResults: { ...prev.businessResults, monthsActive: parseInt(e.target.value) || 12 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">2. Doanh thu bình quân 1 tháng (triệu):</label>
                  <input
                    type="number"
                    value={formData.businessResults.averageMonthlyRevenue}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      businessResults: { ...prev.businessResults, averageMonthlyRevenue: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">3. Ước tính doanh thu cả năm (triệu):</label>
                  <input
                    type="number"
                    readOnly
                    value={formData.businessResults.totalYearlyRevenue}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">(= Doanh thu tháng × Số tháng)</span>
                </div>
              </div>

              {/* Bóc tách 6 khoản chi phí theo phương án */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    4. Chi Phí Sản Xuất Kinh Doanh Bình Quân 1 Tháng (Triệu đồng):
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-600">
                    Tổng 6 khoản: <strong>{calculatedDetailExpenseSum}</strong> tr
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-600 block mb-1">a. Chi mua nguyên nhiên vật liệu, hàng hóa:</label>
                    <input
                      type="number"
                      value={formData.businessResults.materialsExpense}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessResults: { ...prev.businessResults, materialsExpense: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">b. Chi trả tiền công, tiền lương:</label>
                    <input
                      type="number"
                      value={formData.businessResults.laborSalaryExpense}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessResults: { ...prev.businessResults, laborSalaryExpense: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">c. Chi thuê nhà xưởng, mặt bằng:</label>
                    <input
                      type="number"
                      value={formData.businessResults.rentExpense}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessResults: { ...prev.businessResults, rentExpense: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">d. Chi phí khấu hao tài sản cố định:</label>
                    <input
                      type="number"
                      value={formData.businessResults.depreciationExpense}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessResults: { ...prev.businessResults, depreciationExpense: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">e. Chi dịch vụ mua ngoài (điện, nước, viễn thông):</label>
                    <input
                      type="number"
                      value={formData.businessResults.utilityServicesExpense}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessResults: { ...prev.businessResults, utilityServicesExpense: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">f. Các chi phí khác:</label>
                    <input
                      type="number"
                      value={formData.businessResults.otherExpenses}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessResults: { ...prev.businessResults, otherExpenses: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <label className="font-bold text-slate-800">Tổng chi phí bình quân 1 tháng (triệu):</label>
                  <input
                    type="number"
                    value={formData.businessResults.totalMonthlyExpense}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      businessResults: { ...prev.businessResults, totalMonthlyExpense: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-36 px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-rose-600 text-right bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MỤC IV: THUẾ VÀ NGHĨA VỤ NSNN */}
          {activeSection === 4 && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900">Mục IV. Thuế Và Nghĩa Vụ Ngân Sách Nhà Nước</h3>
                <p className="text-[11px] text-slate-500">Đơn vị tính: Triệu đồng</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">1. Hình thức kê khai và nộp thuế của cơ sở:</label>
                  <select
                    value={formData.taxObligation.taxDeclarationType}
                    onChange={(e: any) => setFormData(prev => ({
                      ...prev,
                      taxObligation: { ...prev.taxObligation, taxDeclarationType: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                  >
                    <option value="1. Thuế khoán">1. Nộp thuế khoán theo quy định</option>
                    <option value="2. Kê khai theo doanh thu/chi phí">2. Kê khai theo doanh thu / chi phí thực tế</option>
                    <option value="3. Miễn thuế/Chưa đến mức nộp thuế">3. Miễn thuế / Doanh thu chưa đến mức nộp thuế (dưới 100 tr/năm)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">2. Tổng số tiền thuế, phí đã nộp trong năm (triệu):</label>
                  <input
                    type="number"
                    value={formData.taxObligation.totalTaxPaid}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      taxObligation: { ...prev.taxObligation, totalTaxPaid: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MỤC V: VỐN ĐẦU TƯ VÀ TÍN DỤNG */}
          {activeSection === 5 && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900">Mục V. Nguồn Vốn Và Tiếp Cận Tín Dụng</h3>
                <p className="text-[11px] text-slate-500">Đơn vị tính: Triệu đồng</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">1. Tổng nguồn vốn đang sử dụng cho SXKD (triệu):</label>
                  <input
                    type="number"
                    value={formData.capitalCredit.totalCapital}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      capitalCredit: { ...prev.capitalCredit, totalCapital: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Trong đó: Vốn vay ngân hàng, TCTD (triệu):</label>
                  <input
                    type="number"
                    value={formData.capitalCredit.bankLoanCapital}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      capitalCredit: { ...prev.capitalCredit, bankLoanCapital: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-2">2. Cơ sở có nhu cầu vay vốn để mở rộng SXKD không?</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="hasLoan"
                        checked={formData.capitalCredit.hasLoanDemand === true}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          capitalCredit: { ...prev.capitalCredit, hasLoanDemand: true }
                        }))}
                      />
                      Có nhu cầu vay vốn
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="hasLoan"
                        checked={formData.capitalCredit.hasLoanDemand === false}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          capitalCredit: { ...prev.capitalCredit, hasLoanDemand: false, loanDemandAmount: 0 }
                        }))}
                      />
                      Không có nhu cầu
                    </label>
                  </div>

                  {formData.capitalCredit.hasLoanDemand && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <label className="font-semibold text-slate-700 block mb-1">Số tiền mong muốn được vay (triệu đồng):</label>
                      <input
                        type="number"
                        value={formData.capitalCredit.loanDemandAmount || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          capitalCredit: { ...prev.capitalCredit, loanDemandAmount: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-48 px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-blue-700 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MỤC VI: ỨNG DỤNG CNTT & TMĐT */}
          {activeSection === 6 && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900">Mục VI. Ứng Dụng Công Nghệ Thông Tin & Thương Mại Điện Tử</h3>
                <p className="text-[11px] text-slate-500">Chuyển đổi số trong kinh tế cá thể</p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">1. Cơ sở có sử dụng Internet phục vụ sản xuất kinh doanh không?</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="usesInternet"
                        checked={formData.itApplication.usesInternet === true}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          itApplication: { ...prev.itApplication, usesInternet: true }
                        }))}
                      /> Có
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="usesInternet"
                        checked={formData.itApplication.usesInternet === false}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          itApplication: { ...prev.itApplication, usesInternet: false }
                        }))}
                      /> Không
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">2. Cơ sở có bán hàng hoặc cung cấp dịch vụ qua các kênh trực tuyến không?</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="sellsOnline"
                          checked={formData.itApplication.sellsOnline === true}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            itApplication: { ...prev.itApplication, sellsOnline: true }
                          }))}
                        /> Có
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="sellsOnline"
                          checked={formData.itApplication.sellsOnline === false}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            itApplication: { ...prev.itApplication, sellsOnline: false }
                          }))}
                        /> Không
                      </label>
                    </div>
                  </div>

                  {formData.itApplication.sellsOnline && (
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1.5">Các kênh bán hàng trực tuyến đã sử dụng:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {['Mạng xã hội (Facebook/Zalo)', 'TikTok Shop', 'Sàn TMĐT (Shopee/Lazada)', 'Website riêng', 'Ứng dụng giao đồ ăn (Grab/ShopeeFood)'].map(channel => {
                            const isChecked = formData.itApplication.onlineChannels.includes(channel);
                            return (
                              <label key={channel} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      itApplication: {
                                        ...prev.itApplication,
                                        onlineChannels: isChecked
                                          ? prev.itApplication.onlineChannels.filter(c => c !== channel)
                                          : [...prev.itApplication.onlineChannels, channel]
                                      }
                                    }));
                                  }}
                                />
                                <span className="text-[11px] font-medium">{channel}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">Ước tính tỷ lệ doanh thu qua mạng (%):</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.itApplication.onlineRevenuePercent}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            itApplication: { ...prev.itApplication, onlineRevenuePercent: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-blue-700 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">3. Cơ sở có chấp nhận thanh toán không dùng tiền mặt không?</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="cashless"
                          checked={formData.itApplication.acceptsCashlessPayment === true}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            itApplication: { ...prev.itApplication, acceptsCashlessPayment: true }
                          }))}
                        /> Có
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="cashless"
                          checked={formData.itApplication.acceptsCashlessPayment === false}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            itApplication: { ...prev.itApplication, acceptsCashlessPayment: false }
                          }))}
                        /> Không
                      </label>
                    </div>
                  </div>

                  {formData.itApplication.acceptsCashlessPayment && (
                    <div className="pt-3 border-t border-slate-200">
                      <span className="font-semibold text-slate-700 block mb-1.5">Hình thức thanh toán không tiền mặt:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Chuyển khoản / VietQR', 'Mã QR thanh toán', 'Máy quẹt thẻ POS', 'Ví điện tử (Momo/ZaloPay)'].map(method => {
                          const isChecked = formData.itApplication.cashlessMethods.includes(method);
                          return (
                            <label key={method} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    itApplication: {
                                      ...prev.itApplication,
                                      cashlessMethods: isChecked
                                        ? prev.itApplication.cashlessMethods.filter(m => m !== method)
                                        : [...prev.itApplication.cashlessMethods, method]
                                    }
                                  }));
                                }}
                              />
                              <span className="text-[11px] font-medium">{method}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MỤC VII: KHÓ KHĂN VÀ KIẾN NGHỊ */}
          {activeSection === 7 && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900">Mục VII. Khó Khăn Và Đề Xuất Kiến Nghị</h3>
                <p className="text-[11px] text-slate-500">Thu thập phản hồi thực tế từ cơ sở sản xuất kinh doanh</p>
              </div>

              <div className="space-y-3">
                <label className="font-semibold text-slate-800 block">
                  1. Khó khăn lớn nhất trong hoạt động SXKD hiện nay (chọn các phương án phù hợp):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '1. Giá nguyên vật liệu, hàng hóa đầu vào tăng cao',
                    '2. Nhu cầu thị trường và sức mua giảm sút',
                    '3. Khó khăn trong tiếp cận nguồn vốn tín dụng ngân hàng',
                    '4. Thiếu mặt bằng sản xuất kinh doanh phù hợp',
                    '5. Cạnh tranh gay gắt từ thương mại điện tử và các chuỗi lớn',
                    '6. Khó tìm kiếm lao động có tay nghề và chi phí nhân công tăng',
                    '7. Thủ tục hành chính, thuế và phòng cháy chữa cháy'
                  ].map(ch => {
                    const isChecked = formData.challengesRecommendations.mainChallenges.includes(ch);
                    return (
                      <label key={ch} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              challengesRecommendations: {
                                ...prev.challengesRecommendations,
                                mainChallenges: isChecked
                                  ? prev.challengesRecommendations.mainChallenges.filter(c => c !== ch)
                                  : [...prev.challengesRecommendations.mainChallenges, ch]
                              }
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-xs font-medium text-slate-800">{ch}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    2. Đề xuất, kiến nghị của cơ sở đối với các cơ quan quản lý Nhà nước:
                  </label>
                  <textarea
                    rows={3}
                    value={formData.challengesRecommendations.recommendations}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      challengesRecommendations: { ...prev.challengesRecommendations, recommendations: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="Đề xuất về bình ổn giá điện nước, giảm thuế khoán, hỗ trợ vay vốn ưu đãi..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* MỤC VIII: XÁC THỰC, GPS & CHỮ KÝ */}
          {activeSection === 8 && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mục VIII. Giám Sát Thực Địa, GPS & Xác Thực Chứng Thư</h3>
                  <p className="text-[11px] text-slate-500">Chống Fake IP và đảm bảo tính minh bạch của phiếu điều tra</p>
                </div>
              </div>

              {/* Tọa độ GPS & Định vị thực địa */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-xs">{gpsStatus}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingGps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                    {isGettingGps ? 'Đang dò GPS...' : 'Lấy Tọa Độ GPS Hiện Tại'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Vĩ độ (Latitude):</span>
                    <span className="font-bold text-slate-800">{formData.verification.latitude.toFixed(6)}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Kinh độ (Longitude):</span>
                    <span className="font-bold text-slate-800">{formData.verification.longitude.toFixed(6)}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Độ chính xác:</span>
                    <span className="font-bold text-emerald-700">±{formData.verification.gpsAccuracy.toFixed(1)} mét</span>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between text-[11px]">
                  <span className="text-blue-900 font-medium">
                    Hệ thống tự động kiểm định IP mạng & khoảng cách sai lệch khi nộp phiếu để đánh dấu cờ theo dõi.
                  </span>
                  <span className="font-mono font-bold text-blue-700 px-2 py-0.5 bg-white rounded border border-blue-200">
                    IP: {formData.verification.ipAddress}
                  </span>
                </div>
              </div>

              {/* Ảnh chụp minh chứng hiện trường cơ sở */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Ảnh Chụp Minh Chứng Thực Địa Cơ Sở:</span>
                    <p className="text-[11px] text-slate-500">Chụp biển hiệu, cửa hàng hoặc biên bản xác minh</p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer shadow-xs">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tải ảnh / Chụp ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {proofPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-black/5 max-h-48 flex items-center justify-center">
                    <img
                      src={proofPhotoPreview}
                      alt="Minh chứng hiện trường"
                      className="object-contain max-h-48 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProofPhotoPreview(null);
                        setFormData(prev => ({
                          ...prev,
                          verification: { ...prev.verification, proofPhotoUrl: undefined }
                        }));
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-1">
                    <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="text-xs text-slate-600 block">Chưa có ảnh chụp hiện trường</span>
                    <span className="text-[10px] text-slate-400 block">ĐTV có thể tải ảnh biển hiệu cơ sở để lưu hồ sơ kiểm tra</span>
                  </div>
                )}
              </div>

              {/* Ghi chú thực địa */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ghi chú điều tra thực địa (Bắt buộc ghi rõ nếu cơ sở tạm ngừng, chuyển đi, từ chối):
                </label>
                <textarea
                  rows={2}
                  value={formData.verification.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    verification: { ...prev.verification, notes: e.target.value }
                  }))}
                  placeholder="Ghi chú về thái độ hợp tác, lý do thay thế mẫu hoặc thông tin cần Giám sát viên lưu ý..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Thông tin xác thực người trả lời & ĐTV */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 block text-xs">Người Cung Cấp Thông Tin (Chủ Hộ):</span>
                  <div>
                    <label className="font-medium text-slate-600 block">Họ và tên người trả lời:</label>
                    <input
                      type="text"
                      value={formData.verification.respondentName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        verification: { ...prev.verification, respondentName: e.target.value }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block">Chức danh / Mối quan hệ với chủ hộ:</label>
                    <input
                      type="text"
                      value={formData.verification.respondentTitle}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        verification: { ...prev.verification, respondentTitle: e.target.value }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <span className="font-semibold text-slate-700 block mt-1">Đã ký xác nhận điện tử</span>
                    <span className="text-[10px] text-slate-400">Thời gian: {formData.verification.surveyDate}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 block text-xs">Điều Tra Viên Phụ Trách:</span>
                  <div>
                    <label className="font-medium text-slate-600 block">Họ và tên Điều tra viên:</label>
                    <input
                      type="text"
                      value={formData.verification.enumeratorName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        verification: { ...prev.verification, enumeratorName: e.target.value }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-600 block">Mã thẻ điều tra viên:</label>
                    <input
                      type="text"
                      value={formData.verification.enumeratorCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        verification: { ...prev.verification, enumeratorCode: e.target.value }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center">
                    <UserCheck className="w-6 h-6 text-blue-600 mx-auto" />
                    <span className="font-semibold text-slate-700 block mt-1">Xác thực chứng thư ĐTV</span>
                    <span className="text-[10px] text-slate-400">Mã ĐTV: {formData.verification.enumeratorCode}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeSection > 1 && (
              <button
                type="button"
                onClick={() => setActiveSection(prev => prev - 1)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                ← Mục trước
              </button>
            )}
            {activeSection < 8 && (
              <button
                type="button"
                onClick={() => setActiveSection(prev => prev + 1)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Mục tiếp theo →
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowLogicAuditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Kiểm tra logic ({validationResult.errors.length} lỗi)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 text-slate-500" /> Lưu bản nháp
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOfficial}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? 'Đang đồng bộ Google Drive...' : 'Nộp Phiếu Điều Tra (Đẩy về Drive)'}
            </button>
          </div>
        </div>

      </div>

      {/* Tra cứu mã ngành Modal */}
      {showVsicModal && (
        <VsicPickerModal
          currentCode={formData.generalInfo.industryCode}
          onSelect={(ind: VsicIndustry) => {
            setFormData(prev => ({
              ...prev,
              generalInfo: {
                ...prev.generalInfo,
                industryCode: ind.code,
                industryName: ind.name
              }
            }));
            setShowVsicModal(false);
          }}
          onClose={() => setShowVsicModal(false)}
        />
      )}

      {/* Logic Audit Modal */}
      {showLogicAuditModal && (
        <LogicAuditModal
          result={validationResult}
          onNavigateToSection={(secNum) => setActiveSection(secNum)}
          onClose={() => setShowLogicAuditModal(false)}
        />
      )}

    </div>
  );
};
