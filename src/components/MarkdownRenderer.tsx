import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import { Check, Copy, Terminal } from 'lucide-react';
import { FontSizeOption } from '../types/chat';

interface MarkdownRendererProps {
  content: string;
  fontSize: FontSizeOption;
  onCopyCode?: (message: string) => void;
}

interface HighlightNode {
  type: 'text' | 'span';
  text?: string;
  className?: string;
  children?: HighlightNode[];
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseHljsHtmlToNodes(html: string): HighlightNode[] {
  const root: HighlightNode[] = [];
  const stack: HighlightNode[][] = [root];
  const tokenRegex = /<span class="([^"]+)">|<\/span>|([^<]+)/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(html)) !== null) {
    const currentChildren = stack[stack.length - 1];
    if (match[1]) {
      const node: HighlightNode = {
        type: 'span',
        className: match[1],
        children: [],
      };
      currentChildren.push(node);
      stack.push(node.children!);
    } else if (match[0] === '</span>') {
      if (stack.length > 1) {
        stack.pop();
      }
    } else if (match[2]) {
      currentChildren.push({
        type: 'text',
        text: decodeHtmlEntities(match[2]),
      });
    }
  }

  return root;
}

function renderHighlightNodes(
  nodes: HighlightNode[],
  keyPrefix: string
): React.ReactNode {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}_${index}`;
    if (node.type === 'text') {
      return <React.Fragment key={key}>{node.text}</React.Fragment>;
    }
    return (
      <span key={key} className={node.className}>
        {node.children ? renderHighlightNodes(node.children, key) : null}
      </span>
    );
  });
}

function isSafeUrl(href?: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:'
    );
  } catch {
    return false;
  }
}

interface CodeBlockProps {
  language: string;
  code: string;
  onCopyCode?: (message: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code,
  onCopyCode,
}) => {
  const [copied, setCopied] = useState(false);

  const highlightedNodes = useMemo(() => {
    try {
      const result =
        language && hljs.getLanguage(language)
          ? hljs.highlight(code, { language, ignoreIllegals: true })
          : hljs.highlightAuto(code);
      return parseHljsHtmlToNodes(result.value);
    } catch {
      return [{ type: 'text', text: code }] as HighlightNode[];
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopyCode?.('Code copied to clipboard');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onCopyCode?.('Unable to copy code');
    }
  };

  return (
    <div className="my-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E131B] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-[#141A24]">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <Terminal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="lowercase">{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap shrink-0"
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[13px] leading-relaxed font-mono">
        <pre className="m-0">
          <code className="hljs">{renderHighlightNodes(highlightedNodes, 'c')}</code>
        </pre>
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  fontSize,
  onCopyCode,
}) => {
  const sizeClass =
    fontSize === 'sm'
      ? 'text-[14px] leading-[1.6]'
      : fontSize === 'lg'
        ? 'text-[17px] leading-[1.7]'
        : 'text-[15.5px] leading-[1.65]';

  return (
    <div
      dir="auto"
      className={`${sizeClass} text-slate-800 dark:text-slate-100 break-words space-y-3`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white mt-4 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-3 mb-1.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p dir="auto" className="my-0 leading-[inherit]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul dir="auto" className="list-disc ps-5 space-y-1.5 my-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol dir="auto" className="list-decimal ps-5 space-y-1.5 my-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li dir="auto" className="leading-[inherit]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 px-4 py-2.5 text-slate-700 dark:text-slate-300 italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            if (!isSafeUrl(href)) {
              return <span className="underline">{children}</span>;
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {children}
              </a>
            );
          },
          hr: () => (
            <hr className="my-4 border-slate-200 dark:border-slate-800" />
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-sm tabular-nums">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 font-semibold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 border-b border-slate-200/70 dark:border-slate-800/80">
              {children}
            </td>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-([\w-]+)/.exec(className || '');
            const rawCode = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || rawCode.includes('\n');

            if (isBlock) {
              return (
                <CodeBlock
                  language={match?.[1] || ''}
                  code={rawCode}
                  onCopyCode={onCopyCode}
                />
              );
            }

            return (
              <code
                {...props}
                className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-blue-300 font-mono text-[0.875em]"
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
