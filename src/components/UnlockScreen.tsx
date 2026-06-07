import { useState } from "react";
import { useVault } from "@/lib/vault";
import { HowToUseDialog } from "./HowToUseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, KeyRound, Upload, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { passwordStrength } from "@/lib/crypto";

export function UnlockScreen() {
  const { initialized, createVault, unlock, importVault } = useVault();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"main" | "import">("main");
  const [importJson, setImportJson] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const strength = passwordStrength(pw);

  const handle = async () => {
    if (!pw) return;
    setBusy(true);
    try {
      if (initialized) {
        const ok = await unlock(pw);
        if (!ok) toast.error("Incorrect master password");
      } else {
        if (pw.length < 8) {
          toast.error("Master password must be at least 8 characters");
          return;
        }
        if (pw !== pw2) {
          toast.error("Passwords do not match");
          return;
        }
        await createVault(pw);
        toast.success("Vault created");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!pw || !importJson) return;
    setBusy(true);
    try {
      const ok = await importVault(importJson, pw);
      if (ok) toast.success("Vault imported");
      else toast.error("Import failed — bad file or password");
    } finally {
      setBusy(false);
    }
  };

  const onFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => setImportJson(String(r.result ?? ""));
    r.readAsText(f);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-vault)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Vaultkeep</div>
            <div className="text-xs text-muted-foreground">Local-only password vault</div>
          </div>
        </div>

        {mode === "main" && (
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              {initialized ? <Lock className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
              {initialized ? "Unlock vault" : "Create master password"}
            </div>
            <h1 className="mb-6 text-2xl font-semibold tracking-tight">
              {initialized ? "Welcome back." : "Set up your vault."}
            </h1>

            <div className="space-y-4">
              <div>
                <Label htmlFor="pw">Master password</Label>
                <Input
                  id="pw"
                  type="password"
                  autoFocus
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handle()}
                  className="mt-1.5"
                />
                {!initialized && pw && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-1.5 flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full ${
                            i < strength.score ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{strength.label}</span>
                  </div>
                )}
              </div>
              {!initialized && (
                <div>
                  <Label htmlFor="pw2">Confirm password</Label>
                  <Input
                    id="pw2"
                    type="password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handle()}
                    className="mt-1.5"
                  />
                </div>
              )}
              <Button onClick={handle} disabled={busy} className="w-full" size="lg">
                {initialized ? "Unlock" : "Create vault"}
              </Button>

              {!initialized && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your master password is never stored. It derives an AES-256 key (PBKDF2,
                  250k iterations) used to encrypt your vault locally. If you forget it,
                  your data cannot be recovered.
                </p>
              )}

              <button
                onClick={() => setMode("import")}
                className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <Upload className="h-3.5 w-3.5" />
                Import existing vault file
              </button>
            </div>
          </div>
        )}

        {mode === "import" && (
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight">Import vault</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Restore from an encrypted backup file. Your master password is required.
            </p>
            <div className="space-y-4">
              <div>
                <Label>Backup file</Label>
                <Input
                  type="file"
                  accept=".json,application/json"
                  className="mt-1.5"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
              </div>
              <div>
                <Label>Master password</Label>
                <Input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("main")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleImport} disabled={busy} className="flex-1">
                  Import
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
          AES-256-GCM · PBKDF2 · Local-only
        </p>
      </div>
    </div>
  );
}