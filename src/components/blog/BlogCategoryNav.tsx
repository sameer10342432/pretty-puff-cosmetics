import React from 'react';
import { BlogCategory } from '../../types/blog';

interface BlogCategoryNavProps {
  categories: BlogCategory[];
  activeCategorySlug: string;
  onSelectCategory: (slug: string) => void;
}

export const BlogCategoryNav: React.FC<BlogCategoryNavProps> = ({
  categories,
  activeCategorySlug,
  onSelectCategory,
}) => {
  return (
    <nav
      id="blog-category-navigation"
      aria-label="Blog categories"
      className="relative flex items-center border-b border-stone-200"
    >
      <div className="no-scrollbar flex w-full gap-2 overflow-x-auto py-3">
        {categories.map(cat => {
          const isActive = activeCategorySlug.toLowerCase() === cat.slug.toLowerCase();
          return (
            <button
              key={cat.id}
              id={`blog-category-tab-${cat.slug}`}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <span>{cat.name}</span>
              {typeof cat.count === 'number' && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
