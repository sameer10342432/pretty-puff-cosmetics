import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 'sm',
  showCount = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center text-[#D4AF37]">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= Math.floor(rating);
          const half = !filled && star === Math.ceil(rating) && rating % 1 >= 0.3;
          return (
            <span key={star} className="relative inline-block">
              <Star
                className={`${iconSizes[size]} ${
                  filled
                    ? 'fill-[#D4AF37] text-[#D4AF37]'
                    : half
                    ? 'fill-[#D4AF37]/50 text-[#D4AF37]'
                    : 'fill-transparent text-[#E0D5CE]'
                }`}
              />
            </span>
          );
        })}
      </div>
      {showCount && (
        <span className={`text-[#7A7478] font-normal ${textSizes[size]}`}>
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
};
