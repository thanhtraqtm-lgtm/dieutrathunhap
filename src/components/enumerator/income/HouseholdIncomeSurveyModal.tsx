import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Send, Printer, 
  ArrowLeft, ArrowRight, FileSpreadsheet, 
  Check 
} from 'lucide-react';
import { SampleHousehold } from '../../../types/survey';
import { HouseholdIncomeSurveyData } from '../../../types/householdIncomeSurvey';
import { apiSaveHouseholdIncomeSurvey } from '../../../services/surveySaveHelpers';
import { initializeIncomeSurveyData } from '../../../utils/incomeSurveyDefaults';
import { IncomeGeneralSection } from './IncomeGeneralSection';
import { IncomeSection1Salary } from './IncomeSection1Salary';
import { IncomeSection2Crops } from './IncomeSection2Crops';
import { IncomeSection3Livestock } from './IncomeSection3Livestock';
import { IncomeSection4Forestry } from './IncomeSection4Forestry';
import { IncomeSection5Fishery } from './IncomeSection5Fishery';
import { IncomeSection6NonAgri } from './IncomeSection6NonAgri';
import { IncomeSection7Other } from './IncomeSection7Other';
import { IncomeSection8Summary } from './IncomeSection8Summary';

interface Props {
  sample: SampleHousehold;
  enumeratorName?: string;
  onClose: () => void;
  onSaved: () => void;
}

type TabKey = 'general' | 'sec1' | 'sec2' | 'sec3' | 'sec4' | 'sec5' | 'sec6' | 'sec7' | 'sec8';

