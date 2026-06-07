import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault";
import { passwordStrength } from "@/lib/crypto";
import { toast } from "sonner";

export function ChangeMasterPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const changeMasterPassword = useVault((s) => s.changeMasterPassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(next);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const handle = async () => {
    if (!current || !next) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next === current) {
      toast.error("New password must be different");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const ok = await changeMasterPassword(current, next);
      if (ok) {
        toast.success("Master password changed — vault re-encrypted");
        reset();
        onOpenChange(false);
      } else {
        toast.error("Current master password is incorrect");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change master password</DialogTitle>
          <DialogDescription>
            Your vault will be re-encrypted with a new key derived from the new
            password. The old password is verified locally and never stored.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cur">Current master password</Label>
            <Input
              id="cur"
              type="password"
              autoFocus
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="new">New master password</Label>
            <Input
              id="new"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="mt-1.5"
            />
            {next && (
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
          <div>
            <Label htmlFor="conf">Confirm new password</Label>
            <Input
              id="conf"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handle} disabled={busy}>
            {busy ? "Re-encrypting…" : "Change password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}