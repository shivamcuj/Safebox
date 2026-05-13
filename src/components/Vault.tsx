import { useMemo, useState } from "react";
import { useVault, copyWithAutoClear, type VaultEntry } from "@/lib/vault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Lock,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Settings,
  Download,
  ScrollText,
  ArrowUpDown,
  KeyRound,
} from "lucide-react";
import { EntryForm } from "./EntryForm";
import { AuditDialog } from "./AuditDialog";
import { ChangeMasterPasswordDialog } from "./ChangeMasterPasswordDialog";
import { toast } from "sonner";

type SortKey = "site" | "updated" | "created";

export function Vault() {
  const { data, lock, exportVault } = useVault();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("updated");
  const [editing, setEditing] = useState<VaultEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const allTags = useMemo(() => {
    const s = new Set<string>();
    data.entries.forEach((e) => e.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [data.entries]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = data.entries.filter((e) => {
      if (tag && !e.tags.includes(tag)) return false;
      if (!ql) return true;
      return (
        e.site.toLowerCase().includes(ql) ||
        e.username.toLowerCase().includes(ql) ||
        (e.note ?? "").toLowerCase().includes(ql)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "site") return a.site.localeCompare(b.site);
      if (sort === "created") return b.createdAt - a.createdAt;
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }, [data.entries, q, tag, sort]);

  const onCopy = async (label: string, text: string) => {
    await copyWithAutoClear(text, 20);
    toast.success(`${label} copied — clears in 20s`);
  };

  const onExport = () => {
    const json = exportVault();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultkeep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Encrypted backup downloaded");
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "var(--gradient-vault)" }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Vaultkeep</h1>
              <p className="text-xs text-muted-foreground">
                {data.entries.length}{" "}
                {data.entries.length === 1 ? "entry" : "entries"} · encrypted locally
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Vault</DropdownMenuLabel>
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" /> Export backup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAudit(true)}>
                  <ScrollText className="mr-2 h-4 w-4" /> Audit log
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowChangePw(true)}>
                  <KeyRound className="mr-2 h-4 w-4" /> Change master password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={lock}>
                  <Lock className="mr-2 h-4 w-4" /> Lock vault
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New entry
            </Button>
          </div>
        </header>

        {/* Search + sort */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by site, username, or note…"
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sort === "site" ? "A-Z" : sort === "created" ? "Newest" : "Recently updated"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort("updated")}>
                Recently updated
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("created")}>Newest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("site")}>A-Z</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <TagChip active={tag === null} onClick={() => setTag(null)}>
              All
            </TagChip>
            {allTags.map((t) => (
              <TagChip key={t} active={tag === t} onClick={() => setTag(t)}>
                {t}
              </TagChip>
            ))}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            hasEntries={data.entries.length > 0}
            onNew={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="group rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm transition hover:border-primary/40 hover:bg-card"
              >
                <div className="flex items-start gap-4">
                  <SiteIcon site={e.site} />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => {
                        setEditing(e);
                        setOpen(true);
                      }}
                      className="block w-full text-left"
                    >
                      <div className="truncate font-semibold">{e.site}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {e.username}
                      </div>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {reveal[e.id] ? e.password : "•".repeat(Math.min(12, e.password.length))}
                      </code>
                      {e.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
                    <IconBtn
                      title={reveal[e.id] ? "Hide password" : "Show password"}
                      onClick={() =>
                        setReveal((r) => ({ ...r, [e.id]: !r[e.id] }))
                      }
                    >
                      {reveal[e.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </IconBtn>
                    <IconBtn
                      title="Copy username"
                      onClick={() => onCopy("Username", e.username)}
                    >
                      <span className="text-[10px] font-bold tracking-wider">U</span>
                    </IconBtn>
                    <IconBtn
                      title="Copy password"
                      onClick={() => onCopy("Password", e.password)}
                    >
                      <Copy className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EntryForm open={open} onOpenChange={setOpen} entry={editing} />
      <AuditDialog open={showAudit} onOpenChange={setShowAudit} />
      <ChangeMasterPasswordDialog open={showChangePw} onOpenChange={setShowChangePw} />
    </div>
  );
}

function TagChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SiteIcon({ site }: { site: string }) {
  const letter = site.replace(/^https?:\/\//, "").charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 font-semibold text-primary ring-1 ring-primary/20">
      {letter}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function EmptyState({ hasEntries, onNew }: { hasEntries: boolean; onNew: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
        <ShieldCheck className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">
        {hasEntries ? "No matching entries" : "Your vault is empty"}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {hasEntries
          ? "Try a different search term or clear the active tag."
          : "Store your first credential. Everything is encrypted with your master key before it touches disk."}
      </p>
      {!hasEntries && (
        <Button onClick={onNew} className="mt-6">
          <Plus className="mr-2 h-4 w-4" /> Add first entry
        </Button>
      )}
    </div>
  );
}