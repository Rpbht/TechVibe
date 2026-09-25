import React from 'react';

const networkPaths = [
  'M -90 662 C 132 530 252 736 438 624 S 822 550 1290 704',
  'M -120 252 C 146 402 302 154 548 316 S 918 430 1280 214',
  'M 1018 -92 C 858 176 1084 348 916 532 S 754 722 824 894',
  'M 86 -70 C 204 186 24 354 218 526 S 444 690 326 886',
];

const networkNodes = [
  { label: '</>', x: 112, y: 638, tone: 'violet' },
  { label: '{ }', x: 318, y: 646, tone: 'cyan' },
  { label: 'API', x: 518, y: 612, tone: 'violet' },
  { label: 'DB', x: 728, y: 622, tone: 'cyan' },
  { label: 'λ', x: 946, y: 642, tone: 'violet' },
  { label: '01', x: 1114, y: 688, tone: 'cyan' },
];

export const CodingBackdrop: React.FC = () => (
  <div className="coding-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <svg
      className="coding-network absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <g className="coding-network-routes">
        {networkPaths.map((path, index) => (
          <React.Fragment key={path}>
            <path className="coding-route" d={path} pathLength="100" />
            <path
              className={`coding-flow coding-flow-${(index % 3) + 1}`}
              d={path}
              pathLength="100"
            />
          </React.Fragment>
        ))}
      </g>

      <g className="coding-network-nodes">
        {networkNodes.map((node, index) => (
          <g
            key={node.label}
            className={`coding-node coding-node-${node.tone}`}
            transform={`translate(${node.x} ${node.y})`}
            style={{ '--node-delay': `${index * -0.7}s` } as React.CSSProperties}
          >
            <circle className="coding-node-ring" r="25" />
            <circle className="coding-node-core" r="4" />
            <text className="coding-node-label" x="0" y="-35" textAnchor="middle">
              {node.label}
            </text>
          </g>
        ))}
      </g>

      <g className="coding-code-lines">
        <text x="76" y="752">const pipeline = ['build', 'test', 'scale'];</text>
        <text className="coding-code-line-secondary" x="748" y="764">
          await deploy({'{ status: \'healthy\' }'});
        </text>
      </g>
    </svg>
  </div>
);
