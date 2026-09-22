import React from 'react';

interface PriceDisplayProps {
  price: number;
  salePrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDiscountPercent?: boolean;
  className?: string;
}

export const formatPKR = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rs. 0';
  }
  const num = Number(amount);
  return `Rs. ${num.toLocaleString('en-PK')}`;
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  salePrice,
  size = 'md',
  showDiscountPercent = true,
  className = '',
}) => {
  const isSale = salePrice !== undefined && salePrice < price;
  const currentPrice = isSale ? salePrice : price;
  const discountPercent = isSale ? Math.round(((price - salePrice) / price) * 100) : 0;

  const currentStyles = {
    sm: 'text-sm font-semibold text-[#1E1E24]',
    md: 'text-base font-semibold text-[#1E1E24]',
    lg: 'text-xl font-bold text-[#1E1E24]',
    xl: 'text-2xl lg:text-3xl font-bold text-[#1E1E24]',
  };

  const originalStyles = {
    sm: 'text-xs text-[#8C868A] line-through',
    md: 'text-sm text-[#8C868A] line-through',
    lg: 'text-base text-[#8C868A] line-through',
    xl: 'text-lg text-[#8C868A] line-through',
  };

  return (
    <div className={`flex items-baseline flex-wrap gap-2 ${className}`}>
      <span className={currentStyles[size]}>{formatPKR(currentPrice)}</span>
      {isSale && (
        <>
          <span className={originalStyles[size]}>{formatPKR(price)}</span>
          {showDiscountPercent && (
            <span className="text-[11px] font-semibold text-[#C24560] bg-[#FDF0F2] px-1.5 py-0.5 rounded tracking-tight">
              -{discountPercent}%
            </span>
          )}
        </>
      )}
    </div>
  );
};
