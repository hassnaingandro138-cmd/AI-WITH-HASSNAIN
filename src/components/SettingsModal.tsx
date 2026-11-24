import React, { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Moon,
  RefreshCw,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import {
  AppSettings,
  FontSizeOption,
  HealthStatus,
  PERSONALITY_OPTIONS,
  PersonalityPreset,
} from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  healthStatus: HealthStatus;
  isCheckingHealth: boolean;
  chatCount: number;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onCheckHealth: () => void;
  onRequestClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  healthStatus,
  isCheckingHealth,
  chatCount,
  onClose,
  onUpdateSettings,
  onCheckHealth,
  onRequestClearAllChats,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fontSizes: Array<{ id: FontSizeOption; label: string }> = [
    { id: 'sm', label: 'Small' },
    { id: 'md', label: 'Medium' },
    { id: 'lg', label: 'Large' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131823] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="settings-modal-title"
            className="font-display text-lg font-semibold text-slate-900 dark:text-white"
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6">
          {/* Appearance */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Appearance
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Theme
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between dark and light interface
                </div>
              </div>
              <div className="flex items-center self-start sm:self-auto gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0D1119] border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                    settings.theme === 'dark'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                    settings.theme === 'light'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Message Font Size
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust text size in chat conversations
                </div>
              </div>
              <div className="flex items-center self-start sm:self-auto gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0D1119] border border-slate-200 dark:border-slate-800">
                {fontSizes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: item.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                      settings.fontSize === item.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Response Speed
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Instant replies by default, or deep reasoning mode
                </div>
              </div>
              <div className="flex items-center self-start sm:self-auto gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0D1119] border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ responseSpeed: 'fast' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                    settings.responseSpeed === 'fast'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Fast
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ responseSpeed: 'smart' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                    settings.responseSpeed === 'smart'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Deep
                </button>
              </div>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Personality */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Chatbot Personality
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Choose how HASSNAIN AI structures responses and tone.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERSONALITY_OPTIONS.map((option) => {
                const selected = settings.personalityPreset === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        personalityPreset: option.id as PersonalityPreset,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <label
                htmlFor="custom-personality-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Custom Instructions (Optional)
              </label>
              <textarea
                id="custom-personality-input"
                rows={3}
                maxLength={1000}
                value={settings.customInstructions}
                onChange={(e) =>
                  onUpdateSettings({ customInstructions: e.target.value })
                }
                placeholder="Example: Always give short real-world examples, or explain technical terms in simple Roman Urdu..."
                className="w-full rounded-xl p-3 text-sm bg-slate-50 dark:bg-[#0D1119] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
              />
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* API Connection Status */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                API Connection Status
              </h3>
              <button
                type="button"
                onClick={onCheckHealth}
                disabled={isCheckingHealth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`}
                />
                <span>Check Status</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D1119] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {healthStatus.status === 'connected' ? (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {healthStatus.status === 'connected'
                      ? 'Connected to Gemini API'
                      : healthStatus.status === 'missing_key'
                        ? 'Gemini API Key Not Configured'
                        : 'Server Unreachable'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Model: {healthStatus.model} · Server-side proxy active
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Data Management & Info */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Chat History Storage
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {chatCount} saved {chatCount === 1 ? 'conversation' : 'conversations'} in browser LocalStorage
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestClearAllChats}
                disabled={chatCount === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D1119] text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-900 dark:text-slate-200 mb-1">
                About HASSNAIN AI
              </div>
              HASSNAIN AI is a multilingual smart assistant supporting English, Urdu (اردو), and Roman Urdu with automatic language detection, Markdown code highlighting, and persistent local conversation storage.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
