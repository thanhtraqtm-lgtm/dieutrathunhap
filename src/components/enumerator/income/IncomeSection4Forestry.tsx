import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { HouseholdIncomeSurveyData, ProductionIncomeRow } from '../../../types/householdIncomeSurvey';
import { FORESTRY_CATALOG } from '../../../data/incomeCatalog';

interface Props {
  section4: HouseholdIncomeSurveyData['section4'];
  onChange: (updated: HouseholdIncomeSurveyData['section4']) => void;
  readOnly?: boolean;
}

export const IncomeSection4Forestry: React.FC<Props> = ({ section4, onChange, readOnly = false }) => {
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  const recalculateTotal = (
    forestRows: ProductionIncomeRow[],
    nurseryRow: ProductionIncomeRow,
    plantingRow: ProductionIncomeRow,
    servicesRow: ProductionIncomeRow,
    compRow: ProductionIncomeRow
  ) => {
    const all = [...forestRows, nurseryRow, plantingRow, servicesRow, compRow];
    const totalRow = {
      soldValue: all.reduce((s, r) => s + (r.soldValue || 0), 0),
      selfUsedValue: all.reduce((s, r) => s + (r.selfUsedValue || 0), 0),
      totalRevenue: all.reduce((s, r) => s + (r.totalRevenue || 0), 0),
      seedCost: all.reduce((s, r) => s + (r.seedCost || 0), 0),
      fertilizerCost: all.reduce((s, r) => s + (r.fertilizerOrFeedCost || 0), 0),
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
      const calc = recalculateTotal([], section4.nurseryRow, section4.plantingRow, section4.servicesRow, section4.compensationRow);
      onChange({
        ...section4,
        hasForestryIncome: 2,
        forestryRows: [],
        totalRow: { ...calc.totalRow, netIncome: 0 },
        q2TotalIncome: 0
      });
    } else {
      const defaultRows: ProductionIncomeRow[] = section4.forestryRows.length > 0 ? section4.forestryRows : [
        {
          id: 'forest-' + Date.now(),
          stt: '1.1',
          name: 'Cây lấy gỗ (keo, bạch đàn...)',
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
      const calc = recalculateTotal(defaultRows, section4.nurseryRow, section4.plantingRow, section4.servicesRow, section4.compensationRow);
      onChange({
        ...section4,
        hasForestryIncome: 1,
        forestryRows: defaultRows,
        ...calc
      });
    }
  };

  const handleForestRowChange = (index: number, field: keyof ProductionIncomeRow, val: any) => {
    if (readOnly) return;
    const updated = [...section4.forestryRows];
    const row = { ...updated[index], [field]: val };

    const sold = Number(row.soldValue) || 0;
    const selfUsed = Number(row.selfUsedValue) || 0;
    row.totalRevenue = sold + selfUsed;

    const seed = Number(row.seedCost) || 0;
    const fert = Number(row.fertilizerOrFeedCost) || 0;
    const other = Number(row.otherCost) || 0;
    row.totalCost = seed + fert + other;

    row.netIncome = row.totalRevenue - row.totalCost;
    updated[index] = row;

    const calc = recalculateTotal(
      updated,
      section4.nurseryRow,
      section4.plantingRow,
      section4.servicesRow,
      section4.compensationRow
    );

    onChange({
      ...section4,
      forestryRows: updated,
      ...calc
    });
  };

  const handleFixedRowChange = (
    rowKey: 'nurseryRow' | 'plantingRow' | 'servicesRow' | 'compensationRow',
    field: keyof ProductionIncomeRow,
    val: any
  ) => {
    if (readOnly) return;
    const row = { ...section4[rowKey], [field]: val };

    if (rowKey === 'compensationRow') {
      row.netIncome = Number(val) || 0;
    } else {
      const sold = Number(row.soldValue) || 0;
      const selfUsed = Number(row.selfUsedValue) || 0;
      row.totalRevenue = sold + selfUsed;

      const seed = Number(row.seedCost) || 0;
      const fert = Number(row.fertilizerOrFeedCost) || 0;
      const other = Number(row.otherCost) || 0;
      row.totalCost = seed + fert + other;

      row.netIncome = row.totalRevenue - row.totalCost;
    }

    const nextState = {
      ...section4,
      [rowKey]: row
    };

    const calc = recalculateTotal(
      nextState.forestryRows,
      nextState.nurseryRow,
      nextState.plantingRow,
      nextState.servicesRow,
      nextState.compensationRow
    );

    onChange({
      ...nextState,
      ...calc
    });
  };

  const handleAddForestRow = (catalogItem?: { name: string; category: string }) => {
    if (readOnly) return;
    const nextStt = `1.${section4.forestryRows.length + 1}`;
    const newRow: ProductionIncomeRow = {
      id: 'forest-' + Date.now() + Math.random(),
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
      disableSeed: true,
      disableFertilizerOrFeed: true,
    };

    const updated = [...section4.forestryRows, newRow];
    const calc = recalculateTotal(
      updated,
      section4.nurseryRow,
      section4.plantingRow,
      section4.servicesRow,
      section4.compensationRow
    );

    onChange({
      ...section4,
      forestryRows: updated,
      ...calc
    });
  };

  const handleRemoveForestRow = (index: number) => {
    if (readOnly) return;
    const updated = section4.forestryRows.filter((_, i) => i !== index);
    const calc = recalculateTotal(
      updated,
      section4.nurseryRow,
      section4.plantingRow,
      section4.servicesRow,
      section4.compensationRow
    );
    onChange({
      ...section4,
      forestryRows: updated,
      ...calc
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-bold text-slate-900 uppercase">
          MỤC 4: THU NHẬP TỪ LÂM NGHIỆP
        </h3>
      </div>

      {/* Câu hỏi sàng lọc 1 */}
      <div className="text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
        <p className="font-semibold text-slate-800 leading-relaxed">
          Câu 1. Trong 12 tháng qua hộ ông/bà có phát sinh thu nhập - chi phí từ hoạt động lâm nghiệp (khai thác gỗ, khai thác và thu nhặt sản phẩm từ rừng và cây lâm nghiệp phân tán, ươm các loại giống cây lâm nghiệp, trồng/quản lý/bảo vệ/chăm sóc rừng, hoạt động dịch vụ lâm nghiệp,...) không?
        </p>

        <div className="flex flex-wrap items-center gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasForestryIncome"
              checked={section4.hasForestryIncome === 1}
              onChange={() => handleToggleHasIncome(1)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>1. Có <span className="text-xs text-blue-700 font-normal">[Mã 1: Hỏi thông tin thu nhập - chi phí từ lâm nghiệp]</span></span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasForestryIncome"
              checked={section4.hasForestryIncome === 2}
              onChange={() => handleToggleHasIncome(2)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>2. Không <span className="text-xs text-slate-500 font-normal">[Mã 2: Chuyển qua mục 5 (Thu nhập từ thủy sản)]</span></span>
          </label>
        </div>
      </div>

      {section4.hasForestryIncome === 1 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(!showCatalogModal)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-900 hover:bg-green-100 rounded font-semibold border border-green-300 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Tra danh mục lâm nghiệp (14 loại)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddForestRow()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm lâm sản
                </button>
              </div>
            )}
          </div>

          {showCatalogModal && (
            <div className="p-3 bg-green-50/70 border border-green-200 rounded-lg text-xs">
              <div className="flex justify-between items-center mb-2 font-bold text-green-900">
                <span>Danh mục các nguồn thu từ lâm nghiệp (Trang 26): Bấm chọn để thêm vào bảng</span>
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="text-slate-500 hover:text-slate-800 font-bold"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1 bg-white border border-green-100 rounded">
                {FORESTRY_CATALOG.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      handleAddForestRow(item);
                      setShowCatalogModal(false);
                    }}
                    className="text-left px-2 py-1 rounded hover:bg-green-100 text-slate-800 truncate"
                    title={`${item.code}. ${item.name} (${item.category})`}
                  >
                    <span className="font-mono text-green-800 font-bold mr-1">{item.code}.</span>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kê Mục 4 */}
          <div className="overflow-x-auto border border-slate-400 rounded">
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-center border-b border-slate-300">
                <tr>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-12">STT</th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 min-w-[180px]">Nguồn thu</th>
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
                    Phân bón, BVTV, diệt cỏ
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
                {/* 1. Khai thác, thu nhặt lâm sản */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="p-1.5 border-r border-slate-200 text-center">1</td>
                  <td colSpan={!readOnly ? 10 : 9} className="p-1.5 border-r border-slate-200 uppercase">
                    Khai thác, thu nhặt lâm sản (Cột 4: ×, Cột 5: ×)
                  </td>
                </tr>

                {section4.forestryRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/30">
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-medium">
                      {row.stt}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleForestRowChange(idx, 'name', e.target.value)}
                        disabled={readOnly}
                        placeholder="Tên lâm sản..."
                        className="w-full border border-slate-300 rounded p-1 bg-white text-slate-800 font-medium"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.soldValue || ''}
                        onChange={(e) => handleForestRowChange(idx, 'soldValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleForestRowChange(idx, 'selfUsedValue', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                        placeholder="0"
                        className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40 text-blue-900">
                      {row.totalRevenue.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                    <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.otherCost || ''}
                        onChange={(e) => handleForestRowChange(idx, 'otherCost', parseFloat(e.target.value) || 0)}
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
                          onClick={() => handleRemoveForestRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* 2. Ươm giống cây lâm nghiệp */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">2</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Ươm giống cây lâm nghiệp</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.nurseryRow.soldValue || ''}
                      onChange={(e) => handleFixedRowChange('nurseryRow', 'soldValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.nurseryRow.selfUsedValue || ''}
                      onChange={(e) => handleFixedRowChange('nurseryRow', 'selfUsedValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40">
                    {section4.nurseryRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.nurseryRow.seedCost || ''}
                      onChange={(e) => handleFixedRowChange('nurseryRow', 'seedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.nurseryRow.fertilizerOrFeedCost || ''}
                      onChange={(e) => handleFixedRowChange('nurseryRow', 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.nurseryRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('nurseryRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section4.nurseryRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section4.nurseryRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 3. Trồng rừng, chăm sóc, tu bổ, cải tạo rừng, khoanh nuôi tái sinh */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">3</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">
                    Trồng rừng, chăm sóc, tu bổ, cải tạo rừng, khoanh nuôi tái sinh
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.plantingRow.soldValue || ''}
                      onChange={(e) => handleFixedRowChange('plantingRow', 'soldValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.plantingRow.selfUsedValue || ''}
                      onChange={(e) => handleFixedRowChange('plantingRow', 'selfUsedValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40">
                    {section4.plantingRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.plantingRow.seedCost || ''}
                      onChange={(e) => handleFixedRowChange('plantingRow', 'seedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.plantingRow.fertilizerOrFeedCost || ''}
                      onChange={(e) => handleFixedRowChange('plantingRow', 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.plantingRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('plantingRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section4.plantingRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section4.plantingRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 4. Dịch vụ lâm nghiệp (Cột 4: x, Cột 5: x) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">4</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Dịch vụ lâm nghiệp</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.servicesRow.soldValue || ''}
                      onChange={(e) => handleFixedRowChange('servicesRow', 'soldValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.servicesRow.selfUsedValue || ''}
                      onChange={(e) => handleFixedRowChange('servicesRow', 'selfUsedValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40">
                    {section4.servicesRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section4.servicesRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('servicesRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section4.servicesRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section4.servicesRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 5. Tiền được đền bù/hỗ trợ thiệt hại */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">5</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">
                    Tiền được đền bù/hỗ trợ thiệt hại về lâm nghiệp do dịch bệnh, thiên tai, môi trường
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
                      value={section4.compensationRow.netIncome || ''}
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
                    {section4.totalRow.soldValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900">
                    {section4.totalRow.selfUsedValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900 bg-blue-100/60">
                    {section4.totalRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section4.totalRow.seedCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section4.totalRow.fertilizerCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section4.totalRow.otherCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900 bg-amber-100/60">
                    {section4.totalRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-900 bg-emerald-100 font-extrabold">
                    {section4.totalRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Câu 2. Tổng thu nhập từ lâm nghiệp */}
          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-900">
              Câu 2. Tổng thu nhập từ lâm nghiệp = Dòng tổng số cột (8)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-3 py-1 rounded border border-blue-300 shadow-inner">
                {section4.q2TotalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-slate-700">Nghìn đồng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
