import React from 'react';

const backdropMarks = [
  { symbol: '</>', left: '7%', top: '11%', rotation: '-10deg', size: 'text-4xl' },
  { symbol: '{ }', left: '26%', top: '73%', rotation: '7deg', size: 'text-3xl' },
  { symbol: '01', left: '45%', top: '17%', rotation: '-4deg', size: 'text-2xl' },
  { symbol: 'λ', left: '63%', top: '68%', rotation: '9deg', size: 'text-4xl' },
  { symbol: '$_', left: '84%', top: '12%', rotation: '6deg', size: 'text-3xl' },
  { symbol: 'API', left: '78%', top: '46%', rotation: '-8deg', size: 'text-xl' },
  { symbol: '💻', left: '14%', top: '48%', rotation: '-6deg', size: 'text-3xl', emoji: true },
  { symbol: '⚙️', left: '91%', top: '76%', rotation: '12deg', size: 'text-3xl', emoji: true },
  { symbol: '🧩', left: '50%', top: '88%', rotation: '-7deg', size: 'text-2xl', emoji: true },
  { symbol: '☁️', left: '71%', top: '29%', rotation: '5deg', size: 'text-2xl', emoji: true },
];

export const CodingBackdrop: React.FC = () => (
  <div className="coding-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    {backdropMarks.map((mark) => (
      <span
        key={`${mark.symbol}-${mark.left}-${mark.top}`}
        className={`coding-mark absolute select-none ${mark.size} ${mark.emoji ? 'coding-mark-emoji' : ''}`}
        style={{ left: mark.left, top: mark.top, transform: `rotate(${mark.rotation})` }}
      >
        {mark.symbol}
      </span>
    ))}
  </div>
);
