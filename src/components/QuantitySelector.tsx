import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  const btnWidths = {
    sm: 'w-7',
    md: 'w-9',
    lg: 'w-11',
  };

  return (
    <div
      className={`inline-flex items-center border border-[#E0D5CE] rounded-full bg-white overflow-hidden shadow-xs select-none ${sizeStyles[size]} ${className}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`h-full ${btnWidths[size]} flex items-center justify-center text-[#4A4549] hover:bg-[#F5EFEB] disabled:opacity-30 disabled:hover:bg-transparent transition-colors`}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="px-3 min-w-[2.5rem] text-center font-medium text-[#1E1E24]">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`h-full ${btnWidths[size]} flex items-center justify-center text-[#4A4549] hover:bg-[#F5EFEB] disabled:opacity-30 disabled:hover:bg-transparent transition-colors`}
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
