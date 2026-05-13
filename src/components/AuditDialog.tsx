import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVault, type AuditEvent } from "@/lib/vault";
import { useEffect } from "react";

const labels: Record<AuditEvent["type"], string> = {
  vault_created: "Vault created",
  vault_unlocked: "Vault unlocked",
  unlock_failed: "Failed unlock attempt",
  vault_locked: "Vault locked",
  entry_added: "Entry added",
  entry_updated: "Entry updated",
  entry_deleted: "Entry deleted",
  vault_exported: "Vault exported",
  vault_imported: "Vault imported",
  master_password_changed: "Master password changed",
  master_password_change_failed: "Master password change failed",
};

export function AuditDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { audit, refresh } = useVault();
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Audit log</DialogTitle>
          <DialogDescription>
            Local activity history. Stored in your browser only.
          </DialogDescription>
        </DialogHeader>
        {audit.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No events recorded yet.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {audit.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      e.type === "unlock_failed" || e.type === "master_password_change_failed"
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {labels[e.type]}
                  </div>
                  {e.detail && (
                    <div className="truncate text-xs text-muted-foreground">{e.detail}</div>
                  )}
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(e.ts).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}