// AES-256-GCM with PBKDF2 key derivation. All client-side via Web Crypto.
const PBKDF2_ITERATIONS = 250_000;
const SALT_LEN = 16;
const IV_LEN = 12;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface EncryptedBlob {
  v: 1;
  salt: string;
  iv: string;
  data: string;
}

export async function encryptJSON(payload: unknown, key: CryptoKey, salt: Uint8Array): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const data = enc.encode(JSON.stringify(payload));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data);
  return { v: 1, salt: toB64(salt), iv: toB64(iv), data: toB64(ct) };
}

export async function decryptJSON<T>(blob: EncryptedBlob, key: CryptoKey): Promise<T> {
  const iv = fromB64(blob.iv);
  const ct = fromB64(blob.data);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct);
  return JSON.parse(dec.decode(pt)) as T;
}

export function newSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LEN));
}

export function saltFromB64(s: string): Uint8Array {
  return fromB64(s);
}

// Password generator
export interface GenOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}
export function generatePassword(opts: GenOptions): string {
  const sets: string[] = [];
  if (opts.lower) sets.push("abcdefghijklmnopqrstuvwxyz");
  if (opts.upper) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (opts.digits) sets.push("0123456789");
  if (opts.symbols) sets.push("!@#$%^&*()-_=+[]{};:,.<>?/~");
  if (sets.length === 0) return "";
  const all = sets.join("");
  const out: string[] = [];
  // ensure at least one from each chosen set
  const rand = crypto.getRandomValues(new Uint32Array(opts.length));
  for (let i = 0; i < sets.length && i < opts.length; i++) {
    out.push(sets[i][rand[i] % sets[i].length]);
  }
  for (let i = out.length; i < opts.length; i++) {
    out.push(all[rand[i] % all.length]);
  }
  // shuffle
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
  return { score, label: labels[score] };
}