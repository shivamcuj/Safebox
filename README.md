# vaultkeep

A **zero-network, local-only password manager** that runs entirely in your browser. All data is encrypted with **AES-256-GCM** (key derived via **PBKDF2** with 250,000 iterations) and stored exclusively in the browser's `localStorage`. No data is ever sent to a server — there is no backend, no database, no API calls.

Built with **React 19**, **TypeScript**, **TanStack Start** (React Router v7), **TanStack Query**, **Zustand**, **Tailwind CSS v4**, and **shadcn/ui**.

---

## Features

### Core Vault

- **Vault creation** — First-time setup with a master password (strength meter included)
- **Unlock / Lock** — Unlock with your master password; lock to clear the session key from memory
- **Entry CRUD** — Add, edit, and delete password entries (site, username, password, note, tags)
- **Search** — Real-time filtering by site, username, or note text
- **Tag filtering** — Filter entries by tags with chip-based UI
- **Sorting** — Sort by recently updated, newest first, or alphabetically
- **Password reveal / hide** — Toggle visibility of individual passwords
- **Copy with auto-clear** — Copy username or password to clipboard; auto-clears after 20 seconds

### Cryptographic

- **AES-256-GCM encryption** — All vault data encrypted with AES-GCM (12-byte IV) via the Web Crypto API
- **PBKDF2 key derivation** — 250,000 iterations, SHA-256, random 16-byte salt
- **Password generator** — Configurable length (8–64) and character sets (lowercase, uppercase, digits, symbols); guarantees at least one from each selected set
- **Password strength meter** — 5-level strength rating (Very weak to Excellent) based on length, case mix, and character diversity

### Security

- **Zero-knowledge** — Master password is never stored; only used to derive the encryption key
- **Local-only** — All data stays in `localStorage`; no network transmission
- **No recovery** — If the master password is lost, data is unrecoverable (by design)
- **Clipboard auto-clear** — Copied passwords are automatically cleared from the clipboard after 20 seconds
- **Re-encryption on password change** — Vault is fully decrypted and re-encrypted with a new salt and key when the master password is changed

### Import / Export

- **Export vault** — Download the encrypted vault as a JSON backup file
- **Import vault** — Restore from an encrypted backup file (requires the master password)

### Audit Log

- Tracks 11 event types: create, unlock, lock, add entry, update entry, delete entry, export, import, master password change, and more (max 200 events retained)

### UI / UX

- **Responsive design** — Optimized for both desktop and mobile (768px breakpoint)
- **Dark theme** — Deep slate UI with emerald green accent colors (`oklch` color space)
- **Slide-over entry form** — Sheet component for adding and editing entries
- **Toast notifications** — Via `sonner` for success / error feedback
- **Custom 404 page** and **error boundary** with a "Try again" option
- **SSR error handling** — Middleware captures unhandled errors and renders a branded error page

---

## Getting Started

### Prerequisites

- [**Bun**](https://bun.sh) (v1.x) — the project uses `bun.lock` and `bunfig.toml`

### Install

```bash
bun install
```

### Development

```bash
bun run dev
```

Starts the Vite development server.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run build:dev` | Build with development mode |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |

---

## Deployment

### Cloudflare Workers (recommended)

The project is configured for Cloudflare Workers via `wrangler.jsonc`:

```bash
# Build the project
bun run build

# Deploy to Cloudflare Workers (requires wrangler login)
bunx wrangler deploy

# Preview locally with Wrangler
bunx wrangler dev
```

### Static hosting

You can also serve the built output (`dist/`) from any static web server (nginx, Vercel, Netlify, Cloudflare Pages, etc.):

```bash
bun run build
# Serve the dist/ directory with your preferred static server
```

---

## Architecture

```
User Input → UI Component → Zustand Store → crypto.ts (Web Crypto API)
  → EncryptedBlob → localStorage
```

- **`localStorage` keys used:**
  - `"vaultkeep:v1"` — encrypted vault blob
  - `"vaultkeep:audit:v1"` — audit log array (max 200 events)
- The application is server-side rendered via **Cloudflare Workers** with a TanStack Start middleware layer, but all vault operations are purely client-side.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript |
| SSR / Routing | TanStack Start (React Router v7) |
| State | Zustand |
| Server State | TanStack Query |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Cryptography | Web Crypto API (AES-256-GCM, PBKDF2) |
| Build | Vite, Bun |
| Deployment | Cloudflare Workers (Wrangler) |

---

## Project Structure

```
src/
├── start.ts                   # TanStack Start server entry
├── server.ts                  # Cloudflare Workers SSR entry
├── router.tsx                 # React Router setup
├── routeTree.gen.ts           # Auto-generated route tree
├── styles.css                 # Tailwind v4 + design tokens
├── routes/
│   ├── __root.tsx             # Root layout, error boundary, 404
│   └── index.tsx              # Home route
├── hooks/
│   └── use-mobile.tsx         # Mobile detection hook
├── lib/
│   ├── crypto.ts              # Encryption, key derivation, password generation
│   ├── vault.ts               # Zustand store (CRUD, import/export, audit)
│   ├── utils.ts               # cn() utility
│   ├── error-page.ts          # SSR error page HTML
│   └── error-capture.ts       # Global SSR error capture
└── components/
    ├── Vault.tsx               # Main vault dashboard
    ├── UnlockScreen.tsx        # Login / create / import
    ├── EntryForm.tsx           # Add / edit entry sheet
    ├── AuditDialog.tsx         # Audit log viewer
    ├── ChangeMasterPasswordDialog.tsx
    └── ui/                     # 35+ shadcn/ui components
```
