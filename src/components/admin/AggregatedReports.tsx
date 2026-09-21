import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  FileText, FileSpreadsheet, TrendingUp, Users, DollarSign, 
  Briefcase, Globe, AlertCircle, Eye, Printer, ChevronRight,
  Sparkles, CheckCircle2, Award, Building2, Layers
} from 'lucide-react';
import { SampleHousehold } from '../../types/survey';
import { StorageService } from '../../services/storageService';

interface AggregatedReportsProps {
  samples: SampleHousehold[];
  onViewSurvey: (sample: SampleHousehold) => void;
}

export const AggregatedReports: React.FC<AggregatedReportsProps> = ({ samples, onViewSurvey }) => {
  const [reportType, setReportType] = useState<'income' | 'business'>('income');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const completedSamples = samples.filter(s => s.surveyStatus === 'completed' && s.surveyData);

  // Bộ lọc
  const filteredCompleted = completedSamples.filter(s => {
    const matchCommune = selectedCommune === 'all' || s.communeCode === selectedCommune;
    const matchIndustry = selectedIndustry === 'all' || s.industryCode === selectedIndustry;
    return matchCommune && matchIndustry;
  });

  const communes = Array.from(new Set(samples.map(s => JSON.stringify({ code: s.communeCode, name: s.communeName })))).map(s => JSON.parse(s));
  const industries = Array.from(new Set(samples.map(s => JSON.stringify({ code: s.industryCode, name: s.industryName })))).map(s => JSON.parse(s));

  // 1. TÍNH TOÁN SỐ LIỆU TỔNG HỢP CƠ SỞ CÁ THỂ (01/TKCS-CT)
  const count = filteredCompleted.length;
  const totalLabor = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.laborInfo.totalLabor || 0), 0);
  const femaleLabor = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.laborInfo.femaleLabor || 0), 0);
  const totalMonthlyRevenue = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.averageMonthlyRevenue || 0), 0);
  const totalYearlyRevenue = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.totalYearlyRevenue || 0), 0);
  const totalMonthlyExpense = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.totalMonthlyExpense || 0), 0);
  const totalNetIncome = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.netIncomeMonthly || 0), 0);
  const totalTaxPaid = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.taxObligation.totalTaxPaid || 0), 0);

  const avgLabor = count > 0 ? (totalLabor / count).toFixed(1) : '0';
  const avgMonthlyRevenue = count > 0 ? (totalMonthlyRevenue / count).toFixed(1) : '0';
  const avgMonthlyExpense = count > 0 ? (totalMonthlyExpense / count).toFixed(1) : '0';
  const avgNetIncome = count > 0 ? (totalNetIncome / count).toFixed(1) : '0';

  // Cơ cấu chi phí sản xuất kinh doanh
  const totalMaterials = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.materialsExpense || 0), 0);
  const totalSalary = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.laborSalaryExpense || 0), 0);
  const totalRent = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.rentExpense || 0), 0);
  const totalDepreciation = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.depreciationExpense || 0), 0);
  const totalUtility = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.utilityServicesExpense || 0), 0);
  const totalOther = filteredCompleted.reduce((sum, s) => sum + (s.surveyData?.businessResults.otherExpenses || 0), 0);

  const expenseBreakdownData = [
    { name: 'Nguyên vật liệu', value: Math.round(totalMaterials), color: '#3B82F6' },
    { name: 'Chi lương, công', value: Math.round(totalSalary), color: '#10B981' },
    { name: 'Thuê mặt bằng', value: Math.round(totalRent), color: '#F59E0B' },
    { name: 'Khấu hao tài sản', value: Math.round(totalDepreciation), color: '#8B5CF6' },
    { name: 'Điện, nước, dịch vụ', value: Math.round(totalUtility), color: '#EC4899' },
    { name: 'Chi phí khác', value: Math.round(totalOther), color: '#64748B' }
  ].filter(d => d.value > 0);

  // 2. TÍNH TOÁN SỐ LIỆU THU NHẬP BÌNH QUÂN ĐẦU NGƯỜI CẤP XÃ (CHUẨN GSO TIÊU CHÍ 10 NTM)
  // Tổng nhân khẩu thực tế thường trú
  const totalMembers = filteredCompleted.reduce((sum, s) => sum + (s.memberCount || s.surveyData?.laborInfo.totalLabor || 4), 0);
  
  // Doanh thu quy đổi thu nhập các nhóm ngành (ước tính từ doanh thu thuần + thu nhập hộ)
  const incomeFromAgri = filteredCompleted
    .filter(s => (s.mainIncomeSourceCode || 4) === 1)
    .reduce((sum, s) => sum + (s.surveyData?.businessResults.netIncomeMonthly || 12) * 12, 0);

  const incomeFromInd = filteredCompleted
    .filter(s => (s.mainIncomeSourceCode || 4) === 2)
    .reduce((sum, s) => sum + (s.surveyData?.businessResults.netIncomeMonthly || 18) * 12, 0);

  const incomeFromServ = filteredCompleted
    .filter(s => (s.mainIncomeSourceCode || 4) === 3)
    .reduce((sum, s) => sum + (s.surveyData?.businessResults.netIncomeMonthly || 22) * 12, 0);

  const incomeFromOther = filteredCompleted
    .filter(s => (s.mainIncomeSourceCode || 4) === 4)
    .reduce((sum, s) => sum + (s.surveyData?.businessResults.netIncomeMonthly || 15) * 12, 0);

  const totalHouseholdAnnualIncome = incomeFromAgri + incomeFromInd + incomeFromServ + incomeFromOther;
  const annualPerCapitaIncome = totalMembers > 0 ? Math.round((totalHouseholdAnnualIncome / totalMembers) * 10) / 10 : 0;
  const monthlyPerCapitaIncome = Math.round((annualPerCapitaIncome / 12) * 100) / 100;

  // Chuẩn NTM tham chiếu: 56 Tr/người/năm. Chuẩn NTM nâng cao: 68 Tr/người/năm
  const isNtmTargetMet = annualPerCapitaIncome >= 56;
  const isNtmAdvancedMet = annualPerCapitaIncome >= 68;

  const incomeSourceDistribution = [
    { name: '1. Nông lâm thủy sản', value: Math.round(incomeFromAgri), color: '#10B981' },
    { name: '2. Công nghiệp, xây dựng', value: Math.round(incomeFromInd), color: '#3B82F6' },
    { name: '3. Thương mại, dịch vụ', value: Math.round(incomeFromServ), color: '#F59E0B' },
    { name: '4. Tiền lương & nguồn khác', value: Math.round(incomeFromOther), color: '#8B5CF6' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút Xuất Excel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Chuẩn Biểu Tổng Hợp GSO
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Báo Cáo Tổng Hợp Theo Nội Dung Phiếu Điều Tra
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động tổng hợp chỉ tiêu Thu nhập bình quân đầu người cấp xã và Báo cáo hoạt động SXKD Cơ sở cá thể.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => StorageService.exportAggregatedReportToExcel(samples)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất Báo Cáo Tổng Hợp Excel
          </button>
        </div>
      </div>

      {/* Tabs chuyển đổi giữa 2 Biểu mẫu tổng hợp */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setReportType('income')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            reportType === 'income'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" /> Biểu 1: Thu Nhập Bình Quân Đầu Người Cấp Xã (Tiêu Chí 10 NTM)
        </button>
        <button
          onClick={() => setReportType('business')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            reportType === 'business'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" /> Biểu 2: Tổng Hợp Cơ Sở SXKD Cá Thể (Mẫu 01/TKCS-CT)
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Xã/Phường:</span>
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">Toàn bộ xã/phường</option>
            {communes.map((c: any) => (
              <option key={c.code} value={c.code}>[{c.code}] {c.name}</option>
            ))}
          </select>
        </div>

        {reportType === 'business' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Ngành kinh doanh:</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-xs truncate"
            >
              <option value="all">Tất cả ngành nghề</option>
              {industries.map((ind: any) => (
                <option key={ind.code} value={ind.code}>[{ind.code}] {ind.name}</option>
              ))}
            </select>
          </div>
        )}

        <span className="ml-auto text-xs font-medium text-slate-500">
          Tổng hợp từ: <strong>{count} phiếu đã điều tra hoàn thành</strong>
        </span>
      </div>

      {reportType === 'income' ? (
        /* ================= BIỂU TỔNG HỢP THU NHẬP CẤP XÃ ================= */
        <div className="space-y-6">
          {/* 4 Thẻ chỉ tiêu then chốt về Thu nhập NTM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-emerald-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Thu Nhập BQĐN / Năm</span>
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-800">{annualPerCapitaIncome}</span>
                <span className="text-xs font-bold text-slate-500">Triệu đ/người/năm</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn Tiêu chí 10 NTM: {isNtmTargetMet ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-br from-blue-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Thu Nhập BQĐN / Tháng</span>
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-800">{monthlyPerCapitaIncome}</span>
                <span className="text-xs font-bold text-slate-500">Triệu đ/tháng</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Tương đương <strong>{Math.round(monthlyPerCapitaIncome * 1000).toLocaleString('vi-VN')} đ/người/tháng</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs bg-gradient-to-br from-indigo-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Tổng Nhân Khẩu Điều Tra</span>
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-800">{totalMembers}</span>
                <span className="text-xs font-bold text-slate-500">Nhân khẩu thực tế</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Bình quân <strong>{(totalMembers / Math.max(1, count)).toFixed(1)} người / hộ mẫu</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-amber-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Chuẩn NTM Nâng Cao</span>
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-xl font-black ${isNtmAdvancedMet ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isNtmAdvancedMet ? 'ĐÃ ĐẠT (≥68 Tr)' : 'CẦN PHẤN ĐẤU'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Ngưỡng NTM Nâng Cao: <strong>68.0 Triệu đ/năm</strong>
              </div>
            </div>
          </div>

          {/* Biểu đồ Cơ cấu 4 nguồn thu nhập */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span>Cơ Cấu 4 Nguồn Thu Nhập Toàn Xã</span>
                <span className="text-xs text-slate-500 font-normal">Tổng: {totalHouseholdAnnualIncome.toLocaleString('vi-VN')} Triệu đ</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">Tỷ trọng đóng góp vào thu nhập của nhân dân</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSourceDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${(name || '').split('.')[1]?.trim() || name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {incomeSourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value.toLocaleString('vi-VN')} Triệu đồng`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Bảng Chi Tiết 4 Nhóm Nguồn Thu Nhập (Phương Án GSO)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-950 block">🌾 Nhóm 1: Nông lâm nghiệp, thủy sản</span>
                    <span className="text-[11px] text-slate-600">Trồng trọt, chăn nuôi, nuôi trồng thủy sản (sau trừ chi phí)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-800 text-sm block">{Math.round(incomeFromAgri).toLocaleString('vi-VN')} Tr</span>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {totalHouseholdAnnualIncome ? Math.round((incomeFromAgri / totalHouseholdAnnualIncome) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-blue-950 block">🏭 Nhóm 2: Công nghiệp, xây dựng</span>
                    <span className="text-[11px] text-slate-600">Sản xuất tiểu thủ công nghiệp, thợ cơ khí, mộc, xây dựng</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-blue-800 text-sm block">{Math.round(incomeFromInd).toLocaleString('vi-VN')} Tr</span>
                    <span className="text-[10px] font-semibold text-blue-600">
                      {totalHouseholdAnnualIncome ? Math.round((incomeFromInd / totalHouseholdAnnualIncome) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-950 block">🏪 Nhóm 3: Thương mại, dịch vụ</span>
                    <span className="text-[11px] text-slate-600">Bán buôn, bán lẻ, vận tải, ăn uống, dịch vụ đời sống</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-800 text-sm block">{Math.round(incomeFromServ).toLocaleString('vi-VN')} Tr</span>
                    <span className="text-[10px] font-semibold text-amber-600">
                      {totalHouseholdAnnualIncome ? Math.round((incomeFromServ / totalHouseholdAnnualIncome) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-purple-950 block">💼 Nhóm 4: Nguồn khác</span>
                    <span className="text-[11px] text-slate-600">Tiền lương công nhân/viên chức, lương hưu, trợ cấp, kiều hối</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-purple-800 text-sm block">{Math.round(incomeFromOther).toLocaleString('vi-VN')} Tr</span>
                    <span className="text-[10px] font-semibold text-purple-600">
                      {totalHouseholdAnnualIncome ? Math.round((incomeFromOther / totalHouseholdAnnualIncome) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng kê danh sách từng hộ mẫu đã điều tra */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Danh Sách Hộ Mẫu Điều Tra Thu Nhập Đã Hoàn Thành</h3>
              <span className="text-xs text-slate-500">Căn cứ để tính tổng thu nhập và số nhân khẩu</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Mã TKCS</th>
                    <th className="py-2.5 px-3">Xã / ĐB</th>
                    <th className="py-2.5 px-4">Họ Và Tên Chủ Hộ</th>
                    <th className="py-2.5 px-3 text-center">Số NK (người)</th>
                    <th className="py-2.5 px-4">Nhóm Ngành Thu Nhập Chính</th>
                    <th className="py-2.5 px-3 text-right">Thu Nhập Hộ (Tr/năm)</th>
                    <th className="py-2.5 px-3 text-right">BQĐN (Tr/người/tháng)</th>
                    <th className="py-2.5 px-3">ĐTV</th>
                    <th className="py-2.5 px-3 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCompleted.map((s) => {
                    const members = s.memberCount || s.surveyData?.laborInfo.totalLabor || 4;
                    const householdYearly = (s.surveyData?.businessResults.netIncomeMonthly || 15) * 12;
                    const perCapitaMonthly = Math.round((householdYearly / members / 12) * 100) / 100;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{s.tkcsCode}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{s.communeCode} / {s.areaCode}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{s.householdName}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-800">{members}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (s.mainIncomeSourceCode || 4) === 1 ? 'bg-emerald-100 text-emerald-800' :
                            (s.mainIncomeSourceCode || 4) === 2 ? 'bg-blue-100 text-blue-800' :
                            (s.mainIncomeSourceCode || 4) === 3 ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {s.mainIncomeSourceName || s.industryName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{householdYearly}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">{perCapitaMonthly}</td>
                        <td className="py-2.5 px-3 text-slate-600">{s.assignedEnumeratorName || 'ĐTV'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onViewSurvey(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= BIỂU TỔNG HỢP CƠ SỞ CÁ THỂ 01/TKCS-CT ================= */
        <div className="space-y-6">
          {/* 4 Thẻ tổng hợp chỉ tiêu kinh tế */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tổng Doanh Thu Năm</span>
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{totalYearlyRevenue.toLocaleString('vi-VN')}</span>
                <span className="text-xs text-slate-500 font-medium">Triệu VNĐ</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Bình quân: <strong>{avgMonthlyRevenue} Triệu / tháng / cơ sở</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Lợi Nhuận Thuần Năm</span>
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{(totalNetIncome * 12).toLocaleString('vi-VN')}</span>
                <span className="text-xs text-slate-500 font-medium">Triệu VNĐ</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Bình quân: <strong>{avgNetIncome} Triệu / tháng / cơ sở</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tổng Số Lao Động</span>
                <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{totalLabor}</span>
                <span className="text-xs text-slate-500 font-medium">Người</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Lao động nữ: <strong>{femaleLabor} người ({totalLabor > 0 ? ((femaleLabor / totalLabor) * 100).toFixed(0) : 0}%)</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Thuế Nộp Ngân Sách</span>
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Briefcase className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{totalTaxPaid.toLocaleString('vi-VN')}</span>
                <span className="text-xs text-slate-500 font-medium">Triệu VNĐ</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Bình quân: <strong>{(totalTaxPaid / Math.max(1, count)).toFixed(1)} Triệu / cơ sở</strong>
              </div>
            </div>
          </div>

          {/* Phân tích cơ cấu chi phí */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Cơ Cấu Chi Phí Sản Xuất Kinh Doanh (Tháng)</h3>
              <p className="text-xs text-slate-500 mb-4">Tổng chi phí trung bình hàng tháng: {totalMonthlyExpense.toLocaleString('vi-VN')} Triệu VNĐ</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {expenseBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value.toLocaleString('vi-VN')} Triệu`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Chi Tiết Từng Khoản Mục Chi Phí</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">a. Chi mua nguyên, nhiên, vật liệu, hàng hóa:</span>
                  <span className="font-bold text-slate-900">{totalMaterials.toLocaleString('vi-VN')} Triệu</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">b. Chi trả tiền lương, tiền công người lao động:</span>
                  <span className="font-bold text-slate-900">{totalSalary.toLocaleString('vi-VN')} Triệu</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">c. Chi thuê nhà xưởng, máy móc, mặt bằng:</span>
                  <span className="font-bold text-slate-900">{totalRent.toLocaleString('vi-VN')} Triệu</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">d. Chi phí khấu hao tài sản cố định:</span>
                  <span className="font-bold text-slate-900">{totalDepreciation.toLocaleString('vi-VN')} Triệu</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">e. Chi dịch vụ mua ngoài (điện, nước, internet, cước):</span>
                  <span className="font-bold text-slate-900">{totalUtility.toLocaleString('vi-VN')} Triệu</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">f. Các chi phí khác:</span>
                  <span className="font-bold text-slate-900">{totalOther.toLocaleString('vi-VN')} Triệu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
