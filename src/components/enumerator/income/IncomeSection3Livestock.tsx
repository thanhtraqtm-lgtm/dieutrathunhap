import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { HouseholdIncomeSurveyData, ProductionIncomeRow } from '../../../types/householdIncomeSurvey';
import { LIVESTOCK_CATALOG } from '../../../data/incomeCatalog';

interface Props {
  section3: HouseholdIncomeSurveyData['section3'];
  onChange: (updated: HouseholdIncomeSurveyData['section3']) => void;
  readOnly?: boolean;
}

export const IncomeSection3Livestock: React.FC<Props> = ({ section3, onChange, readOnly = false }) => {
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  const recalculateTotal = (
    liveRows: ProductionIncomeRow[],
    breedingRow: ProductionIncomeRow,
    byProductRow: ProductionIncomeRow,
    servicesRow: ProductionIncomeRow,
    huntingRow: ProductionIncomeRow,
    compRow: ProductionIncomeRow
  ) => {
    const all = [...liveRows, breedingRow, byProductRow, servicesRow, huntingRow, compRow];
    const totalRow = {
      soldValue: all.reduce((s, r) => s + (r.soldValue || 0), 0),
      selfUsedValue: all.reduce((s, r) => s + (r.selfUsedValue || 0), 0),
      totalRevenue: all.reduce((s, r) => s + (r.totalRevenue || 0), 0),
      seedCost: all.reduce((s, r) => s + (r.seedCost || 0), 0),
      feedCost: all.reduce((s, r) => s + (r.fertilizerOrFeedCost || 0), 0),
      otherCost: all.reduce((s, r) => s + (r.otherCost || 0), 0),
      totalCost: all.reduce((s, r) => s + (r.totalCost || 0), 0),
      netIncome: all.reduce((s, r) => s + (r.netIncome || 0), 0),
    };

    return {
      totalRow,
      q2TotalIncome: totalRow.netIncome
    };
  };

  const handleToggleHasIncome = (val: 1 | 2) => {
    if (readOnly) return;
    if (val === 2) {
      const calc = recalculateTotal([], section3.breedingRow, section3.byProductsRow, section3.servicesRow, section3.huntingRow, section3.compensationRow);
      onChange({
        ...section3,
        hasLivestockIncome: 2,
        livestockRows: [],
        totalRow: { ...calc.totalRow, netIncome: 0 },
        q2TotalIncome: 0
      });
    } else {
      const defaultRows: ProductionIncomeRow[] = section3.livestockRows.length > 0 ? section3.livestockRows : [
        {
          id: 'live-' + Date.now(),
          stt: '1.1',
          name: 'Thịt lợn hơi',
          soldValue: 0,
          selfUsedValue: 0,
          totalRevenue: 0,
          seedCost: 0,
          fertilizerOrFeedCost: 0,
          otherCost: 0,
          totalCost: 0,
          netIncome: 0,
        }
      ];
      const calc = recalculateTotal(defaultRows, section3.breedingRow, section3.byProductsRow, section3.servicesRow, section3.huntingRow, section3.compensationRow);
      onChange({
        ...section3,
        hasLivestockIncome: 1,
        livestockRows: defaultRows,
        ...calc
      });
    }
  };

  const handleLiveRowChange = (index: number, field: keyof ProductionIncomeRow, val: any) => {
    if (readOnly) return;
    const updated = [...section3.livestockRows];
    const row = { ...updated[index], [field]: val };

    const sold = Number(row.soldValue) || 0;
    const selfUsed = Number(row.selfUsedValue) || 0;
    row.totalRevenue = sold + selfUsed;

    const seed = Number(row.seedCost) || 0;
    const feed = Number(row.fertilizerOrFeedCost) || 0;
    const other = Number(row.otherCost) || 0;
    row.totalCost = seed + feed + other;

    row.netIncome = row.totalRevenue - row.totalCost;
    updated[index] = row;

    const calc = recalculateTotal(
      updated,
      section3.breedingRow,
      section3.byProductsRow,
      section3.servicesRow,
      section3.huntingRow,
      section3.compensationRow
    );

    onChange({
      ...section3,
      livestockRows: updated,
      ...calc
    });
  };

  const handleFixedRowChange = (
    rowKey: 'breedingRow' | 'byProductsRow' | 'servicesRow' | 'huntingRow' | 'compensationRow',
    field: keyof ProductionIncomeRow,
    val: any
  ) => {
    if (readOnly) return;
    const row = { ...section3[rowKey], [field]: val };

    if (rowKey === 'compensationRow') {
      row.netIncome = Number(val) || 0;
    } else {
      const sold = Number(row.soldValue) || 0;
      const selfUsed = Number(row.selfUsedValue) || 0;
      row.totalRevenue = sold + selfUsed;

      const seed = Number(row.seedCost) || 0;
      const feed = Number(row.fertilizerOrFeedCost) || 0;
      const other = Number(row.otherCost) || 0;
      row.totalCost = seed + feed + other;

      row.netIncome = row.totalRevenue - row.totalCost;
    }

    const nextState = {
      ...section3,
      [rowKey]: row
    };

    const calc = recalculateTotal(
      nextState.livestockRows,
      nextState.breedingRow,
      nextState.byProductsRow,
      nextState.servicesRow,
      nextState.huntingRow,
      nextState.compensationRow
    );

    onChange({
      ...nextState,
      ...calc
    });
  };

  const handleAddLiveRow = (catalogItem?: { name: string; category: string }) => {
    if (readOnly) return;
    const nextStt = `1.${section3.livestockRows.length + 1}`;
    const newRow: ProductionIncomeRow = {
      id: 'live-' + Date.now() + Math.random(),
      stt: nextStt,
      name: catalogItem ? catalogItem.name : '',
      soldValue: 0,
      selfUsedValue: 0,
      totalRevenue: 0,
      seedCost: 0,
      fertilizerOrFeedCost: 0,
      otherCost: 0,
      totalCost: 0,
      netIncome: 0,
    };

    const updated = [...section3.livestockRows, newRow];
    const calc = recalculateTotal(
      updated,
      section3.breedingRow,
      section3.byProductsRow,
      section3.servicesRow,
      section3.huntingRow,
      section3.compensationRow
    );

    onChange({
      ...section3,
      livestockRows: updated,
      ...calc
    });
  };

  const handleRemoveLiveRow = (index: number) => {
    if (readOnly) return;
    const updated = section3.livestockRows.filter((_, i) => i !== index);
    const calc = recalculateTotal(
      updated,
      section3.breedingRow,
      section3.byProductsRow,
      section3.servicesRow,
      section3.huntingRow,
      section3.compensationRow
    );
    onChange({
      ...section3,
      livestockRows: updated,
      ...calc
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-bold text-slate-900 uppercase">
          MỤC 3: THU NHẬP TỪ CHĂN NUÔI
        </h3>
      </div>

      {/* Câu hỏi sàng lọc 1 */}
      <div className="text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
        <p className="font-semibold text-slate-800 leading-relaxed">
          Câu 1. Trong 12 tháng qua hộ ông/bà có phát sinh thu nhập - chi phí từ hoạt động chăn nuôi hoặc từ săn bắt, đánh bẫy, thuần dưỡng chim, thú không,...?
        </p>

        <div className="flex flex-wrap items-center gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasLivestockIncome"
              checked={section3.hasLivestockIncome === 1}
              onChange={() => handleToggleHasIncome(1)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>1. Có <span className="text-xs text-blue-700 font-normal">[Mã 1: Hỏi thông tin thu nhập - chi phí từ chăn nuôi]</span></span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasLivestockIncome"
              checked={section3.hasLivestockIncome === 2}
              onChange={() => handleToggleHasIncome(2)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>2. Không <span className="text-xs text-slate-500 font-normal">[Mã 2: Chuyển qua mục 4 (Thu nhập từ lâm nghiệp)]</span></span>
          </label>
        </div>
      </div>

      {section3.hasLivestockIncome === 1 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(!showCatalogModal)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded font-semibold border border-amber-300 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Tra danh mục chăn nuôi (26 loại)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLiveRow()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm vật nuôi / sản phẩm
                </button>
              </div>
            )}
          </div>

          {/* Hộp thoại gợi ý tra cứu danh mục chăn nuôi */}
          {showCatalogModal && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
              <div className="flex justify-between items-center mb-2 font-bold text-amber-900">
                <span>Danh mục nguồn thu từ hoạt động chăn nuôi (Trang 26): Bấm chọn để thêm vào bảng</span>
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="text-slate-500 hover:text-slate-800 font-bold"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white border border-amber-100 rounded">
                {LIVESTOCK_CATALOG.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      handleAddLiveRow(item);
                      setShowCatalogModal(false);
                    }}
                    className="text-left px-2 py-1 rounded hover:bg-amber-100 text-slate-800 truncate"
                    title={`${item.code}. ${item.name} (${item.category})`}
                  >
                    <span className="font-mono text-amber-800 font-bold mr-1">{item.code}.</span>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kê Mục 3 Chuẩn Trang 26-27 */}
          <div className="overflow-x-auto border border-slate-400 rounded">
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-center border-b border-slate-300">
                <tr>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-12">STT</th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 min-w-[180px]">Sản phẩm/dịch vụ</th>
                  <th colSpan={3} className="p-1.5 border-r border-slate-300 bg-blue-50/50">Tổng thu</th>
                  <th colSpan={4} className="p-1.5 border-r border-slate-300 bg-amber-50/50">Chi phí</th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 bg-emerald-50/80 w-24">
                    Thu nhập<br />(8 = 3 - 7)
                  </th>
                  {!readOnly && <th rowSpan={2} className="p-2 w-8"></th>}
                </tr>
                <tr>
                  <th className="p-1.5 border-r border-slate-300 font-normal normal-case text-[11px] w-24 bg-blue-50/30">
                    Giá trị đã bán/đổi/cho/biếu/tặng
                  </th>
                  <th className="p-1.5 border-r border-slate-300 font-normal normal-case text-[11px] w-28 bg-blue-50/30">
                    Giá trị thu hoạch để lại sử dụng
                  </th>
                  <th className="p-1.5 border-r border-slate-300 font-bold normal-case text-[11px] w-24 bg-blue-100/50">
                    Tổng trị giá (3 = 1 + 2)
                  </th>
                  <th className="p-1.5 border-r border-slate-300 font-normal normal-case text-[11px] w-20 bg-amber-50/30">
                    Giống (cả tự sản xuất)
                  </th>
                  <th className="p-1.5 border-r border-slate-300 font-normal normal-case text-[11px] w-24 bg-amber-50/30">
                    Thức ăn, thuốc phòng và chữa bệnh
                  </th>
                  <th className="p-1.5 border-r border-slate-300 font-normal normal-case text-[11px] w-20 bg-amber-50/30">
                    Chi khác
                  </th>
                  <th className="p-1.5 border-r border-slate-300 font-bold normal-case text-[11px] w-24 bg-amber-100/50">
                    Tổng chi phí (7 = 4 + 5 + 6)
                  </th>
                </tr>
                <tr className="bg-slate-200 text-slate-600 text-[11px]">
                  <th className="p-1 border-r border-slate-300">A</th>
                  <th className="p-1 border-r border-slate-300">B</th>
                  <th className="p-1 border-r border-slate-300">1</th>
                  <th className="p-1 border-r border-slate-300">2</th>
                  <th className="p-1 border-r border-slate-300 font-bold">3</th>
                  <th className="p-1 border-r border-slate-300">4</th>
                  <th className="p-1 border-r border-slate-300">5</th>
                  <th className="p-1 border-r border-slate-300">6</th>
                  <th className="p-1 border-r border-slate-300 font-bold">7</th>
                  <th className="p-1 border-r border-slate-300 font-bold text-emerald-800">8</th>
                  {!readOnly && <th className="p-1"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Dòng tiêu đề chăn nuôi */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="p-1.5 border-r border-slate-200 text-center">1-4</td>
                  <td colSpan={!readOnly ? 10 : 9} className="p-1.5 border-r border-slate-200 uppercase">
                    Gia súc, gia cầm, chăn nuôi khác & sản phẩm không qua giết mổ
                  </td>
                </tr>

                {/* Các dòng chăn nuôi */}
                {section3.livestockRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/30">
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-medium">
                      {row.stt}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleLiveRowChange(idx, 'name', e.target.value)}
                        disabled={readOnly}
                        placeholder="Tên vật nuôi / sản phẩm..."
                        className="w-full border border-slate-300 rounded p-1 bg-white text-slate-800 font-medium"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.soldValue || ''}
                        onChange={(e) => handleLiveRowChange(idx, 'soldValue', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.selfUsedValue || ''}
                        onChange={(e) => handleLiveRowChange(idx, 'selfUsedValue', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40 text-blue-900">
                      {row.totalRevenue.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.seedCost || ''}
                        onChange={(e) => handleLiveRowChange(idx, 'seedCost', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.fertilizerOrFeedCost || ''}
                        onChange={(e) => handleLiveRowChange(idx, 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.otherCost || ''}
                        onChange={(e) => handleLiveRowChange(idx, 'otherCost', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40 text-amber-900">
                      {row.totalCost.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                      {row.netIncome.toLocaleString('vi-VN')}
                    </td>
                    {!readOnly && (
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLiveRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* 5. Giống gia súc, gia cầm, vật nuôi */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">5</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Giống gia súc, gia cầm, vật nuôi</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.breedingRow.soldValue || ''}
                      onChange={(e) => handleFixedRowChange('breedingRow', 'soldValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.breedingRow.selfUsedValue || ''}
                      onChange={(e) => handleFixedRowChange('breedingRow', 'selfUsedValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40">
                    {section3.breedingRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.breedingRow.seedCost || ''}
                      onChange={(e) => handleFixedRowChange('breedingRow', 'seedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.breedingRow.fertilizerOrFeedCost || ''}
                      onChange={(e) => handleFixedRowChange('breedingRow', 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.breedingRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('breedingRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section3.breedingRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section3.breedingRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 6. Sản phẩm phụ chăn nuôi (Cột 4: x, Cột 5: x) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">6</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Sản phẩm phụ chăn nuôi</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.byProductsRow.soldValue || ''}
                      onChange={(e) => handleFixedRowChange('byProductsRow', 'soldValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.byProductsRow.selfUsedValue || ''}
                      onChange={(e) => handleFixedRowChange('byProductsRow', 'selfUsedValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40">
                    {section3.byProductsRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.byProductsRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('byProductsRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section3.byProductsRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section3.byProductsRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 7. Dịch vụ chăn nuôi (Cột 1, 2, 4, 5: x) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">7</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Dịch vụ chăn nuôi</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.servicesRow.totalRevenue || ''}
                      onChange={(e) => handleFixedRowChange('servicesRow', 'totalRevenue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono font-bold text-blue-900"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.servicesRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('servicesRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section3.servicesRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section3.servicesRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 8. Săn bắt, đánh bẫy (Cột 1, 2, 4, 5: x) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">8</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Săn bắt, đánh bẫy</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.huntingRow.totalRevenue || ''}
                      onChange={(e) => handleFixedRowChange('huntingRow', 'totalRevenue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono font-bold text-blue-900"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.huntingRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('huntingRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section3.huntingRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section3.huntingRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 9. Tiền được đền bù/hỗ trợ thiệt hại về chăn nuôi */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">9</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">
                    Tiền được đền bù/hỗ trợ thiệt hại về chăn nuôi do dịch bệnh, thiên tai, môi trường
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section3.compensationRow.netIncome || ''}
                      onChange={(e) => handleFixedRowChange('compensationRow', 'netIncome', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono font-bold text-emerald-900"
                    />
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* Dòng TỔNG SỐ */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 text-sm">
                  <td colSpan={2} className="p-2 border-r border-slate-300 text-center uppercase">
                    TỔNG SỐ
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900">
                    {section3.totalRow.soldValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900">
                    {section3.totalRow.selfUsedValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900 bg-blue-100/60">
                    {section3.totalRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section3.totalRow.seedCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section3.totalRow.feedCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section3.totalRow.otherCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900 bg-amber-100/60">
                    {section3.totalRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-900 bg-emerald-100 font-extrabold">
                    {section3.totalRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Câu 2. Tổng thu nhập từ chăn nuôi */}
          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-900">
              Câu 2. Tổng thu nhập từ chăn nuôi = Dòng tổng số cột (8)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-3 py-1 rounded border border-blue-300 shadow-inner">
                {section3.q2TotalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-slate-700">Nghìn đồng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
