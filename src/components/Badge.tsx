import React from 'react';

interface BadgeProps {
  variant?: 'sale' | 'new' | 'bestseller' | 'stock' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const variantStyles = {
    sale: 'bg-[#C24560] text-white',
    new: 'bg-[#1E1E24] text-[#FAF7F5]',
    bestseller: 'bg-[#D4AF37] text-white',
    stock: 'bg-[#3A7D44] text-white',
    neutral: 'bg-[#F5EFEB] text-[#4A4549] border border-[#EBE0D7]',
  };

  return (
    <span
      className={`inline-flex items-center justify-center text-[10px] tracking-widest font-semibold uppercase px-2.5 py-1 rounded-full shadow-xs ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
