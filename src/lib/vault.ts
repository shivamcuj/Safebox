import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  decryptJSON,
  deriveKey,
  encryptJSON,
  newSalt,
  saltFromB64,
  type EncryptedBlob,
} from "./crypto";

const STORAGE_KEY = "vaultkeep:v1";
const AUDIT_KEY = "vaultkeep:audit:v1";

export interface VaultEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  note?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  entries: VaultEntry[];
}

export interface AuditEvent {
  id: string;
  ts: number;
  type:
    | "vault_created"
    | "vault_unlocked"
    | "unlock_failed"
    | "vault_locked"
    | "entry_added"
    | "entry_updated"
    | "entry_deleted"
    | "vault_exported"
    | "vault_imported"
    | "master_password_changed"
    | "master_password_change_failed";
  detail?: string;
}

function loadBlob(): EncryptedBlob | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EncryptedBlob;
  } catch {
    return null;
  }
}
function saveBlob(b: EncryptedBlob) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

function loadAudit(): AuditEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function pushAudit(ev: Omit<AuditEvent, "id" | "ts">) {
  const events = loadAudit();
  events.unshift({ ...ev, id: nanoid(), ts: Date.now() });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(events.slice(0, 200)));
}

interface VaultState {
  initialized: boolean;
  unlocked: boolean;
  key: CryptoKey | null;
  salt: Uint8Array | null;
  data: VaultData;
  audit: AuditEvent[];
  refresh: () => void;
  createVault: (masterPassword: string) => Promise<void>;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
  persist: () => Promise<void>;
  addEntry: (e: Omit<VaultEntry, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateEntry: (id: string, patch: Partial<VaultEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  exportVault: () => string;
  importVault: (json: string, masterPassword: string) => Promise<boolean>;
  changeMasterPassword: (current: string, next: string) => Promise<boolean>;
}

export const useVault = create<VaultState>((set, get) => ({
  initialized: typeof localStorage !== "undefined" && !!localStorage.getItem(STORAGE_KEY),
  unlocked: false,
  key: null,
  salt: null,
  data: { entries: [] },
  audit: [],
  refresh: () => set({ audit: loadAudit() }),
  createVault: async (pw) => {
    const salt = newSalt();
    const key = await deriveKey(pw, salt);
    const data: VaultData = { entries: [] };
    const blob = await encryptJSON(data, key, salt);
    saveBlob(blob);
    pushAudit({ type: "vault_created" });
    set({ initialized: true, unlocked: true, key, salt, data, audit: loadAudit() });
  },
  unlock: async (pw) => {
    const blob = loadBlob();
    if (!blob) return false;
    const salt = saltFromB64(blob.salt);
    try {
      const key = await deriveKey(pw, salt);
      const data = await decryptJSON<VaultData>(blob, key);
      pushAudit({ type: "vault_unlocked" });
      set({ unlocked: true, key, salt, data, audit: loadAudit() });
      return true;
    } catch {
      pushAudit({ type: "unlock_failed" });
      set({ audit: loadAudit() });
      return false;
    }
  },
  lock: () => {
    pushAudit({ type: "vault_locked" });
    set({ unlocked: false, key: null, salt: null, data: { entries: [] }, audit: loadAudit() });
  },
  persist: async () => {
    const { key, salt, data } = get();
    if (!key || !salt) return;
    const blob = await encryptJSON(data, key, salt);
    saveBlob(blob);
  },
  addEntry: async (e) => {
    const now = Date.now();
    const entry: VaultEntry = { ...e, id: nanoid(), createdAt: now, updatedAt: now };
    set({ data: { entries: [entry, ...get().data.entries] } });
    await get().persist();
    pushAudit({ type: "entry_added", detail: entry.site });
    set({ audit: loadAudit() });
  },
  updateEntry: async (id, patch) => {
    const entries = get().data.entries.map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
    );
    set({ data: { entries } });
    await get().persist();
    pushAudit({ type: "entry_updated", detail: patch.site });
    set({ audit: loadAudit() });
  },
  deleteEntry: async (id) => {
    const target = get().data.entries.find((e) => e.id === id);
    set({ data: { entries: get().data.entries.filter((e) => e.id !== id) } });
    await get().persist();
    pushAudit({ type: "entry_deleted", detail: target?.site });
    set({ audit: loadAudit() });
  },
  exportVault: () => {
    const blob = loadBlob();
    if (!blob) return "";
    pushAudit({ type: "vault_exported" });
    return JSON.stringify(blob, null, 2);
  },
  importVault: async (json, pw) => {
    try {
      const blob = JSON.parse(json) as EncryptedBlob;
      if (!blob || blob.v !== 1 || !blob.salt || !blob.iv || !blob.data) return false;
      const salt = saltFromB64(blob.salt);
      const key = await deriveKey(pw, salt);
      const data = await decryptJSON<VaultData>(blob, key);
      saveBlob(blob);
      pushAudit({ type: "vault_imported" });
      set({
        initialized: true,
        unlocked: true,
        key,
        salt,
        data,
        audit: loadAudit(),
      });
      return true;
    } catch {
      return false;
    }
  },
  changeMasterPassword: async (current, next) => {
    const blob = loadBlob();
    if (!blob) return false;
    const oldSalt = saltFromB64(blob.salt);
    try {
      // Verify current password by decrypting the persisted blob.
      const oldKey = await deriveKey(current, oldSalt);
      await decryptJSON<VaultData>(blob, oldKey);
    } catch {
      pushAudit({ type: "master_password_change_failed" });
      set({ audit: loadAudit() });
      return false;
    }
    // Re-encrypt the in-memory data with a new salt + derived key.
    const newSaltBytes = newSalt();
    const newKey = await deriveKey(next, newSaltBytes);
    const data = get().data;
    const newBlob = await encryptJSON(data, newKey, newSaltBytes);
    saveBlob(newBlob);
    pushAudit({ type: "master_password_changed" });
    set({ key: newKey, salt: newSaltBytes, audit: loadAudit() });
    return true;
  },
}));

// Clipboard helper with auto-clear
let clipTimer: ReturnType<typeof setTimeout> | null = null;
export async function copyWithAutoClear(text: string, seconds = 20): Promise<void> {
  await navigator.clipboard.writeText(text);
  if (clipTimer) clearTimeout(clipTimer);
  clipTimer = setTimeout(() => {
    navigator.clipboard.writeText("").catch(() => undefined);
  }, seconds * 1000);
}