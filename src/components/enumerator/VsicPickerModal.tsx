import React, { useState } from 'react';
import { Search, X, Check, Building2, Tag } from 'lucide-react';
import { VSIC_INDUSTRIES, VsicIndustry } from '../../data/vsicCodes';

interface VsicPickerModalProps {
  currentCode: string;
  onSelect: (industry: VsicIndustry) => void;
  onClose: () => void;
}

export const VsicPickerModal: React.FC<VsicPickerModalProps> = ({
  currentCode,
  onSelect,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(VSIC_INDUSTRIES.map(i => i.category)))];

  const filteredIndustries = VSIC_INDUSTRIES.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      item.code.includes(term) ||
      item.name.toLowerCase().includes(term) ||
      item.commonExamples.toLowerCase().includes(term);
    return matchCategory && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Tra Cứu Danh Mục Ngành Kinh Tế (VSIC)</h3>
              <p className="text-[11px] text-slate-300">Chuẩn hóa mã ngành cấp 4/5 theo Tổng cục Thống kê</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & filter */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Gõ từ khóa: tạp hóa, may mặc, ăn uống, mộc, sửa xe, 4711..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'Tất cả lĩnh vực' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2 divide-y divide-slate-100">
          {filteredIndustries.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Không tìm thấy mã ngành phù hợp. Hãy thử từ khóa khác.
            </div>
          ) : (
            filteredIndustries.map(ind => {
              const isSelected = ind.code === currentCode;
              return (
                <div
                  key={ind.code}
                  onClick={() => onSelect(ind)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border pt-3 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                      : 'border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                        {ind.code}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {ind.category}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
                        <Check className="w-3.5 h-3.5" /> Đang chọn
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-slate-800 text-xs mt-2 leading-relaxed">
                    {ind.name}
                  </p>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Ví dụ thực tế: <strong>{ind.commonExamples}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
