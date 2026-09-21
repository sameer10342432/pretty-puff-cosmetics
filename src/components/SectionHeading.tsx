import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  tag?: string;
  align?: 'left' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  tag,
  align = 'center',
  action,
  className = '',
}) => {
  return (
    <div
      className={`mb-10 lg:mb-12 ${
        align === 'center'
          ? 'text-center max-w-2xl mx-auto'
          : 'flex flex-col md:flex-row md:items-end md:justify-between'
      } ${className}`}
    >
      <div>
        {tag && (
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#C24560] mb-2 font-sans">
            {tag}
          </span>
        )}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#1E1E24] tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-base text-[#686266] leading-relaxed font-sans max-w-xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-4 md:mt-0">
          <button
            onClick={action.onClick}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#1E1E24] hover:text-[#C24560] transition-colors pb-1 border-b border-[#1E1E24] hover:border-[#C24560]"
          >
            <span>{action.label}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      )}
    </div>
  );
};
