export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type ThemeMode = 'dark' | 'light';
export type FontSizeOption = 'sm' | 'md' | 'lg';
export type ResponseSpeedMode = 'fast' | 'smart';
export type PersonalityPreset =
  | 'balanced'
  | 'coding'
  | 'tutor'
  | 'creative'
  | 'concise';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: FontSizeOption;
  responseSpeed: ResponseSpeedMode;
  personalityPreset: PersonalityPreset;
  customInstructions: string;
}

export interface ToastItem {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
}

export interface HealthStatus {
  ok: boolean;
  configured: boolean;
  model: string;
  status: 'connected' | 'missing_key' | 'unreachable';
}

export interface PersonalityOption {
  id: PersonalityPreset;
  label: string;
  description: string;
}

export const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'balanced',
    label: 'Balanced Assistant',
    description: 'Warm, structured, and naturally conversational across everyday tasks.',
  },
  {
    id: 'coding',
    label: 'Coding Expert',
    description: 'Clean architecture, concise code blocks, and modern engineering advice.',
  },
  {
    id: 'tutor',
    label: 'Study Tutor',
    description: 'Step-by-step explanations with analogies for easier learning.',
  },
  {
    id: 'creative',
    label: 'Creative Writer',
    description: 'Expressive prose, storytelling, and imaginative brainstorming.',
  },
  {
    id: 'concise',
    label: 'Concise & Direct',
    description: 'Crisp, to-the-point answers with minimal fluff.',
  },
];
