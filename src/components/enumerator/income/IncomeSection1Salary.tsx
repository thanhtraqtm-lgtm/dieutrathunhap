import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { HouseholdIncomeSurveyData, SalaryMemberItem } from '../../../types/householdIncomeSurvey';

interface Props {
  section1: HouseholdIncomeSurveyData['section1'];
  onChange: (updated: HouseholdIncomeSurveyData['section1']) => void;
  readOnly?: boolean;
}

export const IncomeSection1Salary: React.FC<Props> = ({ section1, onChange, readOnly = false }) => {
  const handleToggleHasIncome = (val: 1 | 2) => {
    if (readOnly) return;
    const members = val === 1 && section1.members.length === 0 ? [
      {
        id: 'sal-' + Date.now(),
        memberCode: '1',
        fullName: '',
        mainJobDescription: '',
        salaryAndWages: 0,
        pensionAndAllowances: 0
      }
    ] : section1.members;

    const totalSalaryCol1 = val === 1 ? members.reduce((s, m) => s + (Number(m.salaryAndWages) || 0), 0) : 0;
    const totalPensionCol2 = val === 1 ? members.reduce((s, m) => s + (Number(m.pensionAndAllowances) || 0), 0) : 0;

    onChange({
      ...section1,
      hasSalaryIncome: val,
      members: val === 1 ? members : [],
      totalSalaryCol1,
      totalPensionCol2,
      q2TotalIncome: totalSalaryCol1 + totalPensionCol2
    });
  };

  const handleMemberChange = (index: number, field: keyof SalaryMemberItem, value: any) => {
    if (readOnly) return;
    const updatedMembers = [...section1.members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };

    const totalSalaryCol1 = updatedMembers.reduce((s, m) => s + (Number(m.salaryAndWages) || 0), 0);
    const totalPensionCol2 = updatedMembers.reduce((s, m) => s + (Number(m.pensionAndAllowances) || 0), 0);

    onChange({
      ...section1,
      members: updatedMembers,
      totalSalaryCol1,
      totalPensionCol2,
      q2TotalIncome: totalSalaryCol1 + totalPensionCol2
    });
  };

  const handleAddMember = () => {
    if (readOnly) return;
    const nextCode = (section1.members.length + 1).toString();
    const updatedMembers = [
      ...section1.members,
      {
        id: 'sal-' + Date.now(),
        memberCode: nextCode,
        fullName: '',
        mainJobDescription: '',
        salaryAndWages: 0,
        pensionAndAllowances: 0
      }
    ];
    onChange({
      ...section1,
      members: updatedMembers
    });
  };

  const handleRemoveMember = (index: number) => {
    if (readOnly) return;
    const updatedMembers = section1.members.filter((_, i) => i !== index);
    const totalSalaryCol1 = updatedMembers.reduce((s, m) => s + (Number(m.salaryAndWages) || 0), 0);
    const totalPensionCol2 = updatedMembers.reduce((s, m) => s + (Number(m.pensionAndAllowances) || 0), 0);

    onChange({
      ...section1,
      members: updatedMembers,
      totalSalaryCol1,
      totalPensionCol2,
      q2TotalIncome: totalSalaryCol1 + totalPensionCol2
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
      {/* Tiêu đề mục */}
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-bold text-slate-900 uppercase">
          MỤC 1: THU NHẬP TỪ TIỀN LƯƠNG, TIỀN CÔNG
        </h3>
      </div>

      {/* Câu hỏi sàng lọc 1 */}
      <div className="text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
        <p className="font-semibold text-slate-800 leading-relaxed">
          Câu 1. Trong 12 tháng qua có ai trong hộ ông/bà đi làm để nhận tiền lương, tiền công và/hoặc nhận được lương hưu, trợ cấp thất nghiệp, thôi việc một lần không?{' '}
          <span className="font-normal italic text-slate-600">(Chỉ hỏi đối với người từ 6 tuổi trở lên)</span>
        </p>

        <div className="flex flex-wrap items-center gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasSalaryIncome"
              checked={section1.hasSalaryIncome === 1}
              onChange={() => handleToggleHasIncome(1)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>1. Có <span className="text-xs text-blue-700 font-normal">[Mã 1: Hỏi thông tin thu nhập từ tiền lương, tiền công]</span></span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasSalaryIncome"
              checked={section1.hasSalaryIncome === 2}
              onChange={() => handleToggleHasIncome(2)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>2. Không <span className="text-xs text-slate-500 font-normal">[Mã 2: Chuyển qua mục 2 (Thu nhập từ trồng trọt)]</span></span>
          </label>
        </div>
      </div>

      {/* Bảng kê chi tiết nếu chọn 1. Có */}
      {section1.hasSalaryIncome === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
            {!readOnly && (
              <button
                type="button"
                onClick={handleAddMember}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold border border-blue-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm thành viên có thu nhập
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-center border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-16">Mã thành viên</th>
                  <th className="p-2 border-r border-slate-300 w-44">Họ tên</th>
                  <th className="p-2 border-r border-slate-300">Mô tả công việc chính</th>
                  <th className="p-2 border-r border-slate-300 w-48">
                    Thu nhập từ tiền lương, tiền công và các khoản có tính chất tiền lương, tiền công <span className="normal-case font-normal text-[11px] block text-slate-600">(tính cả tiền mặt và hiện vật quy đổi)</span>
                  </th>
                  <th className="p-2 border-r border-slate-300 w-44">
                    Lương hưu và trợ cấp thất nghiệp, thôi việc một lần
                  </th>
                  {!readOnly && <th className="p-2 w-10"></th>}
                </tr>
                <tr className="bg-slate-200 text-slate-600 text-[11px]">
                  <th className="p-1 border-r border-slate-300">A</th>
                  <th className="p-1 border-r border-slate-300">B</th>
                  <th className="p-1 border-r border-slate-300">C</th>
                  <th className="p-1 border-r border-slate-300">1</th>
                  <th className="p-1 border-r border-slate-300">2</th>
                  {!readOnly && <th className="p-1"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {section1.members.map((member, index) => (
                  <tr key={member.id || index} className="hover:bg-blue-50/40">
                    <td className="p-1.5 border-r border-slate-200 text-center">
                      <input
                        type="text"
                        value={member.memberCode}
                        onChange={(e) => handleMemberChange(index, 'memberCode', e.target.value)}
                        disabled={readOnly}
                        className="w-12 text-center border border-slate-300 rounded p-1 bg-white font-medium"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={member.fullName}
                        onChange={(e) => handleMemberChange(index, 'fullName', e.target.value)}
                        disabled={readOnly}
                        placeholder="Họ tên thành viên..."
                        className="w-full border border-slate-300 rounded p-1 bg-white font-medium"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={member.mainJobDescription}
                        onChange={(e) => handleMemberChange(index, 'mainJobDescription', e.target.value)}
                        disabled={readOnly}
                        placeholder="Ví dụ: Công nhân, giáo viên, thợ mộc..."
                        className="w-full border border-slate-300 rounded p-1 bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right">
                      <input
                        type="number"
                        min={0}
                        value={member.salaryAndWages || ''}
                        onChange={(e) => handleMemberChange(index, 'salaryAndWages', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-semibold text-slate-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right">
                      <input
                        type="number"
                        min={0}
                        value={member.pensionAndAllowances || ''}
                        onChange={(e) => handleMemberChange(index, 'pensionAndAllowances', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-semibold text-slate-900"
                      />
                    </td>
                    {!readOnly && (
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Dòng TỔNG SỐ */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={3} className="p-2 border-r border-slate-300 text-center uppercase">
                    TỔNG SỐ
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right text-blue-800 font-mono text-sm">
                    {section1.totalSalaryCol1.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right text-blue-800 font-mono text-sm">
                    {section1.totalPensionCol2.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Câu 2. Tổng thu nhập Mục 1 */}
          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-900">
              Câu 2. Tổng thu nhập = Dòng tổng số (cột 1 + cột 2)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-3 py-1 rounded border border-blue-300 shadow-inner">
                {section1.q2TotalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-slate-700">Nghìn đồng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
