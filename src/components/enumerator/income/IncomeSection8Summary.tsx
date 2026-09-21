import React from 'react';
import { HouseholdIncomeSurveyData } from '../../../types/householdIncomeSurvey';

interface Props {
  data: HouseholdIncomeSurveyData;
  onChange: (updated: HouseholdIncomeSurveyData) => void;
  readOnly?: boolean;
}

export const IncomeSection8Summary: React.FC<Props> = ({ data, onChange, readOnly = false }) => {
  const m1 = data.section1.hasSalaryIncome === 1 ? (data.section1.q2TotalIncome || 0) : 0;
  const m2 = data.section2.hasCropsIncome === 1 ? (data.section2.q2TotalIncome || 0) : 0;
  const m3 = data.section3.hasLivestockIncome === 1 ? (data.section3.q2TotalIncome || 0) : 0;
  const m4 = data.section4.hasForestryIncome === 1 ? (data.section4.q2TotalIncome || 0) : 0;
  const m5 = data.section5.hasFisheryIncome === 1 ? (data.section5.q2TotalIncome || 0) : 0;
  const m6 = data.section6.hasNonAgriIncome === 1 ? (data.section6.q2TotalIncome || 0) : 0;
  const m7 = data.section7.q2TotalIncome || 0;

  const totalHouseholdIncome = m1 + m2 + m3 + m4 + m5 + m6 + m7;
  const persons = Math.max(1, data.general.totalMembers || 1);
  const perCapitaYearlyIncome = Math.round(totalHouseholdIncome / persons);
  const perCapitaMonthlyIncome = Math.round((totalHouseholdIncome / (persons * 12)) * 10) / 10;

  const handleDateOrNameChange = (field: 'locationDate' | 'surveyorName', val: string) => {
    if (readOnly) return;
    onChange({
      ...data,
      summary: {
        ...data.summary,
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
        [field]: val,
      }
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-6">
      <div className="border-b border-slate-200 pb-2 text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phụ lục II</p>
        <h3 className="text-base font-bold text-slate-900 uppercase mt-0.5">
          BIỂU TỔNG HỢP THU NHẬP CỦA HỘ NĂM {data.general.year || '2026'}
        </h3>
      </div>

      {/* Bảng tổng hợp thu nhập 12 tháng qua */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 uppercase">
            BẢNG TỔNG HỢP THU NHẬP TỪ CÁC NGUỒN CỦA HỘ
          </span>
          <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
        </div>

        <div className="overflow-x-auto border border-slate-400 rounded">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-center border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300 w-16">STT</th>
                <th className="p-2 border-r border-slate-300">Nguồn thu nhập</th>
                <th className="p-2 border-r border-slate-300 w-44">Tình trạng phát sinh</th>
                <th className="p-2 border-r border-slate-300 w-52 text-right">Thu nhập (1.000 đồng)</th>
              </tr>
              <tr className="bg-slate-200 text-slate-600 text-[11px]">
                <th className="p-1 border-r border-slate-300">A</th>
                <th className="p-1 border-r border-slate-300">B</th>
                <th className="p-1 border-r border-slate-300">C</th>
                <th className="p-1 border-r border-slate-300">1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">1</td>
                <td className="p-2 border-r border-slate-200 font-medium">1. Thu nhập từ tiền lương, tiền công (Mục 1)</td>
                <td className="p-2 border-r border-slate-200 text-center">
                  {data.section1.hasSalaryIncome === 1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Có phát sinh</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Không</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {m1.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">2</td>
                <td className="p-2 border-r border-slate-200 font-medium">2. Thu nhập từ trồng trọt (Mục 2)</td>
                <td className="p-2 border-r border-slate-200 text-center">
                  {data.section2.hasCropsIncome === 1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Có phát sinh</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Không</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {m2.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">3</td>
                <td className="p-2 border-r border-slate-200 font-medium">3. Thu nhập từ chăn nuôi (Mục 3)</td>
                <td className="p-2 border-r border-slate-200 text-center">
                  {data.section3.hasLivestockIncome === 1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Có phát sinh</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Không</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {m3.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">4</td>
                <td className="p-2 border-r border-slate-200 font-medium">4. Thu nhập từ lâm nghiệp (Mục 4)</td>
                <td className="p-2 border-r border-slate-200 text-center">
                  {data.section4.hasForestryIncome === 1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Có phát sinh</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Không</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {m4.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">5</td>
                <td className="p-2 border-r border-slate-200 font-medium">5. Thu nhập từ thủy sản (Mục 5)</td>
                <td className="p-2 border-r border-slate-200 text-center">
                  {data.section5.hasFisheryIncome === 1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Có phát sinh</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Không</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {m5.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">6</td>
                <td className="p-2 border-r border-slate-200 font-medium">6. Thu nhập từ SXKD, dịch vụ phi NLTS hoặc chế biến (Mục 6)</td>
                <td className="p-2 border-r border-slate-200 text-center">
                  {data.section6.hasNonAgriIncome === 1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Có phát sinh</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Không</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {m6.toLocaleString('vi-VN')}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">7</td>
                <td className="p-2 border-r border-slate-200 font-medium">7. Thu nhập khác (Mục 7)</td>
                <td className="p-2 border-r border-slate-200 text-center">
                  {m7 > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Có phát sinh</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Không</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {m7.toLocaleString('vi-VN')}
                </td>
              </tr>

              {/* Dòng TỔNG THU NHẬP */}
              <tr className="bg-blue-50 font-bold text-blue-950 border-t-2 border-blue-300 text-sm">
                <td className="p-2 border-r border-blue-200 text-center font-mono font-extrabold text-blue-800">TỔNG</td>
                <td colSpan={2} className="p-2 border-r border-blue-200 uppercase">
                  TỔNG THU NHẬP CỦA HỘ TRONG 12 THÁNG QUA (= 1 + 2 + 3 + 4 + 5 + 6 + 7)
                </td>
                <td className="p-2 border-r border-blue-200 text-right font-mono text-base text-blue-900 font-extrabold bg-blue-100/70">
                  {totalHouseholdIncome.toLocaleString('vi-VN')}
                </td>
              </tr>

              {/* Dòng BÌNH QUÂN ĐẦU NGƯỜI NĂM */}
              <tr className="bg-emerald-50/50 text-emerald-950 border-t border-emerald-200 text-xs">
                <td className="p-2 border-r border-emerald-200 text-center font-mono font-semibold">BQ/năm</td>
                <td colSpan={2} className="p-2 border-r border-emerald-200 font-medium">
                  Thu nhập bình quân 1 người/năm (= Tổng thu nhập / {persons} nhân khẩu)
                </td>
                <td className="p-2 border-r border-emerald-200 text-right font-mono text-sm text-emerald-900 font-bold bg-emerald-50">
                  {perCapitaYearlyIncome.toLocaleString('vi-VN')}
                </td>
              </tr>

              {/* Dòng BÌNH QUÂN ĐẦU NGƯỜI THÁNG */}
              <tr className="bg-emerald-50 font-bold text-emerald-950 border-t border-emerald-300 text-sm">
                <td className="p-2 border-r border-emerald-200 text-center font-mono font-extrabold text-emerald-800">BQ/tháng</td>
                <td colSpan={2} className="p-2 border-r border-emerald-200">
                  THU NHẬP BÌNH QUÂN 1 NGƯỜI 1 THÁNG CỦA HỘ{' '}
                  <span className="text-xs font-normal text-emerald-800 block">
                    (= Tổng thu nhập / ({persons} nhân khẩu × 12 tháng))
                  </span>
                </td>
                <td className="p-2 border-r border-emerald-200 text-right font-mono text-base text-emerald-900 font-extrabold bg-emerald-100/70">
                  {perCapitaMonthlyIncome.toLocaleString('vi-VN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Địa điểm ngày tháng và chữ ký ĐTV */}
      <div className="border border-slate-300 rounded-lg p-5 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Ghi chú kiểm tra logic:</p>
            <p>• Nhân khẩu tính thu nhập: <strong>{persons} người</strong> (tổng thành viên hộ)</p>
            <p>• Thu nhập BQ 1 người/tháng: <strong>{perCapitaMonthlyIncome.toLocaleString('vi-VN')} nghìn đồng/tháng</strong></p>
          </div>

          <div className="w-full sm:w-auto text-center space-y-2">
            <div>
              <input
                type="text"
                value={data.summary.locationDate || `${data.general.communeName || 'Địa phương'}, ngày 18 tháng 9 năm 2026`}
                onChange={(e) => handleDateOrNameChange('locationDate', e.target.value)}
                disabled={readOnly}
                className="text-xs italic text-slate-700 text-center border-b border-slate-300 focus:outline-none bg-transparent w-72"
              />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-slate-800 block">ĐIỀU TRA VIÊN</span>
              <span className="text-[11px] italic text-slate-500 block">(Ký và ghi rõ họ tên)</span>
            </div>
            <div className="pt-8">
              <input
                type="text"
                value={data.summary.surveyorName || ''}
                onChange={(e) => handleDateOrNameChange('surveyorName', e.target.value)}
                disabled={readOnly}
                placeholder="Họ tên điều tra viên..."
                className="text-xs font-bold text-slate-900 text-center border-b border-slate-400 focus:outline-none bg-transparent w-56 py-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