export const HouseholdIncomeSurveyModal: React.FC<Props> = ({
  sample,
  enumeratorName,
  onClose,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [surveyData, setSurveyData] = useState<HouseholdIncomeSurveyData>(() => {
    return sample.incomeSurveyData ? JSON.parse(JSON.stringify(sample.incomeSurveyData)) : initializeIncomeSurveyData(sample, enumeratorName);
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const printRef = useRef<HTMLDivElement>(null);

  // Tự động tính toán tổng số Biểu tổng hợp khi các mục 1-7 hoặc số nhân khẩu thay đổi
  useEffect(() => {
    const m1 = surveyData.section1.hasSalaryIncome === 1 ? (surveyData.section1.q2TotalIncome || 0) : 0;
    const m2 = surveyData.section2.hasCropsIncome === 1 ? (surveyData.section2.q2TotalIncome || 0) : 0;
    const m3 = surveyData.section3.hasLivestockIncome === 1 ? (surveyData.section3.q2TotalIncome || 0) : 0;
    const m4 = surveyData.section4.hasForestryIncome === 1 ? (surveyData.section4.q2TotalIncome || 0) : 0;
    const m5 = surveyData.section5.hasFisheryIncome === 1 ? (surveyData.section5.q2TotalIncome || 0) : 0;
    const m6 = surveyData.section6.hasNonAgriIncome === 1 ? (surveyData.section6.q2TotalIncome || 0) : 0;
    const m7 = surveyData.section7.q2TotalIncome || 0;

    const totalHouseholdIncome = m1 + m2 + m3 + m4 + m5 + m6 + m7;
    const persons = Math.max(1, surveyData.general.totalMembers || 1);
    const perCapitaYearlyIncome = Math.round(totalHouseholdIncome / persons);
    const perCapitaMonthlyIncome = Math.round((totalHouseholdIncome / (persons * 12)) * 10) / 10;

    if (
      surveyData.summary.totalHouseholdIncome !== totalHouseholdIncome ||
      surveyData.summary.perCapitaMonthlyIncome !== perCapitaMonthlyIncome ||
      surveyData.summary.income1Salary !== m1 ||
      surveyData.summary.income2Crops !== m2 ||
      surveyData.summary.income3Livestock !== m3 ||
      surveyData.summary.income4Forestry !== m4 ||
      surveyData.summary.income5Fishery !== m5 ||
      surveyData.summary.income6NonAgri !== m6 ||
      surveyData.summary.income7Other !== m7
    ) {
      setSurveyData(prev => ({
        ...prev,
        summary: {
          ...prev.summary,
          income1Salary: m1,
          income2Crops: m2,
          income3Livestock: m3,
          income4Forestry: m4,
          income5Fishery: m5,
          income6NonAgri: m6,
          income7Other: m7,
          totalHouseholdIncome,
          perCapitaYearlyIncome,
          perCapitaMonthlyIncome,
        }
      }));
    }
  }, [
    surveyData.section1.q2TotalIncome,
    surveyData.section1.hasSalaryIncome,
    surveyData.section2.q2TotalIncome,
    surveyData.section2.hasCropsIncome,
    surveyData.section3.q2TotalIncome,
    surveyData.section3.hasLivestockIncome,
    surveyData.section4.q2TotalIncome,
    surveyData.section4.hasForestryIncome,
    surveyData.section5.q2TotalIncome,
    surveyData.section5.hasFisheryIncome,
    surveyData.section6.q2TotalIncome,
    surveyData.section6.hasNonAgriIncome,
    surveyData.section7.q2TotalIncome,
    surveyData.general.totalMembers
  ]);

  const handleSaveDraft = async (showToast = true) => {
    setAutoSaveStatus('saving');
    try {
      await apiSaveHouseholdIncomeSurvey(sample, surveyData, false, undefined, 'in_progress');
      setAutoSaveStatus('saved');
      if (showToast) {
        setSaveSuccessMsg('Đã lưu bản nháp phiếu thu nhập thành công!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
      onSaved();
    } catch (err: any) {
      setAutoSaveStatus('idle');
      if (showToast) {
        alert(err?.message || 'Lưu bản nháp thất bại. Kiểm tra kết nối mạng và thử lại.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!surveyData.general.ownerName) {
      setActiveTab('general');
      alert('Vui lòng nhập Họ và tên chủ hộ ở phần Thông tin chung!');
      return;
    }

    try {
      await apiSaveHouseholdIncomeSurvey(sample, surveyData, false, undefined, 'completed');
      setSaveSuccessMsg('Đã hoàn thành và xác nhận nộp Phiếu thu nhập Phụ lục II!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onSaved();
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Nộp phiếu thất bại. Kiểm tra kết nối mạng và thử lại.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: { key: TabKey; title: string; short: string; badge?: string }[] = [
    { key: 'general', title: 'Thông tin chung', short: 'TT Chung' },
    { 
      key: 'sec1', 
      title: 'Mục 1: Tiền lương, tiền công', 
      short: 'M1. Lương',
      badge: surveyData.section1.hasSalaryIncome === 1 ? `${surveyData.section1.q2TotalIncome.toLocaleString('vi-VN')}k` : undefined
    },
    { 
      key: 'sec2', 
      title: 'Mục 2: Trồng trọt', 
      short: 'M2. Trồng trọt',
      badge: surveyData.section2.hasCropsIncome === 1 ? `${surveyData.section2.q2TotalIncome.toLocaleString('vi-VN')}k` : undefined
    },
    { 
      key: 'sec3', 
      title: 'Mục 3: Chăn nuôi', 
      short: 'M3. Chăn nuôi',
      badge: surveyData.section3.hasLivestockIncome === 1 ? `${surveyData.section3.q2TotalIncome.toLocaleString('vi-VN')}k` : undefined
    },
    { 
      key: 'sec4', 
      title: 'Mục 4: Lâm nghiệp', 
      short: 'M4. Lâm nghiệp',
      badge: surveyData.section4.hasForestryIncome === 1 ? `${surveyData.section4.q2TotalIncome.toLocaleString('vi-VN')}k` : undefined
    },
    { 
      key: 'sec5', 
      title: 'Mục 5: Thủy sản', 
      short: 'M5. Thủy sản',
      badge: surveyData.section5.hasFisheryIncome === 1 ? `${surveyData.section5.q2TotalIncome.toLocaleString('vi-VN')}k` : undefined
    },
    { 
      key: 'sec6', 
      title: 'Mục 6: Phi NLTS & chế biến', 
      short: 'M6. Phi NLTS',
      badge: surveyData.section6.hasNonAgriIncome === 1 ? `${surveyData.section6.q2TotalIncome.toLocaleString('vi-VN')}k` : undefined
    },
    { 
      key: 'sec7', 
      title: 'Mục 7: Thu khác', 
      short: 'M7. Thu khác',
      badge: surveyData.section7.q2TotalIncome > 0 ? `${surveyData.section7.q2TotalIncome.toLocaleString('vi-VN')}k` : undefined
    },
    { 
      key: 'sec8', 
      title: 'Mục 8: Biểu tổng hợp', 
      short: 'Biểu Tổng Hợp',
      badge: `${surveyData.summary.totalHouseholdIncome.toLocaleString('vi-VN')}k`
    },
  ];

  const currentTabIdx = tabs.findIndex(t => t.key === activeTab);
  const handlePrevTab = () => {
    if (currentTabIdx > 0) setActiveTab(tabs[currentTabIdx - 1].key);
  };
  const handleNextTab = () => {
    if (currentTabIdx < tabs.length - 1) setActiveTab(tabs[currentTabIdx + 1].key);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-slate-300">
        {/* Header Quốc hiệu & Tiêu đề biểu mẫu */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-5 py-3 rounded-t-xl shrink-0 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-yellow-400 text-blue-950 px-2 py-0.5 rounded">
                  PHỤ LỤC II - TỔNG CỤC THỐNG KÊ
                </span>
                <span className="text-xs text-blue-200">Mã hộ: <strong>{sample.tkcsCode}</strong></span>
              </div>
              <h2 className="text-base font-bold leading-tight mt-0.5">
                PHIẾU THU THẬP THÔNG TIN VỀ THU NHẬP CỦA HỘ DÂN CƯ
              </h2>
              <p className="text-[11px] text-blue-200">
                Chủ hộ: <strong>{surveyData.general.ownerName || sample.householdName}</strong> • {sample.communeName}, {sample.districtName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="In phiếu khảo sát"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In phiếu</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thanh KPI tóm tắt thu nhập thời gian thực */}
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-slate-600">Số nhân khẩu: </span>
              <span className="font-bold text-slate-900">{surveyData.general.totalMembers} người</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-600">Tổng thu nhập 12 tháng: </span>
              <span className="font-mono font-bold text-blue-800 text-sm">
                {surveyData.summary.totalHouseholdIncome.toLocaleString('vi-VN')}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">nghìn đồng</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-600">Bình quân 1 người/tháng: </span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">
                {surveyData.summary.perCapitaMonthlyIncome.toLocaleString('vi-VN')}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">nghìn đồng</span>
            </div>
          </div>

          {/* Trạng thái lưu */}
          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium text-[11px] animate-fade-in">
                <Check className="w-3.5 h-3.5" /> {saveSuccessMsg}
              </span>
            )}
            {autoSaveStatus === 'saving' && (
              <span className="text-slate-500 text-[11px] italic">Đang lưu...</span>
            )}
          </div>
        </div>

        {/* Navigation Tabs chuẩn xác theo các Mục của Phụ lục II */}
        <div className="bg-white border-b border-slate-300 px-3 py-1.5 flex gap-1 overflow-x-auto shrink-0 shadow-xs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
              }`}
            >
              <span>{tab.short}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal ${
                  activeTab === tab.key ? 'bg-blue-900 text-yellow-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Vùng nội dung từng mục */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/70">
          {activeTab === 'general' && (
            <IncomeGeneralSection
              general={surveyData.general}
              onChange={(updated) => setSurveyData({ ...surveyData, general: updated })}
            />
          )}

          {activeTab === 'sec1' && (
            <IncomeSection1Salary
              section1={surveyData.section1}
              onChange={(updated) => setSurveyData({ ...surveyData, section1: updated })}
            />
          )}

          {activeTab === 'sec2' && (
            <IncomeSection2Crops
              section2={surveyData.section2}
              onChange={(updated) => setSurveyData({ ...surveyData, section2: updated })}
            />
          )}

          {activeTab === 'sec3' && (
            <IncomeSection3Livestock
              section3={surveyData.section3}
              onChange={(updated) => setSurveyData({ ...surveyData, section3: updated })}
            />
          )}

          {activeTab === 'sec4' && (
            <IncomeSection4Forestry
              section4={surveyData.section4}
              onChange={(updated) => setSurveyData({ ...surveyData, section4: updated })}
            />
          )}

          {activeTab === 'sec5' && (
            <IncomeSection5Fishery
              section5={surveyData.section5}
              onChange={(updated) => setSurveyData({ ...surveyData, section5: updated })}
            />
          )}

          {activeTab === 'sec6' && (
            <IncomeSection6NonAgri
              section6={surveyData.section6}
              onChange={(updated) => setSurveyData({ ...surveyData, section6: updated })}
            />
          )}

          {activeTab === 'sec7' && (
            <IncomeSection7Other
              section7={surveyData.section7}
              onChange={(updated) => setSurveyData({ ...surveyData, section7: updated })}
            />
          )}

          {activeTab === 'sec8' && (
            <IncomeSection8Summary
              data={surveyData}
              onChange={(updated) => setSurveyData(updated)}
            />
          )}
        </div>

        {/* Footer controls: Chuyển bước & Lưu/Gửi */}
        <div className="bg-white border-t border-slate-300 px-5 py-3 rounded-b-xl shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevTab}
              disabled={currentTabIdx === 0}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Mục trước
            </button>
            <button
              type="button"
              onClick={handleNextTab}
              disabled={currentTabIdx === tabs.length - 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Mục sau <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveDraft(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300"
            >
              <Save className="w-4 h-4 text-blue-700" />
              Lưu nháp
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Hoàn thành & Gửi phiếu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
