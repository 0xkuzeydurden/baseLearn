import { useCallback, useEffect, useMemo, useState } from "react";
import type { TaskProgress } from "@/types/progress";

type ProfileStore = Record<string, TaskProgress>;
type ProgressStore = Record<string, ProfileStore>;

const STORAGE_KEY = "base-camp-progress-v1";

function loadStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function persistStore(store: ProgressStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useProgress(address?: string, chainId?: number) {
  const profileKey = useMemo(() => {
    if (!address || !chainId) return undefined;
    return `${chainId}:${address.toLowerCase()}`;
  }, [address, chainId]);

  const [store, setStore] = useState<ProgressStore>(() => loadStore());

  useEffect(() => {
    // synchronize state if another tab updated localStorage
    const handler = () => setStore(loadStore());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const profile = useMemo<ProfileStore>(() => {
    if (!profileKey) return {};
    return store[profileKey] ?? {};
  }, [store, profileKey]);

  const upsertTask = useCallback(
    (taskId: string, payload: Partial<TaskProgress>) => {
      if (!profileKey) {
        throw new Error("Connect your wallet to record progress.");
      }
      setStore((prev) => {
        const nextProfile = {
          ...(prev[profileKey] ?? {}),
          [taskId]: {
            ...(prev[profileKey]?.[taskId] ?? {}),
            ...payload,
            updatedAt: Date.now()
          }
        };
        const next = { ...prev, [profileKey]: nextProfile };
        persistStore(next);
        return next;
      });
    },
    [profileKey]
  );

  const clearTask = useCallback(
    (taskId: string) => {
      if (!profileKey) return;
      setStore((prev) => {
        const nextProfile = { ...(prev[profileKey] ?? {}) };
        delete nextProfile[taskId];
        const next = { ...prev, [profileKey]: nextProfile };
        persistStore(next);
        return next;
      });
    },
    [profileKey]
  );

  const clearProfile = useCallback(() => {
    if (!profileKey) return;
    setStore((prev) => {
      const next = { ...prev };
      delete next[profileKey];
      persistStore(next);
      return next;
    });
  }, [profileKey]);

  return {
    profileKey,
    progress: profile,
    updateTask: upsertTask,
    clearTask,
    clearProfile
  };
}
