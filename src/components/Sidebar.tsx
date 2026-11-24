import React, { useMemo, useState } from 'react';
import {
  Check,
  MessageSquare,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { ChatSession } from '../types/chat';
import { groupChatsByDate } from '../utils/storage';
import { HassnainLogo } from './HassnainLogo';

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  isDesktopOpen: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleDesktop: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onRequestDeleteChat: (chatId: string) => void;
  onRequestDeleteAll: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  isDesktopOpen,
  isMobileOpen,
  onCloseMobile,
  onToggleDesktop,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onRequestDeleteChat,
  onRequestDeleteAll,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat) => {
      if (chat.title.toLowerCase().includes(query)) return true;
      return chat.messages.some((m) => m.content.toLowerCase().includes(query));
    });
  }, [chats, searchQuery]);

  const groupedChats = useMemo(
    () => groupChatsByDate(filteredChats),
    [filteredChats]
  );

  const startEditing = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const commitRename = (chatId: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      onRenameChat(chatId, trimmed);
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-[#10141D] border-r border-slate-200 dark:border-slate-800/90 text-slate-900 dark:text-slate-100 select-none">
      {/* Brand & Collapse Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <HassnainLogo size="sm" />
          <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate">
            HASSNAIN AI
          </span>
        </div>
        <button
          type="button"
          onClick={isMobile ? onCloseMobile : onToggleDesktop}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          {isMobile ? (
            <X className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* New Chat & Search */}
      <div className="p-3 space-y-2.5">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            if (isMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[42px] whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>New Chat</span>
        </button>

        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            aria-label="Search chats"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-white dark:bg-[#161B26] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors min-h-[40px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-4">
        {groupedChats.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare
              className="w-7 h-7 mx-auto mb-2.5 text-slate-400 dark:text-slate-600"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'No matching conversations found.'
                : 'Your conversation history will appear here.'}
            </p>
          </div>
        ) : (
          groupedChats.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  const isEditing = editingChatId === chat.id;

                  return (
                    <li key={chat.id}>
                      {isEditing ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-[#19202D] border border-blue-500/60">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitRename(chat.id);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEditing();
                              }
                            }}
                            autoFocus
                            aria-label="Rename conversation"
                            className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none py-1"
                          />
                          <button
                            type="button"
                            onClick={() => commitRename(chat.id)}
                            className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            aria-label="Save title"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            aria-label="Cancel rename"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-colors min-h-[42px] ${
                            isActive
                              ? 'bg-white dark:bg-[#1A2130] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/70 shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#161C28] border border-transparent'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectChat(chat.id);
                              if (isMobile) onCloseMobile();
                            }}
                            className="flex-1 flex items-center gap-2.5 min-w-0 text-left py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                          >
                            <MessageSquare
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="text-sm font-medium truncate">
                              {chat.title}
                            </span>
                          </button>

                          <div
                            className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
                              isActive
                                ? 'opacity-100'
                                : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => startEditing(chat, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              aria-label={`Rename ${chat.title}`}
                              title="Rename chat"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDeleteChat(chat.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                              aria-label={`Delete ${chat.title}`}
                              title="Delete chat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
        {chats.length > 0 && (
          <button
            type="button"
            onClick={onRequestDeleteAll}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[40px] whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Delete All Chats</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            if (isMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#171D29] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] whitespace-nowrap"
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop collapsible sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-[width] duration-200 ease-out overflow-hidden ${
          isDesktopOpen ? 'w-[276px]' : 'w-0'
        }`}
        aria-label="Chat history sidebar"
      >
        <div className="w-[276px] h-full">{sidebarContent(false)}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation drawer"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[284px] max-w-[85vw] h-full shadow-2xl">
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
