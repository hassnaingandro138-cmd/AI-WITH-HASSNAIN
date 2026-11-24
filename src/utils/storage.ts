import { AppSettings, ChatMessage, ChatSession } from '../types/chat';

const CHATS_STORAGE_KEY = 'hassnain_ai_chats_v1';
const SETTINGS_STORAGE_KEY = 'hassnain_ai_settings_v1';
const ACTIVE_CHAT_STORAGE_KEY = 'hassnain_ai_active_chat_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 'md',
  responseSpeed: 'fast',
  personalityPreset: 'balanced',
  customInstructions: '',
};

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function deriveChatTitle(firstMessage: string): string {
  const normalized = firstMessage.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'New Conversation';
  if (normalized.length <= 44) return normalized;
  return `${normalized.slice(0, 41).trimEnd()}...`;
}

export function loadChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is ChatSession => {
        return (
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.createdAt === 'string' &&
          typeof item.updatedAt === 'string' &&
          Array.isArray(item.messages)
        );
      })
      .map((chat) => ({
        ...chat,
        messages: chat.messages.filter(
          (msg): msg is ChatMessage =>
            Boolean(msg) &&
            typeof msg.id === 'string' &&
            (msg.role === 'user' || msg.role === 'assistant') &&
            typeof msg.content === 'string' &&
            typeof msg.timestamp === 'string'
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  } catch {
    return [];
  }
}

export function saveChats(chats: ChatSession[]): boolean {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    return true;
  } catch {
    return false;
  }
}

export function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveChatId(chatId: string | null): void {
  try {
    if (chatId) {
      localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, chatId);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors for active pointer
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    const theme = parsed.theme === 'light' ? 'light' : 'dark';
    const fontSize =
      parsed.fontSize === 'sm' || parsed.fontSize === 'lg'
        ? parsed.fontSize
        : 'md';
    const validPresets = new Set([
      'balanced',
      'coding',
      'tutor',
      'creative',
      'concise',
    ]);
    const personalityPreset =
      parsed.personalityPreset && validPresets.has(parsed.personalityPreset)
        ? parsed.personalityPreset
        : 'balanced';
    const customInstructions =
      typeof parsed.customInstructions === 'string'
        ? parsed.customInstructions.slice(0, 1000)
        : '';

    const responseSpeed =
      parsed.responseSpeed === 'smart' ? 'smart' : 'fast';

    return {
      theme,
      fontSize,
      responseSpeed,
      personalityPreset,
      customInstructions,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function formatMessageTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function groupChatsByDate(
  chats: ChatSession[]
): Array<{ label: string; items: ChatSession[] }> {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOfLast7Days = startOfToday - 7 * oneDayMs;

  const groups: Record<string, ChatSession[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  for (const chat of chats) {
    const ts = new Date(chat.updatedAt).getTime();
    if (ts >= startOfToday) {
      groups.Today.push(chat);
    } else if (ts >= startOfYesterday) {
      groups.Yesterday.push(chat);
    } else if (ts >= startOfLast7Days) {
      groups['Previous 7 Days'].push(chat);
    } else {
      groups.Older.push(chat);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
