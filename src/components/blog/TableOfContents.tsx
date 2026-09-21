import React, { useState, useEffect } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import { TableOfContentItem } from '../../types/blog';

interface TableOfContentsProps {
  items: TableOfContentItem[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const headings = items.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 140;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading && heading.offsetTop <= scrollPosition) {
          setActiveId(items[i].id);
          return;
        }
      }
      if (items.length > 0) {
        setActiveId(items[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  if (items.length === 0) return null;

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <nav
      id="article-table-of-contents"
      aria-label="Table of Contents"
      className="my-8 rounded-xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5 transition-all"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2 font-serif text-base font-semibold text-stone-900">
            <List className="h-4 w-4 text-rose-600" />
            Table of Contents
          </span>
          <span className="text-stone-400 hover:text-stone-600">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
      </div>

      {isOpen && (
        <ul className="mt-4 space-y-2 border-t border-rose-100/60 pt-3 text-xs leading-relaxed">
          {items.map(item => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className={item.level === 3 ? 'pl-4' : 'pl-0'}
              >
                <a
                  href={`#${item.id}`}
                  onClick={e => scrollToSection(e, item.id)}
                  className={`block transition-colors hover:text-rose-600 ${
                    isActive
                      ? 'font-semibold text-rose-600'
                      : 'text-stone-600'
                  }`}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
};
