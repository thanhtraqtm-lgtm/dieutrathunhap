import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { HouseholdIncomeSurveyData, ProductionIncomeRow } from '../../../types/householdIncomeSurvey';
import { CROPS_CATALOG } from '../../../data/incomeCatalog';

interface Props {
  section2: HouseholdIncomeSurveyData['section2'];
  onChange: (updated: HouseholdIncomeSurveyData['section2']) => void;
  readOnly?: boolean;
}

export const IncomeSection2Crops: React.FC<Props> = ({ section2, onChange, readOnly = false }) => {
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Tính lại tổng tất cả các dòng Mục 2
  const recalculateTotal = (
    cropRows: ProductionIncomeRow[],
    seedRow: ProductionIncomeRow,
    byProductRow: ProductionIncomeRow,
    servicesRow: ProductionIncomeRow,
    compRow: ProductionIncomeRow
  ) => {
    const all = [...cropRows, seedRow, byProductRow, servicesRow, compRow];
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
      const calc = recalculateTotal([], section2.breedingSeedRow, section2.byProductsRow, section2.servicesRow, section2.compensationRow);
      onChange({
        ...section2,
        hasCropsIncome: 2,
        cropRows: [],
        totalRow: { ...calc.totalRow, netIncome: 0 },
        q2TotalIncome: 0
      });
    } else {
      const defaultRows: ProductionIncomeRow[] = section2.cropRows.length > 0 ? section2.cropRows : [
        {
          id: 'crop-' + Date.now(),
          stt: '1.1',
          name: 'Cây lúa',
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
      const calc = recalculateTotal(defaultRows, section2.breedingSeedRow, section2.byProductsRow, section2.servicesRow, section2.compensationRow);
      onChange({
        ...section2,
        hasCropsIncome: 1,
        cropRows: defaultRows,
        ...calc
      });
    }
  };

  // Cập nhật dòng cây trồng thông thường
  const handleCropRowChange = (index: number, field: keyof ProductionIncomeRow, val: any) => {
    if (readOnly) return;
    const updated = [...section2.cropRows];
    const row = { ...updated[index], [field]: val };

    // Tự động tính: Cột 3 = Cột 1 + Cột 2
    const sold = Number(row.soldValue) || 0;
    const selfUsed = Number(row.selfUsedValue) || 0;
    row.totalRevenue = sold + selfUsed;

    // Tự động tính: Cột 7 = Cột 4 + Cột 5 + Cột 6
    const seed = Number(row.seedCost) || 0;
    const fert = Number(row.fertilizerOrFeedCost) || 0;
    const other = Number(row.otherCost) || 0;
    row.totalCost = seed + fert + other;

    // Tự động tính: Cột 8 = Cột 3 - Cột 7
    row.netIncome = row.totalRevenue - row.totalCost;

    updated[index] = row;

    const calc = recalculateTotal(updated, section2.breedingSeedRow, section2.byProductsRow, section2.servicesRow, section2.compensationRow);
    onChange({
      ...section2,
      cropRows: updated,
      ...calc
    });
  };

  // Cập nhật dòng cố định (nhân giống, phụ phẩm, dịch vụ, đền bù)
  const handleFixedRowChange = (
    rowKey: 'breedingSeedRow' | 'byProductsRow' | 'servicesRow' | 'compensationRow',
    field: keyof ProductionIncomeRow,
    val: any
  ) => {
    if (readOnly) return;
    const row = { ...section2[rowKey], [field]: val };

    if (rowKey === 'compensationRow') {
      // Dòng đền bù: chỉ có cột 8 thu nhập
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
      ...section2,
      [rowKey]: row
    };

    const calc = recalculateTotal(
      nextState.cropRows,
      nextState.breedingSeedRow,
      nextState.byProductsRow,
      nextState.servicesRow,
      nextState.compensationRow
    );

    onChange({
      ...nextState,
      ...calc
    });
  };

  const handleAddCropRow = (catalogName?: string) => {
    if (readOnly) return;
    const nextStt = `1.${section2.cropRows.length + 1}`;
    const newRow: ProductionIncomeRow = {
      id: 'crop-' + Date.now() + Math.random(),
      stt: nextStt,
      name: catalogName || '',
      soldValue: 0,
      selfUsedValue: 0,
      totalRevenue: 0,
      seedCost: 0,
      fertilizerOrFeedCost: 0,
      otherCost: 0,
      totalCost: 0,
      netIncome: 0,
    };

    const updated = [...section2.cropRows, newRow];
    const calc = recalculateTotal(updated, section2.breedingSeedRow, section2.byProductsRow, section2.servicesRow, section2.compensationRow);
    onChange({
      ...section2,
      cropRows: updated,
      ...calc
    });
  };

  const handleRemoveCropRow = (index: number) => {
    if (readOnly) return;
    const updated = section2.cropRows.filter((_, i) => i !== index).map((r, i) => ({
      ...r,
      stt: `1.${i + 1}`
    }));
    const calc = recalculateTotal(updated, section2.breedingSeedRow, section2.byProductsRow, section2.servicesRow, section2.compensationRow);
    onChange({
      ...section2,
      cropRows: updated,
      ...calc
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-bold text-slate-900 uppercase">
          MỤC 2: THU NHẬP TỪ TRỒNG TRỌT
        </h3>
      </div>

      {/* Câu hỏi sàng lọc 1 */}
      <div className="text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
        <p className="font-semibold text-slate-800 leading-relaxed">
          Câu 1. Trong 12 tháng qua hộ ông/bà có phát sinh thu nhập - chi phí từ hoạt động trồng trọt không?
        </p>

        <div className="flex flex-wrap items-center gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasCropsIncome"
              checked={section2.hasCropsIncome === 1}
              onChange={() => handleToggleHasIncome(1)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>1. Có <span className="text-xs text-blue-700 font-normal">[Mã 1: Hỏi thông tin thu nhập - chi phí từ trồng trọt]</span></span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasCropsIncome"
              checked={section2.hasCropsIncome === 2}
              onChange={() => handleToggleHasIncome(2)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>2. Không <span className="text-xs text-slate-500 font-normal">[Mã 2: Chuyển qua mục 3 (Thu nhập từ chăn nuôi)]</span></span>
          </label>
        </div>
      </div>

      {section2.hasCropsIncome === 1 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(!showCatalogModal)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded font-semibold border border-emerald-300 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Tra danh mục cây trồng chuẩn (63 loại)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCropRow()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm cây trồng
                </button>
              </div>
            )}
          </div>

          {/* Hộp thoại gợi ý tra cứu 63 loại cây trồng */}
          {showCatalogModal && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
              <div className="flex justify-between items-center mb-2 font-bold text-emerald-900">
                <span>Danh mục các nguồn thu từ hoạt động trồng trọt (Trang 25): Bấm chọn để thêm vào bảng</span>
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="text-slate-500 hover:text-slate-800 font-bold"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white border border-emerald-100 rounded">
                {CROPS_CATALOG.map((crop) => (
                  <button
                    key={crop.code}
                    type="button"
                    onClick={() => {
                      handleAddCropRow(crop.name);
                      setShowCatalogModal(false);
                    }}
                    className="text-left px-2 py-1 rounded hover:bg-emerald-100 text-slate-800 truncate"
                    title={`${crop.code}. ${crop.name} (${crop.category})`}
                  >
                    <span className="font-mono text-emerald-700 font-bold mr-1">{crop.code}.</span>
                    {crop.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kê chuẩn xác 100% theo Trang 24 */}
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
                    Giá trị thu hoạch để lại sử dụng & tồn kho
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
                {/* 1. Dòng tiêu đề Cây trồng các loại */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="p-1.5 border-r border-slate-200 text-center">1</td>
                  <td colSpan={!readOnly ? 10 : 9} className="p-1.5 border-r border-slate-200 uppercase">
                    Cây trồng các loại
                  </td>
                </tr>

                {/* Các dòng chi tiết cây trồng */}
                {section2.cropRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/30">
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-medium">
                      {row.stt}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleCropRowChange(idx, 'name', e.target.value)}
                        disabled={readOnly}
                        placeholder="Tên cây trồng (chọn từ danh mục hoặc nhập)..."
                        className="w-full border border-slate-300 rounded p-1 bg-white text-slate-800 font-medium"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.soldValue || ''}
                        onChange={(e) => handleCropRowChange(idx, 'soldValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleCropRowChange(idx, 'selfUsedValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleCropRowChange(idx, 'seedCost', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleCropRowChange(idx, 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleCropRowChange(idx, 'otherCost', parseFloat(e.target.value) || 0)}
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
                          onClick={() => handleRemoveCropRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa dòng cây trồng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* 2. Nhân giống và chăm sóc giống */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">2</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Nhân giống và chăm sóc giống</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.breedingSeedRow.soldValue || ''}
                      onChange={(e) => handleFixedRowChange('breedingSeedRow', 'soldValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.breedingSeedRow.selfUsedValue || ''}
                      onChange={(e) => handleFixedRowChange('breedingSeedRow', 'selfUsedValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40">
                    {section2.breedingSeedRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.breedingSeedRow.seedCost || ''}
                      onChange={(e) => handleFixedRowChange('breedingSeedRow', 'seedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.breedingSeedRow.fertilizerOrFeedCost || ''}
                      onChange={(e) => handleFixedRowChange('breedingSeedRow', 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.breedingSeedRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('breedingSeedRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section2.breedingSeedRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section2.breedingSeedRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 3. Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt (Cột 4: x, Cột 5: x) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">3</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">
                    Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.byProductsRow.soldValue || ''}
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
                      value={section2.byProductsRow.selfUsedValue || ''}
                      onChange={(e) => handleFixedRowChange('byProductsRow', 'selfUsedValue', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-blue-50/40">
                    {section2.byProductsRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">
                    ×
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">
                    ×
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.byProductsRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('byProductsRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section2.byProductsRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section2.byProductsRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 4. Dịch vụ trồng trọt (Cột 1: x, Cột 2: x, Cột 4: x, Cột 5: x) */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">4</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">Dịch vụ trồng trọt</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-100">×</td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="number"
                      min={0}
                      value={section2.servicesRow.totalRevenue || ''}
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
                      value={section2.servicesRow.otherCost || ''}
                      onChange={(e) => handleFixedRowChange('servicesRow', 'otherCost', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-amber-50/40">
                    {section2.servicesRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-bold font-mono bg-emerald-50/60 text-emerald-900">
                    {section2.servicesRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* 5. Tiền được đền bù/hỗ trợ thiệt hại về trồng trọt do dịch bệnh, thiên tai, môi trường */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">5</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">
                    Tiền được đền bù/hỗ trợ thiệt hại về trồng trọt do dịch bệnh, thiên tai, môi trường
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
                      value={section2.compensationRow.netIncome || ''}
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
                    {section2.totalRow.soldValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900">
                    {section2.totalRow.selfUsedValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900 bg-blue-100/60">
                    {section2.totalRow.totalRevenue.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section2.totalRow.seedCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section2.totalRow.fertilizerCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">
                    {section2.totalRow.otherCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900 bg-amber-100/60">
                    {section2.totalRow.totalCost.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-900 bg-emerald-100 font-extrabold">
                    {section2.totalRow.netIncome.toLocaleString('vi-VN')}
                  </td>
                  {!readOnly && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Câu 2. Tổng thu nhập từ trồng trọt */}
          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-900">
              Câu 2. Tổng thu nhập từ trồng trọt = Dòng tổng số cột (8)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-3 py-1 rounded border border-blue-300 shadow-inner">
                {section2.q2TotalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-slate-700">Nghìn đồng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
