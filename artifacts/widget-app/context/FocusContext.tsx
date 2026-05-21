import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FocusCategory = "focus" | "quote" | "goal" | "reminder";

export interface FocusItem {
  id: string;
  text: string;
  category: FocusCategory;
  createdAt: number;
}

interface FocusContextType {
  current: FocusItem | null;
  history: FocusItem[];
  isLoading: boolean;
  setFocus: (text: string, category: FocusCategory) => Promise<void>;
  deleteFocusItem: (id: string) => Promise<void>;
}

const STORAGE_KEY_CURRENT = "@fokus/current";
const STORAGE_KEY_HISTORY = "@fokus/history";
const MAX_HISTORY = 20;

const FocusContext = createContext<FocusContextType>({
  current: null,
  history: [],
  isLoading: true,
  setFocus: async () => {},
  deleteFocusItem: async () => {},
});

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<FocusItem | null>(null);
  const [history, setHistory] = useState<FocusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [currentRaw, historyRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_CURRENT),
          AsyncStorage.getItem(STORAGE_KEY_HISTORY),
        ]);
        if (currentRaw) setCurrent(JSON.parse(currentRaw));
        if (historyRaw) setHistory(JSON.parse(historyRaw));
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setFocus = useCallback(
    async (text: string, category: FocusCategory) => {
      const item: FocusItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        text,
        category,
        createdAt: Date.now(),
      };

      const newHistory = [item, ...history.filter((h) => h.id !== item.id)].slice(
        0,
        MAX_HISTORY
      );

      setCurrent(item);
      setHistory(newHistory);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(item)),
        AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory)),
      ]);

      tryUpdateNativeWidget(item);
    },
    [history]
  );

  const deleteFocusItem = useCallback(
    async (id: string) => {
      const newHistory = history.filter((h) => h.id !== id);
      setHistory(newHistory);
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
      if (current?.id === id) {
        const next = newHistory[0] ?? null;
        setCurrent(next);
        await AsyncStorage.setItem(
          STORAGE_KEY_CURRENT,
          next ? JSON.stringify(next) : ""
        );
        if (next) tryUpdateNativeWidget(next);
      }
    },
    [history, current]
  );

  return (
    <FocusContext.Provider
      value={{ current, history, isLoading, setFocus, deleteFocusItem }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  return useContext(FocusContext);
}

function tryUpdateNativeWidget(item: FocusItem) {
  try {
    const { NativeModules } = require("react-native");
    if (NativeModules.FokusWidgetBridge?.updateData) {
      NativeModules.FokusWidgetBridge.updateData(
        JSON.stringify({
          text: item.text,
          category: item.category,
          lastUpdated: new Date(item.createdAt).toISOString(),
        })
      );
    }
  } catch {
    // Not in a production build — graceful fallback
  }
}
