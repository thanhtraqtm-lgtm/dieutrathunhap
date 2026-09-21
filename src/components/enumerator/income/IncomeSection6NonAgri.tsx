import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { HouseholdIncomeSurveyData, NonAgriRow } from '../../../types/householdIncomeSurvey';

interface Props {
  section6: HouseholdIncomeSurveyData['section6'];
  onChange: (updated: HouseholdIncomeSurveyData['section6']) => void;
  readOnly?: boolean;
}

export const IncomeSection6NonAgri: React.FC<Props> = ({ section6, onChange, readOnly = false }) => {
  const recalculateTotal = (rows: NonAgriRow[]) => {
    const totalRow = {
      soldValue: rows.reduce((s, r) => s + (r.soldValue || 0), 0),
      selfUsedValue: rows.reduce((s, r) => s + (r.selfUsedValue || 0), 0),
      totalRevenue: rows.reduce((s, r) => s + (r.totalRevenue || 0), 0),
      materialsCost: rows.reduce((s, r) => s + (r.materialsCost || 0), 0),
      energyCost: rows.reduce((s, r) => s + (r.energyCost || 0), 0),
      otherCost: rows.reduce((s, r) => s + (r.otherCost || 0), 0),
      totalCost: rows.reduce((s, r) => s + (r.totalCost || 0), 0),
      netIncome: rows.reduce((s, r) => s + (r.netIncome || 0), 0),
    };

    return {
      rows,
      totalRow,
      q2TotalIncome: totalRow.netIncome,
    };
  };

  const handleToggleHasIncome = (val: 1 | 2) => {
    if (readOnly) return;
    if (val === 2) {
      const calc = recalculateTotal([]);
      onChange({
        ...section6,
        hasNonAgriIncome: 2,
        rows: [],
        totalRow: calc.totalRow,
        q2TotalIncome: 0,
      });
    } else {
      const defaultRows: NonAgriRow[] = section6.rows.length > 0 ? section6.rows : [
        {
          id: 'nonagri-' + Date.now(),
          stt: '1',
          activityDescription: 'Kinh doanh tạp hóa / Bán lẻ bánh kẹo nước giải khát',
          soldValue: 45000,
          selfUsedValue: 5000,
          totalRevenue: 50000,
          materialsCost: 35000,
          energyCost: 1500,
          otherCost: 1500,
          totalCost: 38000,
          netIncome: 12000,
        }
      ];
      const calc = recalculateTotal(defaultRows);
      onChange({
        ...section6,
        hasNonAgriIncome: 1,
        ...calc,
      });
    }
  };

  const handleRowChange = (index: number, field: keyof NonAgriRow, val: any) => {
    if (readOnly) return;
    const updated = [...section6.rows];
    const row = { ...updated[index] };

    if (field === 'activityDescription' || field === 'stt') {
      (row as any)[field] = val;
    } else {
      const num = Math.max(0, parseFloat(val) || 0);
      (row as any)[field] = num;

      // Cột 3 = 1 + 2
      const sold = field === 'soldValue' ? num : (row.soldValue || 0);
      const selfUsed = field === 'selfUsedValue' ? num : (row.selfUsedValue || 0);
      row.totalRevenue = sold + selfUsed;

      // Cột 7 = 4 + 5 + 6
      const mat = field === 'materialsCost' ? num : (row.materialsCost || 0);
      const eng = field === 'energyCost' ? num : (row.energyCost || 0);
      const oth = field === 'otherCost' ? num : (row.otherCost || 0);
      row.totalCost = mat + eng + oth;

      // Cột 8 = 3 - 7
      row.netIncome = row.totalRevenue - row.totalCost;
    }

    updated[index] = row;
    const calc = recalculateTotal(updated);
    onChange({
      ...section6,
      ...calc,
    });
  };

  const handleAddRow = () => {
    if (readOnly) return;
    const newRow: NonAgriRow = {
      id: 'nonagri-' + Date.now() + Math.random(),
      stt: String(section6.rows.length + 1),
      activityDescription: '',
      soldValue: 0,
      selfUsedValue: 0,
      totalRevenue: 0,
      materialsCost: 0,
      energyCost: 0,
      otherCost: 0,
      totalCost: 0,
      netIncome: 0,
    };
    const updated = [...section6.rows, newRow];
    const calc = recalculateTotal(updated);
    onChange({
      ...section6,
      ...calc,
    });
  };

  const handleRemoveRow = (index: number) => {
    if (readOnly) return;
    const updated = section6.rows.filter((_, i) => i !== index).map((r, i) => ({
      ...r,
      stt: String(i + 1),
    }));
    const calc = recalculateTotal(updated);
    onChange({
      ...section6,
      ...calc,
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-bold text-slate-900 uppercase">
          MỤC 6: THU NHẬP TỪ HOẠT ĐỘNG SẢN XUẤT KINH DOANH, DỊCH VỤ PHI NÔNG NGHIỆP HOẶC CHẾ BIẾN SẢN PHẨM NÔNG, LÂM NGHIỆP, THỦY SẢN
        </h3>
      </div>

      <div className="text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
        <p className="font-semibold text-slate-800 leading-relaxed">
          Câu 1. Trong 12 tháng qua, hộ ông/bà có tham gia hoạt động sản xuất kinh doanh, dịch vụ phi nông nghiệp hoặc chế biến sản phẩm nông, lâm nghiệp, thủy sản không?
        </p>
        <div className="mt-2.5 flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              name="hasNonAgriIncome"
              checked={section6.hasNonAgriIncome === 1}
              onChange={() => handleToggleHasIncome(1)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-blue-900 font-bold">1. Có (Tiếp tục phỏng vấn bảng dưới)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              name="hasNonAgriIncome"
              checked={section6.hasNonAgriIncome === 2}
              onChange={() => handleToggleHasIncome(2)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-slate-600">2. Không (Chuyển sang Mục 7)</span>
          </label>
        </div>
      </div>

      {section6.hasNonAgriIncome === 1 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
            {!readOnly && (
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm hoạt động SXKD/dịch vụ
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-400 rounded">
            <table className="w-full text-xs text-left border-collapse min-w-[950px]">
              <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-center border-b border-slate-300">
                <tr>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-10">STT</th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 min-w-[200px]">
                    Ngành nghề/hoạt động SXKD, dịch vụ hoặc chế biến SP NLTS
                  </th>
                  <th colSpan={3} className="p-2 border-r border-slate-300 bg-blue-50/70">
                    Tổng thu
                  </th>
                  <th colSpan={4} className="p-2 border-r border-slate-300 bg-amber-50/70">
                    Chi phí sản xuất
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-28 bg-emerald-50">
                    Thu nhập<br />(8 = 3 - 7)
                  </th>
                  {!readOnly && <th rowSpan={2} className="p-2 w-8">Xóa</th>}
                </tr>
                <tr className="border-t border-slate-300 text-[11px]">
                  {/* Tổng thu */}
                  <th className="p-1 border-r border-slate-300 w-24">
                    Đã bán/đổi/tặng<br />(1)
                  </th>
                  <th className="p-1 border-r border-slate-300 w-24">
                    Để lại sử dụng<br />(2)
                  </th>
                  <th className="p-1 border-r border-slate-300 w-28 bg-blue-100/50">
                    Tổng thu<br />(3 = 1 + 2)
                  </th>
                  {/* Chi phí */}
                  <th className="p-1 border-r border-slate-300 w-24">
                    Nguyên vật liệu<br />(4)
                  </th>
                  <th className="p-1 border-r border-slate-300 w-24">
                    Năng lượng/nhiên liệu<br />(5)
                  </th>
                  <th className="p-1 border-r border-slate-300 w-24">
                    Chi khác<br />(6)
                  </th>
                  <th className="p-1 border-r border-slate-300 w-28 bg-amber-100/50">
                    Tổng chi<br />(7 = 4+5+6)
                  </th>
                </tr>
                <tr className="bg-slate-200 text-slate-600 text-[11px]">
                  <th className="p-1 border-r border-slate-300">A</th>
                  <th className="p-1 border-r border-slate-300">B</th>
                  <th className="p-1 border-r border-slate-300">1</th>
                  <th className="p-1 border-r border-slate-300">2</th>
                  <th className="p-1 border-r border-slate-300">3</th>
                  <th className="p-1 border-r border-slate-300">4</th>
                  <th className="p-1 border-r border-slate-300">5</th>
                  <th className="p-1 border-r border-slate-300">6</th>
                  <th className="p-1 border-r border-slate-300">7</th>
                  <th className="p-1 border-r border-slate-300">8</th>
                  {!readOnly && <th className="p-1"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {section6.rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-blue-50/30">
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold">
                      {row.stt}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.activityDescription}
                        onChange={(e) => handleRowChange(idx, 'activityDescription', e.target.value)}
                        disabled={readOnly}
                        placeholder="Ghi rõ tên ngành hoạt động..."
                        className="w-full border border-slate-300 rounded p-1 font-medium text-slate-800"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.soldValue || ''}
                        onChange={(e) => handleRowChange(idx, 'soldValue', e.target.value)}
                        disabled={readOnly}
                        className="w-full text-right border border-slate-300 rounded p-1 font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.selfUsedValue || ''}
                        onChange={(e) => handleRowChange(idx, 'selfUsedValue', e.target.value)}
                        disabled={readOnly}
                        className="w-full text-right border border-slate-300 rounded p-1 font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-mono font-bold bg-blue-50/40 text-blue-900">
                      {row.totalRevenue.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.materialsCost || ''}
                        onChange={(e) => handleRowChange(idx, 'materialsCost', e.target.value)}
                        disabled={readOnly}
                        className="w-full text-right border border-slate-300 rounded p-1 font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.energyCost || ''}
                        onChange={(e) => handleRowChange(idx, 'energyCost', e.target.value)}
                        disabled={readOnly}
                        className="w-full text-right border border-slate-300 rounded p-1 font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.otherCost || ''}
                        onChange={(e) => handleRowChange(idx, 'otherCost', e.target.value)}
                        disabled={readOnly}
                        className="w-full text-right border border-slate-300 rounded p-1 font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-mono font-bold bg-amber-50/40 text-amber-900">
                      {row.totalCost.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-mono font-bold bg-emerald-50 text-emerald-900">
                      {row.netIncome.toLocaleString('vi-VN')}
                    </td>
                    {!readOnly && (
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Dòng TỔNG SỐ */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td colSpan={2} className="p-2 border-r border-slate-300 text-center uppercase">
                    TỔNG SỐ
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {section6.totalRow.soldValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {section6.totalRow.selfUsedValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900 bg-blue-100 font-extrabold">
                    {section6.totalRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {section6.totalRow.materialsCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {section6.totalRow.energyCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">
                    {section6.totalRow.otherCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900 bg-amber-100 font-extrabold">
                    {section6.totalRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-900 bg-emerald-100 font-extrabold">
                    {section6.totalRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-900">
              Câu 2. Tổng thu nhập từ SXKD, dịch vụ phi NLTS hoặc chế biến = Dòng tổng số cột (8)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-3 py-1 rounded border border-blue-300 shadow-inner">
                {section6.q2TotalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-slate-700">Nghìn đồng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
