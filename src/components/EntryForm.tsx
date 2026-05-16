import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";
import { useVault, type VaultEntry } from "@/lib/vault";
import { generatePassword, passwordStrength } from "@/lib/crypto";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: VaultEntry | null;
}

export function EntryForm({ open, onOpenChange, entry }: Props) {
  const { addEntry, updateEntry, deleteEntry } = useVault();
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [reveal, setReveal] = useState(false);

  // generator
  const [showGen, setShowGen] = useState(false);
  const [len, setLen] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);

  useEffect(() => {
    if (open) {
      setSite(entry?.site ?? "");
      setUsername(entry?.username ?? "");
      setPassword(entry?.password ?? "");
      setNote(entry?.note ?? "");
      setTagsStr((entry?.tags ?? []).join(", "));
      setReveal(false);
      setShowGen(false);
    }
  }, [open, entry]);

  const strength = passwordStrength(password);

  const save = async () => {
    if (!site.trim() || !username.trim() || !password) {
      toast.error("Site, username, and password are required");
      return;
    }
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (entry) {
      await updateEntry(entry.id, { site, username, password, note, tags });
      toast.success("Entry updated");
    } else {
      await addEntry({ site, username, password, note, tags });
      toast.success("Entry saved");
    }
    onOpenChange(false);
  };

  const onDelete = async () => {
    if (!entry) return;
    if (!confirm(`Delete entry for "${entry.site}"? This cannot be undone.`)) return;
    await deleteEntry(entry.id);
    toast.success("Entry deleted");
    onOpenChange(false);
  };

  const regen = () => {
    const next = generatePassword({ length: len, lower, upper, digits, symbols });
    setPassword(next);
    setReveal(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{entry ? "Edit entry" : "New entry"}</SheetTitle>
          <SheetDescription>
            All fields are encrypted with your master key before being saved.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-4">
          <div>
            <Label htmlFor="site">Website / service</Label>
            <Input
              id="site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="github.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="user">Username / email</Label>
            <Input
              id="user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pw">Password</Label>
              <button
                type="button"
                onClick={() => setShowGen((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showGen ? "Hide generator" : "Generate"}
              </button>
            </div>
            <div className="relative mt-1.5">
              <Input
                id="pw"
                type={reveal ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-20 font-mono"
              />
              <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                >
                  {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={regen}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-1 flex-1 gap-1">
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

          {showGen && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Length</span>
                  <span className="font-mono text-foreground">{len}</span>
                </div>
                <Slider
                  min={8}
                  max={64}
                  step={1}
                  value={[len]}
                  onValueChange={(v) => setLen(v[0])}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ToggleRow label="a-z" v={lower} onChange={setLower} />
                <ToggleRow label="A-Z" v={upper} onChange={setUpper} />
                <ToggleRow label="0-9" v={digits} onChange={setDigits} />
                <ToggleRow label="!@#" v={symbols} onChange={setSymbols} />
              </div>
              <Button onClick={regen} variant="outline" className="w-full">
                Generate password
              </Button>
            </div>
          )}

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="work, personal"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="mt-1.5"
              placeholder="Recovery hints, security questions…"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {entry ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-1 justify-end gap-2 sm:flex-none">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={save}>{entry ? "Save changes" : "Create entry"}</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ToggleRow({
  label,
  v,
  onChange,
}: {
  label: string;
  v: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm">
      <span className="font-mono text-muted-foreground">{label}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </label>
  );
}