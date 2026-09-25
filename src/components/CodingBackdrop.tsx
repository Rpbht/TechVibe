import React from 'react';

const backdropMarks = [
  { symbol: '</>', left: '7%', top: '11%', rotation: '-10deg', size: 'text-4xl', driftX: '22px', driftY: '-18px', duration: '19s', delay: '-8s' },
  { symbol: '{ }', left: '26%', top: '73%', rotation: '7deg', size: 'text-3xl', driftX: '-18px', driftY: '24px', duration: '23s', delay: '-15s' },
  { symbol: '01', left: '45%', top: '17%', rotation: '-4deg', size: 'text-2xl', driftX: '14px', driftY: '21px', duration: '17s', delay: '-4s' },
  { symbol: 'λ', left: '63%', top: '68%', rotation: '9deg', size: 'text-4xl', driftX: '-24px', driftY: '-16px', duration: '26s', delay: '-19s' },
  { symbol: '$_', left: '84%', top: '12%', rotation: '6deg', size: 'text-3xl', driftX: '18px', driftY: '28px', duration: '21s', delay: '-11s' },
  { symbol: 'API', left: '78%', top: '46%', rotation: '-8deg', size: 'text-xl', driftX: '-26px', driftY: '12px', duration: '24s', delay: '-6s' },
  { symbol: '💻', left: '14%', top: '48%', rotation: '-6deg', size: 'text-3xl', driftX: '17px', driftY: '20px', duration: '20s', delay: '-13s', emoji: true },
  { symbol: '⚙️', left: '91%', top: '76%', rotation: '12deg', size: 'text-3xl', driftX: '-20px', driftY: '-22px', duration: '25s', delay: '-3s', emoji: true },
  { symbol: '🧩', left: '50%', top: '88%', rotation: '-7deg', size: 'text-2xl', driftX: '28px', driftY: '-14px', duration: '22s', delay: '-17s', emoji: true },
  { symbol: '☁️', left: '71%', top: '29%', rotation: '5deg', size: 'text-2xl', driftX: '-15px', driftY: '24px', duration: '18s', delay: '-9s', emoji: true },
];

export const CodingBackdrop: React.FC = () => (
  <div className="coding-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    {backdropMarks.map((mark) => (
      <span
        key={`${mark.symbol}-${mark.left}-${mark.top}`}
        className={`coding-mark absolute select-none ${mark.size} ${mark.emoji ? 'coding-mark-emoji' : ''}`}
        style={{
          left: mark.left,
          top: mark.top,
          '--coding-rotation': mark.rotation,
          '--coding-drift-x': mark.driftX,
          '--coding-drift-y': mark.driftY,
          '--coding-duration': mark.duration,
          '--coding-delay': mark.delay,
        } as React.CSSProperties}
      >
        <span className="coding-mark-glyph">{mark.symbol}</span>
      </span>
    ))}
  </div>
);
