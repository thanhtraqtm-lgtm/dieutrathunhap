import React from 'react';
import { HouseholdIncomeSurveyData } from '../../../types/householdIncomeSurvey';

interface Props {
  section7: HouseholdIncomeSurveyData['section7'];
  onChange: (updated: HouseholdIncomeSurveyData['section7']) => void;
  readOnly?: boolean;
}

export const IncomeSection7Other: React.FC<Props> = ({ section7, onChange, readOnly = false }) => {
  const handleFieldChange = (field: keyof HouseholdIncomeSurveyData['section7'], value: string) => {
    if (readOnly) return;
    const num = Math.max(0, parseFloat(value) || 0);
    const updated = { ...section7, [field]: num };

    // 1. Tổng hỗ trợ = 1.1 + 1.2 + 1.3
    const row1_1 = field === 'row1_1' ? num : (section7.row1_1 || 0);
    const row1_2 = field === 'row1_2' ? num : (section7.row1_2 || 0);
    const row1_3 = field === 'row1_3' ? num : (section7.row1_3 || 0);
    updated.row1_Total = row1_1 + row1_2 + row1_3;

    // 2. Tổng sở hữu tài sản = 2.1 + 2.2
    const row2_1 = field === 'row2_1' ? num : (section7.row2_1 || 0);
    const row2_2 = field === 'row2_2' ? num : (section7.row2_2 || 0);
    updated.row2_Total = row2_1 + row2_2;

    // 3. Thu khác
    const row3 = field === 'row3' ? num : (section7.row3 || 0);

    // TỔNG SỐ = 1 + 2 + 3
    updated.totalIncome = updated.row1_Total + updated.row2_Total + row3;
    updated.q2TotalIncome = updated.totalIncome;

    onChange(updated);
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-bold text-slate-900 uppercase">
          MỤC 7: THU NHẬP KHÁC CỦA HỘ
        </h3>
      </div>

      <div className="text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
        <p className="font-semibold text-slate-800 leading-relaxed">
          Câu 1. Trong 12 tháng qua hộ ông/bà có nhận được các khoản thu nhập khác dưới đây không?
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
        </div>

        <div className="overflow-x-auto border border-slate-400 rounded">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-center border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300 w-16">STT</th>
                <th className="p-2 border-r border-slate-300">Khoản thu nhập khác</th>
                <th className="p-2 border-r border-slate-300 w-52 text-right">
                  Số tiền nhận được (1.000 đồng)<br />
                  <span className="text-[11px] normal-case font-normal text-slate-600">(1)</span>
                </th>
              </tr>
              <tr className="bg-slate-200 text-slate-600 text-[11px]">
                <th className="p-1 border-r border-slate-300">A</th>
                <th className="p-1 border-r border-slate-300">B</th>
                <th className="p-1 border-r border-slate-300">1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Nhóm 1 */}
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td className="p-2 border-r border-slate-200 text-center font-mono">1</td>
                <td className="p-2 border-r border-slate-200">
                  Thu nhập từ các nguồn hỗ trợ bên ngoài hộ (= 1.1 + 1.2 + 1.3)
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold bg-blue-50 text-blue-900">
                  {section7.row1_Total.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 pl-4">1.1</td>
                <td className="p-2 border-r border-slate-200 text-slate-800 pl-6">
                  Tiền và trị giá hiện vật người ngoài hộ cho, biếu, tặng, mừng, giúp (dùng cho sinh hoạt của hộ)
                </td>
                <td className="p-2 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    value={section7.row1_1 || ''}
                    onChange={(e) => handleFieldChange('row1_1', e.target.value)}
                    disabled={readOnly}
                    placeholder="0"
                    className="w-full text-right border border-slate-300 rounded p-1 font-mono font-medium"
                  />
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 pl-4">1.2</td>
                <td className="p-2 border-r border-slate-200 text-slate-800 pl-6">
                  Các khoản trợ cấp xã hội, trợ cấp thiên tai, dịch bệnh...
                </td>
                <td className="p-2 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    value={section7.row1_2 || ''}
                    onChange={(e) => handleFieldChange('row1_2', e.target.value)}
                    disabled={readOnly}
                    placeholder="0"
                    className="w-full text-right border border-slate-300 rounded p-1 font-mono font-medium"
                  />
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 pl-4">1.3</td>
                <td className="p-2 border-r border-slate-200 text-slate-800 pl-6">
                  Học bổng, thưởng giáo dục, trợ giúp y tế
                </td>
                <td className="p-2 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    value={section7.row1_3 || ''}
                    onChange={(e) => handleFieldChange('row1_3', e.target.value)}
                    disabled={readOnly}
                    placeholder="0"
                    className="w-full text-right border border-slate-300 rounded p-1 font-mono font-medium"
                  />
                </td>
              </tr>

              {/* Nhóm 2 */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                <td className="p-2 border-r border-slate-200 text-center font-mono">2</td>
                <td className="p-2 border-r border-slate-200">
                  Thu nhập từ sở hữu tài sản, đầu tư tài chính (= 2.1 + 2.2)
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold bg-blue-50 text-blue-900">
                  {section7.row2_Total.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 pl-4">2.1</td>
                <td className="p-2 border-r border-slate-200 text-slate-800 pl-6">
                  Thu từ cho thuê tài sản, đất đai, nhà ở
                </td>
                <td className="p-2 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    value={section7.row2_1 || ''}
                    onChange={(e) => handleFieldChange('row2_1', e.target.value)}
                    disabled={readOnly}
                    placeholder="0"
                    className="w-full text-right border border-slate-300 rounded p-1 font-mono font-medium"
                  />
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 pl-4">2.2</td>
                <td className="p-2 border-r border-slate-200 text-slate-800 pl-6">
                  Thu từ lãi đầu tư, tín dụng (lãi tiết kiệm, cổ phiếu, cho vay, góp vốn...)
                </td>
                <td className="p-2 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    value={section7.row2_2 || ''}
                    onChange={(e) => handleFieldChange('row2_2', e.target.value)}
                    disabled={readOnly}
                    placeholder="0"
                    className="w-full text-right border border-slate-300 rounded p-1 font-mono font-medium"
                  />
                </td>
              </tr>

              {/* Nhóm 3 */}
              <tr className="hover:bg-blue-50/20 border-t border-slate-300">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">3</td>
                <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                  Thu nhập khác (trúng xổ số, vui chơi có thưởng, tiền đền bù khác...)
                </td>
                <td className="p-2 border-r border-slate-200">
                  <input
                    type="number"
                    min={0}
                    value={section7.row3 || ''}
                    onChange={(e) => handleFieldChange('row3', e.target.value)}
                    disabled={readOnly}
                    placeholder="0"
                    className="w-full text-right border border-slate-300 rounded p-1 font-mono font-medium"
                  />
                </td>
              </tr>

              {/* Dòng TỔNG SỐ */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 text-sm">
                <td colSpan={2} className="p-2 border-r border-slate-300 text-center uppercase">
                  TỔNG SỐ (Dòng 1 + Dòng 2 + Dòng 3)
                </td>
                <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-900 bg-emerald-100 font-extrabold text-base">
                  {section7.totalIncome.toLocaleString('vi-VN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Câu 2. Tổng thu khác */}
        <div className="bg-blue-50/70 border border-blue-200 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-bold text-slate-900">
            Câu 2. Tổng thu khác = Dòng tổng số cột (1)
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-3 py-1 rounded border border-blue-300 shadow-inner">
              {section7.q2TotalIncome.toLocaleString('vi-VN')}
            </span>
            <span className="font-bold text-slate-700">Nghìn đồng</span>
          </div>
        </div>
      </div>
    </div>
  );
};
