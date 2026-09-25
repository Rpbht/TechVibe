import React from 'react';
import {
  Atom,
  BookOpen,
  Boxes,
  Braces,
  Coffee,
  Cpu,
  Database,
  FileCode2,
  Globe,
  Leaf,
  Network,
  Server,
  Terminal,
} from 'lucide-react';

const categorySymbols = [
  { Icon: BookOpen, left: '6%', top: '15%', size: 30, rotation: '-8deg', tone: 'violet' },
  { Icon: Coffee, left: '17%', top: '78%', size: 34, rotation: '7deg', tone: 'cyan' },
  { Icon: Leaf, left: '32%', top: '66%', size: 28, rotation: '-12deg', tone: 'violet' },
  { Icon: Atom, left: '48%', top: '84%', size: 38, rotation: '8deg', tone: 'cyan' },
  { Icon: Braces, left: '65%', top: '69%', size: 31, rotation: '-6deg', tone: 'violet' },
  { Icon: Globe, left: '83%', top: '84%', size: 36, rotation: '10deg', tone: 'cyan' },
  { Icon: FileCode2, left: '95%', top: '18%', size: 27, rotation: '-9deg', tone: 'violet' },
  { Icon: Server, left: '8%', top: '50%', size: 27, rotation: '9deg', tone: 'cyan' },
  { Icon: Terminal, left: '25%', top: '91%', size: 28, rotation: '-5deg', tone: 'violet' },
  { Icon: Cpu, left: '47%', top: '55%', size: 31, rotation: '6deg', tone: 'cyan' },
  { Icon: Boxes, left: '64%', top: '92%', size: 33, rotation: '-10deg', tone: 'violet' },
  { Icon: Database, left: '80%', top: '54%', size: 30, rotation: '7deg', tone: 'cyan' },
  { Icon: Network, left: '94%', top: '66%', size: 34, rotation: '-7deg', tone: 'violet' },
];

export const CodingBackdrop: React.FC = () => (
  <div className="coding-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="category-symbol-field absolute inset-0">
      {categorySymbols.map(({ Icon, left, top, size, rotation, tone }) => (
        <span
          key={`${Icon.displayName ?? Icon.name}-${left}-${top}`}
          className={`category-symbol category-symbol-${tone} absolute flex items-center justify-center`}
          style={{ left, top, transform: `translate(-50%, -50%) rotate(${rotation})` }}
        >
          <Icon size={size} strokeWidth={1.35} />
        </span>
      ))}
    </div>
  </div>
);
