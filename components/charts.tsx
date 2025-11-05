import React from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

// --- Pie Chart Component ---

interface PieChartProps {
  data: { [key: string]: number };
}

export const CostBreakdownPieChart: React.FC<PieChartProps> = ({ data }) => {
  // FIX: Coerce value to number for comparison.
  const filteredData = Object.entries(data).filter(([, value]) => Number(value) > 0);
  // FIX: Coerce value to number for reduction.
  const total = filteredData.reduce((sum, [, value]) => sum + Number(value), 0);

  if (total === 0) return <div className="text-center text-slate-500">No data available for chart.</div>;

  let cumulative = 0;
  const segments = filteredData.map(([name, value]) => {
    // FIX: Coerce value to number for arithmetic operations.
    const percentage = Number(value) / total;
    const startAngle = (cumulative / total) * 360;
    // FIX: Coerce value to number for arithmetic operations.
    const endAngle = ((cumulative + Number(value)) / total) * 360;
    // FIX: Coerce value to number for arithmetic operations.
    cumulative += Number(value);
    return { name, value, percentage, startAngle, endAngle };
  });

  const getCoordinates = (percentage: number) => {
    const x = Math.cos(2 * Math.PI * percentage);
    const y = Math.sin(2 * Math.PI * percentage);
    return [x, y];
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
      <svg viewBox="-1 -1 2 2" width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((segment, index) => {
          const [startX, startY] = getCoordinates(segment.startAngle / 360);
          const [endX, endY] = getCoordinates(segment.endAngle / 360);
          const largeArcFlag = segment.percentage > 0.5 ? 1 : 0;
          const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
          return <path key={index} d={pathData} fill={COLORS[index % COLORS.length]} />;
        })}
      </svg>
      <div className="text-sm">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center mb-2">
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
            <span className="font-semibold text-slate-700 w-24">{segment.name}</span>
            <span className="text-slate-500">({(segment.percentage * 100).toFixed(1)}%)</span>
            {/* FIX: Coerce value to number before calling toLocaleString. */}
            <span className="font-medium text-slate-800 ml-auto">{Number(segment.value).toLocaleString('en-US', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0 })}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- Bar Chart Component ---

interface BarChartProps {
  data: { [key: string]: number };
}

export const CostByCategoryBarChart: React.FC<BarChartProps> = ({ data }) => {
  // FIX: Coerce values to number for filtering and sorting.
  const entries = Object.entries(data).filter(([, value]) => Number(value) > 0).sort((a,b) => Number(b[1]) - Number(a[1]));
  if (entries.length === 0) return <div className="text-center text-slate-500">No data available for chart.</div>;

  // FIX: Coerce values to number for Math.max.
  const maxValue = Math.max(...entries.map(([, value]) => Number(value)));
  const barCount = entries.length;
  const barWidth = 60;
  const gap = 20;
  const chartWidth = barCount * (barWidth + gap);

  return (
    <div className="w-full overflow-x-auto p-4">
      <svg width={chartWidth} height="250" className="mx-auto">
        {/* Bars */}
        {entries.map(([name, value], index) => {
          // FIX: Coerce value to number for arithmetic operations.
          const barHeight = (Number(value) / maxValue) * 200;
          const x = index * (barWidth + gap);
          return (
            <g key={name} className="group">
              <rect
                x={x}
                y={210 - barHeight}
                width={barWidth}
                height={barHeight}
                fill={COLORS[index % COLORS.length]}
                className="transition-opacity hover:opacity-80"
              />
               <text x={x + barWidth / 2} y={205 - barHeight} textAnchor="middle" fill="white" className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {/* FIX: Coerce value to number before calling toLocaleString. */}
                {Number(value).toLocaleString('en-US', { style: 'currency', currency: 'QAR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </text>
            </g>
          );
        })}
        {/* Labels */}
        {entries.map(([name, ], index) => {
          const x = index * (barWidth + gap) + barWidth / 2;
          return (
            <text key={name} x={x} y="225" textAnchor="middle" className="text-xs font-semibold fill-slate-600">
              {name}
            </text>
          );
        })}
      </svg>
    </div>
  );
};