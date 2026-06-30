import { create } from "zustand";

interface ChatbotState {
  isOpen: boolean;
  unreadCount: number;
  toggle: () => void;
  open: () => void;
  close: () => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useChatbotStore = create<ChatbotState>((set) => ({
  isOpen: false,
  unreadCount: 0,
  toggle: () => set(s => ({ isOpen: !s.isOpen, unreadCount: s.isOpen ? s.unreadCount : 0 })),
  open: () => set({ isOpen: true, unreadCount: 0 }),
  close: () => set({ isOpen: false }),
  incrementUnread: () => set(s => ({ unreadCount: s.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}));
