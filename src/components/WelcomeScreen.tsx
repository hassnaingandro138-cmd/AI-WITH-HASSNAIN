import React from 'react';
import { ArrowUpRight, BookOpen, Code2, Lightbulb, PenLine } from 'lucide-react';
import { HassnainLogo } from './HassnainLogo';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

interface SuggestionItem {
  title: string;
  subtitle: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    title: 'Write something for me',
    subtitle: 'Draft an email, essay, or message in English or Urdu',
    prompt:
      'Write a clear, polite, and professional email requesting a project deadline extension by three days.',
    icon: PenLine,
  },
  {
    title: 'Help me with coding',
    subtitle: 'Debug code, build features, or review architecture',
    prompt:
      'Write a clean TypeScript React custom hook for debounced search input with proper cleanup.',
    icon: Code2,
  },
  {
    title: 'Explain something',
    subtitle: 'Break down complex concepts into clear steps',
    prompt:
      'Explain how DNS resolution works from typing a URL to loading a webpage in simple, step-by-step terms.',
    icon: BookOpen,
  },
  {
    title: 'Generate ideas',
    subtitle: 'Brainstorm projects, study plans, or creative angles',
    prompt:
      'Give me 5 practical full-stack portfolio project ideas that solve real everyday problems for students.',
    icon: Lightbulb,
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
}) => {
  return (
    <div className="my-auto flex flex-col items-center justify-center px-3.5 sm:px-6 py-4 sm:py-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        <HassnainLogo size="lg" className="mb-3.5 sm:mb-4 shadow-md" />

        <h1 className="font-display text-xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance max-w-lg px-1">
          Hey! I&apos;m Hassnain AI. How can I help you today?
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <span>English</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>اردو</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>Roman Urdu</span>
        </p>

        <div className="mt-6 sm:mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-left">
          {SUGGESTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onSelectPrompt(item.prompt)}
                className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131823] hover:bg-slate-50 dark:hover:bg-[#171D2B] hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-left min-h-[44px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2.5 sm:mt-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
