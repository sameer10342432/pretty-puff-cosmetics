import React from 'react';
import { Search, X } from 'lucide-react';

interface BlogSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount?: number;
}

export const BlogSearch: React.FC<BlogSearchProps> = ({
  searchQuery,
  onSearchChange,
  resultCount,
}) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-stone-400" />
        <input
          id="blog-search-input"
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search beauty articles, tutorials, ingredients..."
          className="w-full rounded-full border border-stone-200 bg-stone-50/70 py-2.5 pr-10 pl-10 text-xs text-stone-900 placeholder:text-stone-400 transition-all focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-200/50 focus:outline-hidden"
        />
        {searchQuery && (
          <button
            id="blog-search-clear-btn"
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3.5 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searchQuery && typeof resultCount === 'number' && (
        <p className="mt-1.5 px-3 text-[11px] text-stone-500">
          Showing {resultCount} {resultCount === 1 ? 'article' : 'articles'} for &ldquo;{searchQuery}&rdquo;
        </p>
      )}
    </div>
  );
};
