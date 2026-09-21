import React from 'react';
import { formatPKR } from '../../components/PriceDisplay';

interface SalesChartProps {
  data: { date: string; sales: number; orders: number }[];
}

export const SalesTrendChart: React.FC<SalesChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        No sales data recorded yet for this period.
      </div>
    );
  }

  const maxSales = Math.max(...data.map(d => d.sales), 1000);
  const height = 220;
  const width = 600;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (width - 2 * padding);
    const y = height - padding - (d.sales / maxSales) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C24560" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#C24560" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = height - padding - ratio * (height - 2 * padding);
          const val = Math.round(ratio * maxSales);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#F0E6DE"
                strokeDasharray="4 4"
              />
              <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-gray-400">
                {val >= 1000 ? `${Math.round(val / 1000)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        <path d={areaD} fill="url(#salesGradient)" />

        {/* Main Line */}
        <path d={pathD} fill="none" stroke="#C24560" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points & X labels */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke="#C24560" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="8" fill="#C24560" opacity="0" className="group-hover:opacity-20 transition-opacity" />

            <text x={p.x} y={height - 15} textAnchor="middle" className="text-[10px] fill-gray-500 font-sans">
              {p.date.split(',')[0]}
            </text>

            {/* Hover Tooltip */}
            <title>{`${p.date}: ${formatPKR(p.sales)} (${p.orders} orders)`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

export const CategoryBreakdownChart: React.FC<{ data: { category: string; count: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-400 py-8 text-center">No categories recorded.</div>;
  }

  const total = data.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const colors = ['#C24560', '#D4AF37', '#93587E', '#3D7068', '#DF8296', '#6F5C72'];

  return (
    <div className="space-y-3.5">
      {data.map((item, index) => {
        const percentage = Math.round((item.count / total) * 100);
        const color = colors[index % colors.length];
        return (
          <div key={item.category} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-700">{item.category}</span>
              <span className="text-gray-500">{item.count} items ({percentage}%)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
