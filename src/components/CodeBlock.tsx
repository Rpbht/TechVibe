import React, { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';

import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';

interface CodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const lines = code.trim().split('\n');
  const normalizedLang = language.toLowerCase() === 'golang' ? 'go' : language.toLowerCase();

  return (
    <div className="relative my-3 overflow-hidden rounded-lg border border-zinc-800 bg-[#0d0e12]">
      {/* Slim Header */}
      <div className="flex h-8 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-3 text-xs text-zinc-400">
        <span className="font-mono text-[11px] font-semibold text-zinc-300 uppercase">
          {language}
        </span>

        <button
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code with Line Numbers */}
      <div className="flex overflow-x-auto p-3.5 text-xs font-mono leading-relaxed">
        <div className="select-none pr-3.5 text-right font-mono text-zinc-600">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>
        <pre className="!bg-transparent !p-0 !m-0 !border-0 flex-1 overflow-visible">
          <code className={`language-${normalizedLang} !bg-transparent text-zinc-200 text-xs`}>
            {code.trim()}
          </code>
        </pre>
      </div>
    </div>
  );
};
