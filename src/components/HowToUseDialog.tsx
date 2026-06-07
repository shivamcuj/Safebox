import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, KeyRound, Lock, Search, Tags, Download, Upload, Eye, Copy, ScrollText } from "lucide-react";

export function HowToUseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>How to use Vaultkeep</DialogTitle>
              <DialogDescription>
                A zero-network, local-only password manager
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-100px)]">
          <div className="space-y-6 pr-4">
            {/* What is Vaultkeep */}
            <Section icon={<ShieldCheck className="h-4 w-4" />} title="What is Vaultkeep?">
              <p>
                Vaultkeep is a password manager that runs entirely in your browser. 
                Unlike cloud-based services, your vault never leaves your device. 
                All data is encrypted with <strong>AES-256-GCM</strong> using a key 
                derived from your master password via <strong>PBKDF2</strong> (250,000 iterations) 
                and stored only in your browser's localStorage.
              </p>
            </Section>

            {/* Master Password */}
            <Section icon={<KeyRound className="h-4 w-4" />} title="Master Password">
              <ul className="list-disc pl-5 space-y-1">
                <li>Must be at least 8 characters — use a strong, memorable passphrase.</li>
                <li>
                  <strong>Your master password is never stored.</strong> It is used
                  on-the-fly to derive your encryption key. If you forget it, your
                  data <em>cannot</em> be recovered.
                </li>
                <li>
                  A strength meter helps you gauge your password as you type it 
                  during vault creation and password changes.
                </li>
              </ul>
            </Section>

            {/* Managing Entries */}
            <Section icon={<Lock className="h-4 w-4" />} title="Managing Entries">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Click <strong>"New entry"</strong> (top-right) to add a credential. 
                  Fill in the site, username, password, notes, and tags.
                </li>
                <li>Click any entry's site name to edit it.</li>
                <li>Use the <strong>password generator</strong> within the entry form 
                to create strong, random passwords.</li>
              </ul>
            </Section>

            {/* Search & Organization */}
            <Section icon={<Search className="h-4 w-4" />} title="Search &amp; Organization">
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the search bar to filter entries by site, username, or note text.</li>
                <li>Filter by <strong>tags</strong> using the tag chips below the search bar.</li>
                <li>Sort entries by <strong>Recently updated</strong>, <strong>Newest</strong>, 
                or <strong>A-Z</strong> using the sort dropdown.</li>
              </ul>
            </Section>

            {/* Security */}
            <Section icon={<Eye className="h-4 w-4" />} title="Security Features">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Passwords are hidden by default. Click the <strong>eye icon</strong> 
                  to reveal a password.
                </li>
                <li>
                  Click <strong>"U"</strong> to copy the username or the 
                  <strong>copy icon</strong> to copy the password. 
                  The clipboard is automatically cleared after 20 seconds.
                </li>
                <li>
                  Lock your vault anytime from the <strong>Settings menu</strong> 
                  (gear icon).
                </li>
              </ul>
            </Section>

            {/* Import / Export */}
            <Section icon={<Download className="h-4 w-4" />} title="Import &amp; Export">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Export:</strong> Settings menu → Export backup. 
                  Downloads an encrypted JSON file for safekeeping.
                </li>
                <li>
                  <strong>Import:</strong> On the unlock screen, click 
                  "Import existing vault file", select your backup, and enter 
                  its master password.
                </li>
              </ul>
            </Section>

            {/* Audit Log & Password Change */}
            <Section icon={<ScrollText className="h-4 w-4" />} title="Audit Log &amp; Password Change">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Audit log:</strong> Settings menu → Audit log. 
                  Tracks unlock/lock events, entry changes, exports, imports, 
                  and master password changes (up to 200 events).
                </li>
                <li>
                  <strong>Change master password:</strong> Settings menu → 
                  Change master password. Your vault is re-encrypted with a new key.
                </li>
              </ul>
            </Section>

            {/* Tips */}
            <Section icon={<Tags className="h-4 w-4" />} title="Tips">
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the built-in password generator for every entry.</li>
                <li>Organise entries with tags to quickly filter later.</li>
                <li>Always export a backup before changing your master password.</li>
                <li>This app has no network access — close the tab to fully exit.</li>
              </ul>
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
