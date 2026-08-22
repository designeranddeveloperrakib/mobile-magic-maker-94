import { useEffect, useState } from "react";

/**
 * Multi-user layer (Phase 18).
 *
 * Each user gets a separate profile and a completely separate challenge data
 * bucket in local storage (`challenge365-data::<userId>`), so no user can see
 * another user's records. Sign-in providers (Facebook, Phase 19) will attach
 * to this same profile model.
 */

export type AuthProvider = "local" | "facebook";

export type UserProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  provider: AuthProvider;
  createdAt: string;
};

export type AccountsState = {
  version: 1;
  users: UserProfile[];
  activeUserId: string | null;
};

export const ACCOUNTS_KEY = "challenge365-accounts";

function defaultAccounts(): AccountsState {
  return { version: 1, users: [], activeUserId: null };
}

function readAccounts(): AccountsState {
  if (typeof window === "undefined") return defaultAccounts();
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return defaultAccounts();
    const parsed = JSON.parse(raw) as AccountsState;
    const users = Array.isArray(parsed.users) ? parsed.users : [];
    const activeUserId = users.some((u) => u.id === parsed.activeUserId) ? parsed.activeUserId : null;
    return { version: 1, users, activeUserId };
  } catch {
    return defaultAccounts();
  }
}

function writeAccounts(state: AccountsState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
}

let state: AccountsState | null = null;
const listeners = new Set<(s: AccountsState) => void>();

function getState(): AccountsState {
  if (!state) state = readAccounts();
  return state;
}

function setState(next: AccountsState, persist = true) {
  state = next;
  if (persist) writeAccounts(next);
  listeners.forEach((l) => l(next));
}

export function subscribeAccounts(listener: (s: AccountsState) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveUserId(): string | null {
  return getState().activeUserId;
}

export function getActiveUser(): UserProfile | null {
  const s = getState();
  return s.users.find((u) => u.id === s.activeUserId) ?? null;
}

export function userDataKey(userId: string): string {
  return `challenge365-data::${userId}`;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Create a new profile with its own empty data bucket and sign in as them. */
export function createUser(name: string, provider: AuthProvider = "local"): UserProfile {
  const user: UserProfile = {
    id: makeId(),
    name: name.trim() || "Challenger",
    provider,
    createdAt: new Date().toISOString(),
  };
  const s = getState();
  setState({ ...s, users: [...s.users, user], activeUserId: user.id });
  return user;
}

export function switchUser(userId: string) {
  const s = getState();
  if (!s.users.some((u) => u.id === userId)) return;
  setState({ ...s, activeUserId: userId });
}

export function signOut() {
  setState({ ...getState(), activeUserId: null });
}

export function renameUser(userId: string, name: string) {
  const s = getState();
  setState({
    ...s,
    users: s.users.map((u) => (u.id === userId ? { ...u, name: name.trim() || u.name } : u)),
  });
}

export function deleteUser(userId: string) {
  const s = getState();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(userDataKey(userId));
    } catch {
      // ignore
    }
  }
  const users = s.users.filter((u) => u.id !== userId);
  setState({
    ...s,
    users,
    activeUserId: s.activeUserId === userId ? null : s.activeUserId,
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === ACCOUNTS_KEY) setState(readAccounts(), false);
  });
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountsState>(defaultAccounts);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAccounts(getState());
    setHydrated(true);
    return subscribeAccounts(setAccounts);
  }, []);

  const activeUser = accounts.users.find((u) => u.id === accounts.activeUserId) ?? null;

  return { accounts, users: accounts.users, activeUser, hydrated };
}
