import { create } from 'zustand';
import type { Settings, PromptCard, HistoryEntry, AIModel, AIProvider, PageContext } from '@/types';
import { storage, defaultSettings, defaultPromptCards } from '@/lib/storage';

interface AppState {
  // Settings
  settings: Settings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  updateProviderKey: (provider: AIProvider, key: string) => Promise<void>;
  setDefaultModel: (model: AIModel, provider: AIProvider) => Promise<void>;

  // Prompt Cards
  cards: PromptCard[];
  loadCards: () => Promise<void>;
  addCard: (card: PromptCard) => Promise<void>;
  updateCard: (card: PromptCard) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  duplicateCard: (id: string) => Promise<void>;
  reorderCards: (ids: string[]) => Promise<void>;

  // History
  history: HistoryEntry[];
  loadHistory: () => Promise<void>;
  addHistoryEntry: (entry: HistoryEntry) => Promise<void>;
  clearCardHistory: (cardId: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;

  // UI State
  activeView: 'cards' | 'rephrase' | 'history' | 'settings';
  setActiveView: (view: 'cards' | 'rephrase' | 'history' | 'settings') => void;
  selectedCard: PromptCard | null;
  setSelectedCard: (card: PromptCard | null) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;

  // Page Context
  pageContext: PageContext;
  loadPageContext: () => Promise<void>;

  // Output
  currentOutput: string;
  setCurrentOutput: (output: string) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Settings
  settings: defaultSettings,
  isLoading: true,

  loadSettings: async () => {
    const settings = await storage.getSettings();
    set({ settings, isLoading: false });
  },

  updateSettings: async (partial) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    await storage.saveSettings(updated);
    set({ settings: updated });
  },

  updateProviderKey: async (provider, key) => {
    await storage.updateProviderKey(provider, key);
    await get().loadSettings();
  },

  setDefaultModel: async (model, provider) => {
    await storage.setDefaultModel(model, provider);
    await get().loadSettings();
  },

  // Prompt Cards
  cards: [],

  loadCards: async () => {
    const cards = await storage.getPromptCards();
    set({ cards: cards.sort((a, b) => a.order - b.order) });
  },

  addCard: async (card) => {
    await storage.addPromptCard(card);
    await get().loadCards();
    chrome.runtime.sendMessage({ type: 'REFRESH_CONTEXT_MENUS' });
  },

  updateCard: async (card) => {
    await storage.updatePromptCard(card);
    await get().loadCards();
    chrome.runtime.sendMessage({ type: 'REFRESH_CONTEXT_MENUS' });
  },

  deleteCard: async (id) => {
    await storage.deletePromptCard(id);
    await get().loadCards();
    chrome.runtime.sendMessage({ type: 'REFRESH_CONTEXT_MENUS' });
  },

  duplicateCard: async (id) => {
    const cards = get().cards;
    const original = cards.find(c => c.id === id);
    if (original) {
      const duplicate: PromptCard = {
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        title: `${original.title} (Copy)`,
        order: cards.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await get().addCard(duplicate);
    }
  },

  reorderCards: async (ids) => {
    await storage.reorderPromptCards(ids);
    await get().loadCards();
    chrome.runtime.sendMessage({ type: 'REFRESH_CONTEXT_MENUS' });
  },

  // History
  history: [],

  loadHistory: async () => {
    const history = await storage.getHistory();
    set({ history });
  },

  addHistoryEntry: async (entry) => {
    await storage.addHistoryEntry(entry);
    await get().loadHistory();
    // Save last output for keyboard shortcut
    chrome.runtime.sendMessage({ 
      type: 'SAVE_LAST_OUTPUT', 
      payload: { output: entry.output } 
    });
  },

  clearCardHistory: async (cardId) => {
    await storage.clearCardHistory(cardId);
    await get().loadHistory();
  },

  clearAllHistory: async () => {
    await storage.clearAllHistory();
    await get().loadHistory();
  },

  // UI State
  activeView: 'cards',
  setActiveView: (view) => set({ activeView: view }),
  selectedCard: null,
  setSelectedCard: (card) => set({ selectedCard: card }),
  isEditing: false,
  setIsEditing: (editing) => set({ isEditing: editing }),

  // Page Context
  pageContext: {
    selection: '',
    pageTitle: '',
    pageUrl: '',
    pageContent: '',
  },

  loadPageContext: async () => {
    try {
      const context = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT' });
      set({ pageContext: context });
    } catch {
      // Fallback for popup mode
      set({ 
        pageContext: { 
          selection: '', 
          pageTitle: '', 
          pageUrl: '', 
          pageContent: '' 
        } 
      });
    }
  },

  // Output
  currentOutput: '',
  setCurrentOutput: (output) => set({ currentOutput: output }),
  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  error: null,
  setError: (error) => set({ error }),
}));
