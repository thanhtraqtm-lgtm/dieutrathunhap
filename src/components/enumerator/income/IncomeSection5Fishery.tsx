import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { HouseholdIncomeSurveyData, ProductionIncomeRow } from '../../../types/householdIncomeSurvey';

interface Props {
  section5: HouseholdIncomeSurveyData['section5'];
  onChange: (updated: HouseholdIncomeSurveyData['section5']) => void;
  readOnly?: boolean;
}

export const IncomeSection5Fishery: React.FC<Props> = ({ section5, onChange, readOnly = false }) => {
  const recalculateTotal = (
    aquaRows: ProductionIncomeRow[],
    catchRows: ProductionIncomeRow[],
    breedRows: ProductionIncomeRow[],
    compRow: ProductionIncomeRow
  ) => {
    const all = [...aquaRows, ...catchRows, ...breedRows, compRow];
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
      const calc = recalculateTotal([], [], [], section5.compensationRow);
      onChange({
        ...section5,
        hasFisheryIncome: 2,
        aquacultureRows: [],
        catchingRows: [],
        breedingRows: [],
        totalRow: { ...calc.totalRow, netIncome: 0 },
        q2TotalIncome: 0
      });
    } else {
      const defaultAqua: ProductionIncomeRow[] = section5.aquacultureRows.length > 0 ? section5.aquacultureRows : [
        {
          id: 'aqua-' + Date.now(),
          stt: '1.1',
          name: 'Cá (nuôi ao hồ, nước ngọt)',
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
      const calc = recalculateTotal(defaultAqua, section5.catchingRows, section5.breedingRows, section5.compensationRow);
      onChange({
        ...section5,
        hasFisheryIncome: 1,
        aquacultureRows: defaultAqua,
        ...calc
      });
    }
  };

  const handleRowChange = (
    groupKey: 'aquacultureRows' | 'catchingRows' | 'breedingRows',
    index: number,
    field: keyof ProductionIncomeRow,
    val: any
  ) => {
    if (readOnly) return;
    const list = [...section5[groupKey]];
    const row = { ...list[index], [field]: val };

    const sold = Number(row.soldValue) || 0;
    const selfUsed = Number(row.selfUsedValue) || 0;
    row.totalRevenue = sold + selfUsed;

    const seed = Number(row.seedCost) || 0;
    const feed = Number(row.fertilizerOrFeedCost) || 0;
    const other = Number(row.otherCost) || 0;
    row.totalCost = seed + feed + other;

    row.netIncome = row.totalRevenue - row.totalCost;
    list[index] = row;

    const nextState = {
      ...section5,
      [groupKey]: list
    };

    const calc = recalculateTotal(
      nextState.aquacultureRows,
      nextState.catchingRows,
      nextState.breedingRows,
      nextState.compensationRow
    );

    onChange({
      ...nextState,
      ...calc
    });
  };

  const handleCompensationChange = (val: number) => {
    if (readOnly) return;
    const row = { ...section5.compensationRow, netIncome: val };
    const nextState = {
      ...section5,
      compensationRow: row
    };
    const calc = recalculateTotal(
      nextState.aquacultureRows,
      nextState.catchingRows,
      nextState.breedingRows,
      nextState.compensationRow
    );
    onChange({
      ...nextState,
      ...calc
    });
  };

  const handleAddRow = (groupKey: 'aquacultureRows' | 'catchingRows' | 'breedingRows', defaultName: string) => {
    if (readOnly) return;
    const list = section5[groupKey];
    const prefix = groupKey === 'aquacultureRows' ? '1' : groupKey === 'catchingRows' ? '2' : '3';
    const nextStt = `${prefix}.${list.length + 1}`;
    const newRow: ProductionIncomeRow = {
      id: `${prefix}-${Date.now()}`,
      stt: nextStt,
      name: defaultName,
      soldValue: 0,
      selfUsedValue: 0,
      totalRevenue: 0,
      seedCost: 0,
      fertilizerOrFeedCost: 0,
      otherCost: 0,
      totalCost: 0,
      netIncome: 0,
      disableSeed: groupKey === 'catchingRows',
      disableFertilizerOrFeed: groupKey === 'catchingRows',
    };

    const nextList = [...list, newRow];
    const nextState = {
      ...section5,
      [groupKey]: nextList
    };
    const calc = recalculateTotal(
      nextState.aquacultureRows,
      nextState.catchingRows,
      nextState.breedingRows,
      nextState.compensationRow
    );
    onChange({
      ...nextState,
      ...calc
    });
  };

  const handleRemoveRow = (groupKey: 'aquacultureRows' | 'catchingRows' | 'breedingRows', index: number) => {
    if (readOnly) return;
    const list = section5[groupKey].filter((_, i) => i !== index);
    const nextState = {
      ...section5,
      [groupKey]: list
    };
    const calc = recalculateTotal(
      nextState.aquacultureRows,
      nextState.catchingRows,
      nextState.breedingRows,
      nextState.compensationRow
    );
    onChange({
      ...nextState,
      ...calc
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-bold text-slate-900 uppercase">
          MỤC 5: THU NHẬP TỪ THỦY SẢN
        </h3>
      </div>

      <div className="text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
        <p className="font-semibold text-slate-800 leading-relaxed">
          Câu 1. Trong 12 tháng qua hộ ông/bà có phát sinh thu nhập - chi phí từ hoạt động nuôi, ươm giống cá, tôm, thủy sản khác hoặc đánh bắt thủy hải sản ở ao hồ, sông, suối, biển không?
        </p>

        <div className="flex flex-wrap items-center gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasFisheryIncome"
              checked={section5.hasFisheryIncome === 1}
              onChange={() => handleToggleHasIncome(1)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>1. Có <span className="text-xs text-blue-700 font-normal">[Mã 1: Hỏi thông tin thu nhập - chi phí từ thủy sản của hộ]</span></span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
            <input
              type="radio"
              name="hasFisheryIncome"
              checked={section5.hasFisheryIncome === 2}
              onChange={() => handleToggleHasIncome(2)}
              disabled={readOnly}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span>2. Không <span className="text-xs text-slate-500 font-normal">[Mã 2: Chuyển qua mục 6 (SXKD phi NLTS / chế biến)]</span></span>
          </label>
        </div>
      </div>

      {section5.hasFisheryIncome === 1 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="italic text-slate-500">Đơn vị tính: 1.000 đồng</span>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddRow('aquacultureRows', 'Cá nuôi')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" /> + Nuôi trồng
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRow('catchingRows', 'Cá đánh bắt')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 rounded font-semibold border border-cyan-200"
                >
                  <Plus className="w-3.5 h-3.5" /> + Đánh bắt
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRow('breedingRows', 'Cá giống')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded font-semibold border border-emerald-200"
                >
                  <Plus className="w-3.5 h-3.5" /> + Sản xuất giống
                </button>
              </div>
            )}
          </div>

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
                {/* 1. Nuôi trồng thủy sản */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="p-1.5 border-r border-slate-200 text-center">1</td>
                  <td colSpan={!readOnly ? 10 : 9} className="p-1.5 border-r border-slate-200 uppercase">
                    Nuôi trồng thủy sản
                  </td>
                </tr>
                {section5.aquacultureRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/30">
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-medium">{row.stt}</td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleRowChange('aquacultureRows', idx, 'name', e.target.value)}
                        disabled={readOnly}
                        className="w-full border border-slate-300 rounded p-1 bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.soldValue || ''}
                        onChange={(e) => handleRowChange('aquacultureRows', idx, 'soldValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('aquacultureRows', idx, 'selfUsedValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('aquacultureRows', idx, 'seedCost', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('aquacultureRows', idx, 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('aquacultureRows', idx, 'otherCost', parseFloat(e.target.value) || 0)}
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
                        <button type="button" onClick={() => handleRemoveRow('aquacultureRows', idx)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* 2. Đánh bắt thủy sản (Cột 4: x, Cột 5: x) */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="p-1.5 border-r border-slate-200 text-center">2</td>
                  <td colSpan={!readOnly ? 10 : 9} className="p-1.5 border-r border-slate-200 uppercase">
                    Đánh bắt thủy sản (Cột 4: ×, Cột 5: ×)
                  </td>
                </tr>
                {section5.catchingRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/30">
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-medium">{row.stt}</td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleRowChange('catchingRows', idx, 'name', e.target.value)}
                        disabled={readOnly}
                        className="w-full border border-slate-300 rounded p-1 bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.soldValue || ''}
                        onChange={(e) => handleRowChange('catchingRows', idx, 'soldValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('catchingRows', idx, 'selfUsedValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('catchingRows', idx, 'otherCost', parseFloat(e.target.value) || 0)}
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
                        <button type="button" onClick={() => handleRemoveRow('catchingRows', idx)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* 3. Sản xuất giống */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="p-1.5 border-r border-slate-200 text-center">3</td>
                  <td colSpan={!readOnly ? 10 : 9} className="p-1.5 border-r border-slate-200 uppercase">
                    Sản xuất giống
                  </td>
                </tr>
                {section5.breedingRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/30">
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono font-medium">{row.stt}</td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleRowChange('breedingRows', idx, 'name', e.target.value)}
                        disabled={readOnly}
                        className="w-full border border-slate-300 rounded p-1 bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        value={row.soldValue || ''}
                        onChange={(e) => handleRowChange('breedingRows', idx, 'soldValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('breedingRows', idx, 'selfUsedValue', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('breedingRows', idx, 'seedCost', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('breedingRows', idx, 'fertilizerOrFeedCost', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => handleRowChange('breedingRows', idx, 'otherCost', parseFloat(e.target.value) || 0)}
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
                        <button type="button" onClick={() => handleRemoveRow('breedingRows', idx)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* 4. Tiền được đền bù/hỗ trợ thiệt hại về thủy sản */}
                <tr className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">4</td>
                  <td className="p-1.5 border-r border-slate-200 font-medium">
                    Tiền được đền bù/hỗ trợ thiệt hại về thủy sản do dịch bệnh, thiên tai, môi trường
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
                      value={section5.compensationRow.netIncome || ''}
                      onChange={(e) => handleCompensationChange(parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="0"
                      className="w-full text-right border border-slate-300 rounded p-1 bg-white font-mono font-bold text-emerald-900"
                    />
                  </td>
                  {!readOnly && <td></td>}
                </tr>

                {/* Dòng TỔNG SỐ */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 text-sm">
                  <td colSpan={2} className="p-2 border-r border-slate-300 text-center uppercase">TỔNG SỐ</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900">{section5.totalRow.soldValue.toLocaleString('vi-VN')}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900">{section5.totalRow.selfUsedValue.toLocaleString('vi-VN')}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900 bg-blue-100/60">{section5.totalRow.totalRevenue.toLocaleString('vi-VN')}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">{section5.totalRow.seedCost.toLocaleString('vi-VN')}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">{section5.totalRow.feedCost.toLocaleString('vi-VN')}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900">{section5.totalRow.otherCost.toLocaleString('vi-VN')}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-900 bg-amber-100/60">{section5.totalRow.totalCost.toLocaleString('vi-VN')}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-900 bg-emerald-100 font-extrabold">{section5.totalRow.netIncome.toLocaleString('vi-VN')}</td>
                  {!readOnly && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-900">Câu 2. Tổng thu nhập từ thủy sản = Dòng tổng số cột (8)</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-3 py-1 rounded border border-blue-300 shadow-inner">
                {section5.q2TotalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-slate-700">Nghìn đồng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
