import React from 'react';
import { HouseholdIncomeSurveyData } from '../../../types/householdIncomeSurvey';

interface Props {
  general: HouseholdIncomeSurveyData['general'];
  onChange: (updated: HouseholdIncomeSurveyData['general']) => void;
  readOnly?: boolean;
}

export const IncomeGeneralSection: React.FC<Props> = ({ general, onChange, readOnly = false }) => {
  const handleChange = (field: keyof HouseholdIncomeSurveyData['general'], value: any) => {
    if (readOnly) return;
    onChange({
      ...general,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
      {/* Tiêu đề Quốc hiệu & Văn bản */}
      <div className="text-center pb-4 border-b border-slate-200">
        <p className="text-sm font-semibold uppercase text-slate-600">Phụ lục II</p>
        <h2 className="text-xl font-bold uppercase text-slate-900 mt-1 tracking-wide">
          PHIẾU THU THẬP THÔNG TIN VỀ THU NHẬP CỦA HỘ DÂN CƯ
        </h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm font-medium text-slate-700">Năm</span>
          <input
            type="text"
            value={general.year}
            onChange={(e) => handleChange('year', e.target.value)}
            disabled={readOnly}
            className="w-20 text-center font-bold text-blue-800 border-b border-slate-400 focus:outline-none focus:border-blue-600 bg-transparent text-sm"
          />
        </div>
      </div>

      {/* Phần Hành Chính */}
      <div className="mt-5 space-y-3.5 text-sm">
        {/* Xã/Phường & Mã 6 ô */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="font-semibold text-slate-800 whitespace-nowrap">Xã/phường:</span>
            <input
              type="text"
              value={general.communeName}
              onChange={(e) => handleChange('communeName', e.target.value)}
              disabled={readOnly}
              className="flex-1 border-b border-dotted border-slate-400 focus:outline-none px-2 py-0.5 bg-transparent"
              placeholder="Ghi rõ tên xã/phường..."
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1.5">[Mã xã/phường]:</span>
            {(general.communeCode || '000000').padEnd(6, ' ').slice(0, 6).split('').map((char, i) => (
              <div
                key={i}
                className="w-7 h-7 border border-slate-700 font-mono font-bold flex items-center justify-center text-sm bg-slate-50 text-slate-900 shadow-inner"
              >
                {char.trim()}
              </div>
            ))}
          </div>
        </div>

        {/* Địa bàn điều tra (3 ô) & Hộ số (3 ô) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-1">
            <span className="font-semibold text-slate-800">Địa bàn điều tra:</span>
            <div className="flex items-center gap-1">
              {(general.areaCode || '001').padEnd(3, ' ').slice(0, 3).split('').map((char, i) => (
                <div
                  key={i}
                  className="w-7 h-7 border border-slate-700 font-mono font-bold flex items-center justify-center text-sm bg-slate-50 text-slate-900"
                >
                  {char.trim()}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-1">
            <span className="font-semibold text-slate-800">Hộ số:</span>
            <div className="flex items-center gap-1">
              {(general.householdNumber || '001').padEnd(3, ' ').slice(0, 3).split('').map((char, i) => (
                <div
                  key={i}
                  className="w-7 h-7 border border-slate-700 font-mono font-bold flex items-center justify-center text-sm bg-slate-50 text-slate-900"
                >
                  {char.trim()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Họ tên chủ hộ */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 whitespace-nowrap">Họ và tên chủ hộ:</span>
          <input
            type="text"
            value={general.ownerName}
            onChange={(e) => handleChange('ownerName', e.target.value)}
            disabled={readOnly}
            className="flex-1 font-semibold text-slate-900 border-b border-dotted border-slate-400 focus:outline-none px-2 py-0.5 bg-transparent"
            placeholder="Họ tên chủ hộ..."
          />
        </div>

        {/* Địa chỉ & Số điện thoại */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2">
            <span className="font-semibold text-slate-800 whitespace-nowrap">Địa chỉ:</span>
            <input
              type="text"
              value={general.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={readOnly}
              className="flex-1 border-b border-dotted border-slate-400 focus:outline-none px-2 py-0.5 bg-transparent"
              placeholder="Số nhà, đường phố, tổ/thôn..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 whitespace-nowrap">Số điện thoại:</span>
            <input
              type="text"
              value={general.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={readOnly}
              className="flex-1 font-mono border-b border-dotted border-slate-400 focus:outline-none px-2 py-0.5 bg-transparent"
              placeholder="09..."
            />
          </div>
        </div>

        {/* Số nhân khẩu và lao động */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 mt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Tổng số thành viên của hộ:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                value={general.totalMembers}
                onChange={(e) => handleChange('totalMembers', parseInt(e.target.value) || 1)}
                disabled={readOnly}
                className="w-16 text-center font-bold text-blue-700 bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
              />
              <span className="font-medium text-slate-700">Người</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Trong đó, số người đang làm việc:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                value={general.workingMembers}
                onChange={(e) => handleChange('workingMembers', parseInt(e.target.value) || 0)}
                disabled={readOnly}
                className="w-16 text-center font-bold text-blue-700 bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
              />
              <span className="font-medium text-slate-700">Người</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
