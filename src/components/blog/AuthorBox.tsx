import React from 'react';
import { Sparkles } from 'lucide-react';
import { BlogAuthor } from '../../types/blog';

interface AuthorBoxProps {
  author: BlogAuthor;
}

export const AuthorBox: React.FC<AuthorBoxProps> = ({ author }) => {
  return (
    <aside
      id="article-author-box"
      aria-label="About the author"
      className="my-10 rounded-2xl border border-rose-100 bg-linear-to-br from-rose-50/50 via-white to-stone-50 p-6 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <img
            src={author.avatar}
            alt={author.name}
            className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-xs"
          />
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-rose-600 uppercase">
              Written by Pretty Puff Editorial Team
            </span>
          </div>
          <h4 className="mt-0.5 font-serif text-lg font-bold text-stone-900">
            {author.name}
          </h4>
          <p className="text-xs text-stone-500">{author.role}</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">
            {author.bio}
          </p>
        </div>
      </div>
    </aside>
  );
};
