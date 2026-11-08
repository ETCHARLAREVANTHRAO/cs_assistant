import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMessageProps {
  content: string;
}

// Regex to detect if strong text is a metric, unit, temperature, percentage or formula parameter
const METRIC_REGEX = /\d+(\.\d+)?\s*(°[CF]|%|m\/s|km\/h|ms|ns|s|kb|mb|gb|tb|hz|mhz|ghz|b|bytes|cycles)/i;

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  return (
    <div className="formatted-message space-y-2 selection:bg-indigo-500/20">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-4 mb-2 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-3.5 mb-1.5 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[15px] font-bold text-indigo-600 dark:text-indigo-400 mt-3 mb-1 flex items-center gap-1.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[14px] leading-relaxed text-slate-800 dark:text-slate-200 mb-2">
              {children}
            </p>
          ),
          strong: ({ children }) => {
            const text = String(children);
            // Check if it's a metric / number
            if (METRIC_REGEX.test(text) || /^(\d+(\.\d+)?|\d+-\d+)$/.test(text.trim())) {
              return (
                <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-bold font-mono bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-sm">
                  {children}
                </span>
              );
            }
            // Standard bold concept highlight
            return (
              <strong className="inline-flex items-center px-1 py-0.2 mx-0.5 rounded text-[13.5px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50">
                {children}
              </strong>
            );
          },
          em: ({ children }) => (
            <em className="text-amber-600 dark:text-amber-300 font-medium not-italic underline decoration-amber-500/40 decoration-1 underline-offset-2">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1.5 my-2 pl-1 text-[14px] text-slate-800 dark:text-slate-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-2 pl-1 text-[14px] text-slate-800 dark:text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-[14px] text-slate-800 dark:text-slate-200">
              {children}
            </li>
          ),
          blockquote: ({ children }) => {
            const text = String(children);
            const isWarning = text.includes('WARNING') || text.includes('Trap') || text.includes('⚠️');
            return (
              <blockquote
                className={`my-3 p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  isWarning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                    : 'bg-indigo-50/60 dark:bg-slate-900/60 border-indigo-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/80 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-3 border-t border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <div className="my-2.5 rounded-2xl bg-slate-950 p-4 border border-slate-800/80 overflow-x-auto text-xs font-mono text-cyan-200">
                  <pre>{children}</pre>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md font-mono text-[13px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-700 dark:text-cyan-300">
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-4 border-slate-200 dark:border-slate-800" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
