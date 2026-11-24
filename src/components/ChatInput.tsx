import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { FontSizeOption, PERSONALITY_OPTIONS, PersonalityPreset } from '../types/chat';

interface ChatInputProps {
  isGenerating: boolean;
  fontSize: FontSizeOption;
  personalityPreset: PersonalityPreset;
  onSend: (text: string) => void;
  onStop: () => void;
  onEmptyAttempt: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isGenerating,
  fontSize,
  personalityPreset,
  onSend,
  onStop,
  onEmptyAttempt,
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [value]);

  const submitMessage = () => {
    if (isGenerating) return;
    const trimmed = value.trim();
    if (!trimmed) {
      onEmptyAttempt();
      return;
    }
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const activePersonality =
    PERSONALITY_OPTIONS.find((p) => p.id === personalityPreset)?.label ??
    'Balanced Assistant';

  const inputSizeClass =
    fontSize === 'sm'
      ? 'text-[14px]'
      : fontSize === 'lg'
        ? 'text-[17px]'
        : 'text-[15.5px]';

  return (
    <div className="px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-[#0B0E14] dark:via-[#0B0E14]/95 dark:to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 p-1.5 sm:p-2 pl-3.5 sm:pl-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131823] shadow-sm focus-within:border-blue-500 dark:focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            dir="auto"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Hassnain AI..."
            aria-label="Message input"
            className={`flex-1 min-w-0 resize-none bg-transparent py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-[160px] leading-relaxed ${inputSizeClass}`}
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="shrink-0 w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Stop generating"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitMessage}
              disabled={!value.trim()}
              className="shrink-0 w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Send message"
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        <div className="mt-1.5 sm:mt-2 px-1 flex items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
          <span className="truncate hidden sm:inline">
            Enter to send · Shift + Enter for new line
          </span>
          <span className="truncate sm:hidden">
            English · اردو · Roman Urdu
          </span>
          <span className="shrink-0 truncate">Mode: {activePersonality}</span>
        </div>
      </div>
    </div>
  );
};
