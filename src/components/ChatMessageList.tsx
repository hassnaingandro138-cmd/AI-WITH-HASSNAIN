import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  Check,
  Copy,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, FontSizeOption } from '../types/chat';
import { formatMessageTime } from '../utils/storage';
import { HassnainLogo } from './HassnainLogo';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  fontSize: FontSizeOption;
  onCopyMessage: (content: string) => void;
  onCopyCode: (message: string) => void;
  onRegenerate: (assistantMessageId: string) => void;
  onRetryLastError: () => void;
}

interface MessageRowProps {
  msg: ChatMessage;
  isLastMessage: boolean;
  isGenerating: boolean;
  fontSize: FontSizeOption;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
  onCopyCode: (message: string) => void;
  onRegenerate: (assistantMessageId: string) => void;
  onRetryLastError: () => void;
}

const MessageRow = React.memo<MessageRowProps>(
  ({
    msg,
    isLastMessage,
    isGenerating,
    fontSize,
    copiedId,
    onCopy,
    onCopyCode,
    onRegenerate,
    onRetryLastError,
  }) => {
    const isUser = msg.role === 'user';
    const isStreamingPlaceholder =
      !isUser && isLastMessage && isGenerating && msg.content.length === 0;

    const userFontClass =
      fontSize === 'sm'
        ? 'text-[14px] leading-[1.6]'
        : fontSize === 'lg'
          ? 'text-[17px] leading-[1.7]'
          : 'text-[15.5px] leading-[1.65]';

    if (isUser) {
      return (
        <div className="flex flex-col items-end group">
          <div className="max-w-[90%] sm:max-w-[78%] rounded-2xl rounded-tr-sm bg-blue-600 dark:bg-[#1B2A4A] text-white dark:text-slate-100 px-3.5 sm:px-4 py-2.5 sm:py-3 border border-blue-500/20 dark:border-blue-500/25 shadow-xs">
            <p
              dir="auto"
              className={`${userFontClass} whitespace-pre-wrap break-words m-0`}
            >
              {msg.content}
            </p>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            <button
              type="button"
              onClick={() => onCopy(msg.id, msg.content)}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 inline-flex items-center gap-1 px-2 py-1 rounded hover:text-slate-700 dark:hover:text-slate-200 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[32px]"
              aria-label="Copy message"
            >
              {copiedId === msg.id ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <span>{formatMessageTime(msg.timestamp)}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2.5 sm:gap-4 group min-w-0">
        <HassnainLogo size="sm" className="mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              HASSNAIN AI
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              {formatMessageTime(msg.timestamp)}
            </span>
          </div>

          {isStreamingPlaceholder ? (
            <div
              className="inline-flex items-center gap-1.5 py-2"
              aria-label="Hassnain AI is typing"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 typing-dot" />
              <span className="w-2 h-2 rounded-full bg-blue-500 typing-dot" />
              <span className="w-2 h-2 rounded-full bg-blue-500 typing-dot" />
            </div>
          ) : msg.isError ? (
            <div className="rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3.5 sm:p-4 text-sm text-red-800 dark:text-red-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0 space-y-2.5">
                  <p className="m-0 leading-relaxed break-words">{msg.content}</p>
                  <button
                    type="button"
                    onClick={onRetryLastError}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 min-h-[36px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <MarkdownRenderer
                content={msg.content}
                fontSize={fontSize}
                onCopyCode={onCopyCode}
              />

              {!(isLastMessage && isGenerating) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onCopy(msg.id, msg.content)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[36px]"
                    aria-label="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRegenerate(msg.id)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 min-h-[36px]"
                    aria-label="Regenerate response"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

MessageRow.displayName = 'MessageRow';

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isGenerating,
  fontSize,
  onCopyMessage,
  onCopyCode,
  onRegenerate,
  onRetryLastError,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const userScrolledUpRef = useRef(false);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    userScrolledUpRef.current = !isNearBottom;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomAnchorRef.current?.scrollIntoView({
        behavior: isGenerating ? 'auto' : 'smooth',
      });
    }
  }, [messages, isGenerating]);

  const scrollToBottom = () => {
    userScrolledUpRef.current = false;
    setShowScrollButton(false);
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopy = async (id: string, text: string) => {
    await onCopyMessage(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 sm:px-6 py-4 sm:py-6"
      >
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
          {messages.map((msg, idx) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              isLastMessage={idx === messages.length - 1}
              isGenerating={isGenerating}
              fontSize={fontSize}
              copiedId={copiedId === msg.id ? msg.id : null}
              onCopy={handleCopy}
              onCopyCode={onCopyCode}
              onRegenerate={onRegenerate}
              onRetryLastError={onRetryLastError}
            />
          ))}
          <div ref={bottomAnchorRef} className="h-2" />
        </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161C28] text-xs font-medium text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[36px]"
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Latest</span>
        </button>
      )}
    </div>
  );
};
