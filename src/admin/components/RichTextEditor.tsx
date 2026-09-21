import React, { useState } from 'react';
import {
  Heading,
  AlignLeft,
  List,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { BlogContentSection } from '../../types/blog';

interface RichTextEditorProps {
  sections: BlogContentSection[];
  onChange: (sections: BlogContentSection[]) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ sections, onChange }) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sections[0]?.id || null);

  const addSection = () => {
    const newSection: BlogContentSection = {
      id: `section-${Date.now()}`,
      heading: 'New Article Section',
      level: 2,
      paragraphs: ['Write detailed beauty insights, application tips, or cosmetic science here.'],
    };
    const updated = [...sections, newSection];
    onChange(updated);
    setActiveSectionId(newSection.id);
  };

  const removeSection = (id: string) => {
    const filtered = sections.filter(s => s.id !== id);
    onChange(filtered);
    if (activeSectionId === id) {
      setActiveSectionId(filtered[0]?.id || null);
    }
  };

  const updateSection = (id: string, updates: Partial<BlogContentSection>) => {
    const updated = sections.map(s => (s.id === id ? { ...s, ...updates } : s));
    onChange(updated);
  };

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  return (
    <div className="space-y-4 border border-[#EBE0D7] rounded-2xl bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#F0E6DE] pb-4">
        <div>
          <h3 className="font-serif text-lg text-[#1E1E24]">Article Content Builder</h3>
          <p className="text-xs text-[#7A7478]">
            Structure your article with headings, paragraphs, beauty callouts, tips, and tables.
          </p>
        </div>
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1E1E24] hover:bg-[#C24560] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Section Selectors */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sections.map((s, index) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSectionId(s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap border transition-colors ${
              activeSectionId === s.id
                ? 'bg-[#FDF0F2] text-[#C24560] border-[#F8CAD1]'
                : 'bg-[#FAF7F5] text-gray-600 border-[#EBE0D7] hover:bg-gray-100'
            }`}
          >
            {index + 1}. {s.heading.slice(0, 20) || 'Section'}...
          </button>
        ))}
      </div>

      {activeSection ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Section Heading
              </label>
              <input
                type="text"
                value={activeSection.heading}
                onChange={e => updateSection(activeSection.id, { heading: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0D5CE] rounded-lg focus:outline-none focus:border-[#C24560]"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Heading Level
              </label>
              <select
                value={activeSection.level}
                onChange={e => updateSection(activeSection.id, { level: Number(e.target.value) as 2 | 3 })}
                className="w-full px-3 py-2 text-sm border border-[#E0D5CE] rounded-lg focus:outline-none focus:border-[#C24560] bg-white"
              >
                <option value={2}>H2 Heading</option>
                <option value={3}>H3 Subheading</option>
              </select>
            </div>
            {sections.length > 1 && (
              <button
                type="button"
                onClick={() => removeSection(activeSection.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
                title="Remove Section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Paragraphs Editor */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Paragraphs (Separate by double enter)
            </label>
            <textarea
              rows={4}
              value={activeSection.paragraphs.join('\n\n')}
              onChange={e =>
                updateSection(activeSection.id, {
                  paragraphs: e.target.value.split('\n\n').filter(p => p.trim() !== ''),
                })
              }
              placeholder="Write section narrative..."
              className="w-full px-3 py-2 text-sm border border-[#E0D5CE] rounded-lg focus:outline-none focus:border-[#C24560]"
            />
          </div>

          {/* Quote */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-[#C24560]" />
              <span>Editorial Quote (Optional)</span>
            </label>
            <input
              type="text"
              value={activeSection.quote || ''}
              onChange={e => updateSection(activeSection.id, { quote: e.target.value || undefined })}
              placeholder="e.g. 'Healthy skin doesn't happen overnight, it requires daily barrier love.'"
              className="w-full px-3 py-2 text-sm border border-[#E0D5CE] rounded-lg focus:outline-none focus:border-[#C24560]"
            />
          </div>

          {/* Callout Tip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF7F5] p-3 rounded-xl border border-[#F0E6DE]">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Beauty Tip Title</span>
              </label>
              <input
                type="text"
                value={activeSection.tip?.title || ''}
                onChange={e =>
                  updateSection(activeSection.id, {
                    tip: {
                      title: e.target.value,
                      text: activeSection.tip?.text || '',
                    },
                  })
                }
                placeholder="e.g. Pro Makeup Artist Tip"
                className="w-full px-3 py-1.5 text-xs border border-[#E0D5CE] rounded-lg focus:outline-none focus:border-[#C24560] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tip Advice
              </label>
              <input
                type="text"
                value={activeSection.tip?.text || ''}
                onChange={e =>
                  updateSection(activeSection.id, {
                    tip: {
                      title: activeSection.tip?.title || 'Beauty Tip',
                      text: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Dampen your makeup sponge with setting spray instead of plain water."
                className="w-full px-3 py-1.5 text-xs border border-[#E0D5CE] rounded-lg focus:outline-none focus:border-[#C24560] bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
