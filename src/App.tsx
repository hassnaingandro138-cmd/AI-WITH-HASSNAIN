import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Eraser,
  Menu,
  Moon,
  PanelLeftOpen,
  Plus,
  Settings,
  Sun,
} from 'lucide-react';
import { ChatInput } from './components/ChatInput';
import { ChatMessageList } from './components/ChatMessageList';
import { ConfirmModal } from './components/ConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { WelcomeScreen } from './components/WelcomeScreen';
import {
  AppSettings,
  ChatMessage,
  ChatSession,
  HealthStatus,
  ToastItem,
} from './types/chat';
import {
  createId,
  deriveChatTitle,
  loadActiveChatId,
  loadChats,
  loadSettings,
  saveActiveChatId,
  saveChats,
  saveSettings,
} from './utils/storage';

type ConfirmAction =
  | { type: 'delete-chat'; chatId: string; title: string }
  | { type: 'delete-all' }
  | { type: 'clear-current'; chatId: string };

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>(() => loadChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const savedId = loadActiveChatId();
    const initialChats = loadChats();
    if (savedId && initialChats.some((c) => c.id === savedId)) {
      return savedId;
    }
    return null;
  });

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    ok: true,
    configured: true,
    model: 'gemini-3.1-flash-lite',
    status: 'connected',
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const addToast = useCallback(
    (message: string, variant: ToastItem['variant'] = 'success') => {
      const id = createId('toast');
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync theme class on <html> and persist settings
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveSettings(settings);
  }, [settings]);

  // Persist chats to LocalStorage (debounced during active streaming for instant UI)
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  useEffect(() => {
    if (!isGenerating) {
      saveChats(chats);
      return;
    }
    const timer = setTimeout(() => {
      saveChats(chatsRef.current);
    }, 600);
    return () => clearTimeout(timer);
  }, [chats, isGenerating]);

  useEffect(() => {
    const flushOnUnload = () => saveChats(chatsRef.current);
    window.addEventListener('beforeunload', flushOnUnload);
    return () => window.removeEventListener('beforeunload', flushOnUnload);
  }, []);

  // Persist active chat pointer
  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('Health check failed');
      }
      const data = (await res.json()) as Partial<HealthStatus>;
      if (typeof data.configured !== 'boolean' || !data.status) {
        throw new Error('Invalid health payload');
      }
      setHealthStatus({
        ok: Boolean(data.ok),
        configured: data.configured,
        model: data.model || 'gemini-3.1-flash-lite',
        status: data.status,
      });
    } catch {
      setHealthStatus({
        ok: false,
        configured: false,
        model: 'gemini-3.1-flash-lite',
        status: 'unreachable',
      });
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId]
  );

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSubmittingRef.current = false;
    setIsGenerating(false);
  }, []);

  const streamAssistantResponse = useCallback(
    async (
      targetChatId: string,
      apiHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
      assistantMsgId: string
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      isSubmittingRef.current = true;
      setIsGenerating(true);

      let accumulatedText = '';

      const updateAssistantMessage = (
        content: string,
        isError = false
      ) => {
        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== targetChatId) return chat;
            return {
              ...chat,
              updatedAt: new Date().toISOString(),
              messages: chat.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content, isError } : m
              ),
            };
          })
        );
      };

      const removeEmptyAssistantPlaceholder = () => {
        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== targetChatId) return chat;
            return {
              ...chat,
              messages: chat.messages.filter((m) => m.id !== assistantMsgId),
            };
          })
        );
      };

      try {
        const currentSettings = settingsRef.current;
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: apiHistory.slice(-24),
            personalityPreset: currentSettings.personalityPreset,
            customInstructions: currentSettings.customInstructions,
            responseSpeed: currentSettings.responseSpeed,
          }),
        });

        if (!response.ok) {
          let serverError: string | undefined;
          try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const errJson = (await response.json()) as { error?: string };
              if (errJson.error) serverError = errJson.error;
            }
          } catch {
            // Non-JSON error body
          }

          let errMsg = serverError;
          if (!errMsg) {
            if (response.status === 404) {
              errMsg =
                'Chat API endpoint (/api/chat) was not found (404). Please verify the backend API route is deployed.';
            } else if (response.status === 401 || response.status === 403) {
              errMsg =
                'API authentication failed (401/403). Please verify your server GEMINI_API_KEY configuration.';
            } else if (response.status === 429) {
              errMsg =
                'Rate limit exceeded (429). Please wait a moment and try again.';
            } else {
              errMsg = `Server error (${response.status}). Please try again.`;
            }
          }

          console.warn('[HASSNAIN AI] Chat API HTTP error:', {
            status: response.status,
            endpoint: '/api/chat',
            message: errMsg,
          });

          updateAssistantMessage(errMsg, true);
          addToast(errMsg, 'error');
          return;
        }

        if (!response.body) {
          const msg = 'No response stream received from server.';
          updateAssistantMessage(msg, true);
          addToast(msg, 'error');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr) as {
                type: 'delta' | 'done' | 'error';
                text?: string;
                error?: string;
              };

              if (event.type === 'delta' && event.text) {
                accumulatedText += event.text;
                updateAssistantMessage(accumulatedText, false);
              } else if (event.type === 'error') {
                const errText =
                  event.error || 'Failed to generate AI response.';
                if (accumulatedText.trim().length > 0) {
                  updateAssistantMessage(
                    `${accumulatedText}\n\n---\n*Error: ${errText}*`,
                    false
                  );
                } else {
                  updateAssistantMessage(errText, true);
                }
                addToast(errText, 'error');
                return;
              }
            } catch {
              // Ignore malformed partial SSE frames
            }
          }
        }

        if (accumulatedText.trim().length === 0) {
          updateAssistantMessage(
            'No response was returned. Please try again.',
            true
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (accumulatedText.trim().length === 0) {
            removeEmptyAssistantPlaceholder();
          }
          addToast('Response generation stopped', 'info');
        } else {
          console.warn('[HASSNAIN AI] Chat network error:', err);
          const networkMsg =
            'Network failure: Unable to reach the server. Please check your internet connection and retry.';
          updateAssistantMessage(networkMsg, true);
          addToast(networkMsg, 'error');
        }
      } finally {
        if (
          abortControllerRef.current === controller ||
          abortControllerRef.current === null
        ) {
          abortControllerRef.current = null;
          isSubmittingRef.current = false;
          setIsGenerating(false);
        }
      }
    },
    [addToast]
  );

  const handleSendMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text || isGenerating || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      const now = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        content: text,
        timestamp: now,
      };
      const assistantMsg: ChatMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: '',
        timestamp: now,
      };

      if (!activeChat) {
        const newChatId = createId('chat');
        const newChat: ChatSession = {
          id: newChatId,
          title: deriveChatTitle(text),
          createdAt: now,
          updatedAt: now,
          messages: [userMsg, assistantMsg],
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChatId);
        streamAssistantResponse(
          newChatId,
          [{ role: 'user', content: text }],
          assistantMsg.id
        );
      } else {
        const existingValidMessages = activeChat.messages.filter(
          (m) => !m.isError
        );
        const shouldAutoTitle = activeChat.messages.length === 0;
        const nextTitle = shouldAutoTitle
          ? deriveChatTitle(text)
          : activeChat.title;

        setChats((prev) =>
          prev
            .map((chat) =>
              chat.id === activeChat.id
                ? {
                    ...chat,
                    title: nextTitle,
                    updatedAt: now,
                    messages: [...chat.messages, userMsg, assistantMsg],
                  }
                : chat
            )
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
        );

        const apiHistory = [
          ...existingValidMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user' as const, content: text },
        ];

        streamAssistantResponse(activeChat.id, apiHistory, assistantMsg.id);
      }
    },
    [activeChat, isGenerating, streamAssistantResponse]
  );

  const handleRegenerate = useCallback(
    (assistantMessageId: string) => {
      if (!activeChat || isGenerating || isSubmittingRef.current) return;
      const targetIdx = activeChat.messages.findIndex(
        (m) => m.id === assistantMessageId
      );
      if (targetIdx === -1) return;
      isSubmittingRef.current = true;

      const priorMessages = activeChat.messages
        .slice(0, targetIdx)
        .filter((m) => !m.isError);

      // Ensure conversation ends with a user message
      let lastUserIdx = -1;
      for (let i = priorMessages.length - 1; i >= 0; i--) {
        if (priorMessages[i].role === 'user') {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx === -1) return;

      const contextMessages = priorMessages.slice(0, lastUserIdx + 1);
      const now = new Date().toISOString();
      const freshAssistantMsg: ChatMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: '',
        timestamp: now,
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                updatedAt: now,
                messages: [...contextMessages, freshAssistantMsg],
              }
            : chat
        )
      );

      streamAssistantResponse(
        activeChat.id,
        contextMessages.map((m) => ({ role: m.role, content: m.content })),
        freshAssistantMsg.id
      );
    },
    [activeChat, isGenerating, streamAssistantResponse]
  );

  const handleRetryLastError = useCallback(() => {
    if (!activeChat || isGenerating) return;
    const lastErrorMsg = [...activeChat.messages]
      .reverse()
      .find((m) => m.isError);
    if (lastErrorMsg) {
      handleRegenerate(lastErrorMsg.id);
    }
  }, [activeChat, handleRegenerate, isGenerating]);

  const handleNewChat = useCallback(() => {
    if (isGenerating) {
      stopGeneration();
    }
    setActiveChatId(null);
  }, [isGenerating, stopGeneration]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      if (isGenerating) {
        stopGeneration();
      }
      setActiveChatId(chatId);
    },
    [isGenerating, stopGeneration]
  );

  const handleRenameChat = useCallback(
    (chatId: string, newTitle: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, title: newTitle, updatedAt: new Date().toISOString() }
            : c
        )
      );
      addToast('Chat renamed');
    },
    [addToast]
  );

  const executeConfirmAction = useCallback(() => {
    if (!confirmAction) return;

    if (confirmAction.type === 'delete-chat') {
      if (isGenerating && activeChatId === confirmAction.chatId) {
        stopGeneration();
      }
      setChats((prev) => prev.filter((c) => c.id !== confirmAction.chatId));
      if (activeChatId === confirmAction.chatId) {
        setActiveChatId(null);
      }
      addToast('Conversation deleted');
    } else if (confirmAction.type === 'delete-all') {
      if (isGenerating) {
        stopGeneration();
      }
      setChats([]);
      setActiveChatId(null);
      addToast('All chat history cleared');
    } else if (confirmAction.type === 'clear-current') {
      if (isGenerating && activeChatId === confirmAction.chatId) {
        stopGeneration();
      }
      setChats((prev) =>
        prev.map((c) =>
          c.id === confirmAction.chatId
            ? { ...c, messages: [], updatedAt: new Date().toISOString() }
            : c
        )
      );
      addToast('Current conversation cleared');
    }

    setConfirmAction(null);
  }, [activeChatId, addToast, confirmAction, isGenerating, stopGeneration]);

  const handleCopyMessage = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        addToast('Message copied to clipboard');
      } catch {
        addToast('Failed to copy message', 'error');
      }
    },
    [addToast]
  );

  const confirmDialogProps = useMemo(() => {
    if (!confirmAction) return null;
    if (confirmAction.type === 'delete-chat') {
      return {
        title: 'Delete Conversation',
        description: `Are you sure you want to permanently delete "${confirmAction.title}"? This action cannot be undone.`,
        confirmLabel: 'Delete Chat',
      };
    }
    if (confirmAction.type === 'clear-current') {
      return {
        title: 'Clear Current Chat',
        description:
          'Remove all messages in this conversation while keeping the chat thread? This action cannot be undone.',
        confirmLabel: 'Clear Messages',
      };
    }
    return {
      title: 'Delete All Conversations',
      description:
        'Are you sure you want to delete every saved conversation from LocalStorage? This cannot be undone.',
      confirmLabel: 'Delete All Chats',
    };
  }, [confirmAction]);

  return (
    <div className="h-dvh w-full flex overflow-hidden bg-slate-50 dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isDesktopOpen={isDesktopSidebarOpen}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onToggleDesktop={() => setIsDesktopSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onRequestDeleteChat={(chatId) => {
          const target = chats.find((c) => c.id === chatId);
          if (target) {
            setConfirmAction({
              type: 'delete-chat',
              chatId,
              title: target.title,
            });
          }
        }}
        onRequestDeleteAll={() => setConfirmAction({ type: 'delete-all' })}
        onOpenSettings={() => {
          checkHealth();
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Top Bar */}
        <header className="h-14 shrink-0 px-3 sm:px-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#0B0E14]/90 backdrop-blur-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop expand sidebar trigger when collapsed */}
            {!isDesktopSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsDesktopSidebarOpen(true)}
                className="hidden md:flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] min-w-[40px] items-center justify-center"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <h2 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
              {activeChat ? activeChat.title : 'HASSNAIN AI'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeChat && activeChat.messages.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    type: 'clear-current',
                    chatId: activeChat.id,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] whitespace-nowrap shrink-0"
                title="Clear current conversation"
              >
                <Eraser className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            )}

            {(!isDesktopSidebarOpen || activeChat !== null) && (
              <button
                type="button"
                onClick={handleNewChat}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] min-w-[44px]"
                aria-label="New chat"
                title="New chat"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                updateSettings({
                  theme: settings.theme === 'dark' ? 'light' : 'dark',
                })
              }
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label={
                settings.theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              title={
                settings.theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                checkHealth();
                setIsSettingsOpen(true);
              }}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Chat Viewport */}
        <main className="flex-1 min-h-0 flex flex-col">
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <WelcomeScreen onSelectPrompt={handleSendMessage} />
            </div>
          ) : (
            <ChatMessageList
              messages={activeChat.messages}
              isGenerating={isGenerating}
              fontSize={settings.fontSize}
              onCopyMessage={handleCopyMessage}
              onCopyCode={(msg) => addToast(msg)}
              onRegenerate={handleRegenerate}
              onRetryLastError={handleRetryLastError}
            />
          )}

          {/* Message Input Bar */}
          <ChatInput
            isGenerating={isGenerating}
            fontSize={settings.fontSize}
            personalityPreset={settings.personalityPreset}
            onSend={handleSendMessage}
            onStop={stopGeneration}
            onEmptyAttempt={() =>
              addToast('Please type a message before sending', 'info')
            }
          />
        </main>
      </div>

      {/* Modals & Toasts */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        healthStatus={healthStatus}
        isCheckingHealth={isCheckingHealth}
        chatCount={chats.length}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onCheckHealth={checkHealth}
        onRequestClearAllChats={() => {
          setIsSettingsOpen(false);
          setConfirmAction({ type: 'delete-all' });
        }}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDialogProps)}
        title={confirmDialogProps?.title ?? ''}
        description={confirmDialogProps?.description ?? ''}
        confirmLabel={confirmDialogProps?.confirmLabel ?? 'Confirm'}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
