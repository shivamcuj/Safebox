import { createFileRoute } from "@tanstack/react-router";
import { useVault } from "@/lib/vault";
import { UnlockScreen } from "@/components/UnlockScreen";
import { Vault } from "@/components/Vault";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Safebox — Local-only password manager" },
      {
        name: "description",
        content:
          "A zero-network password vault. AES-256-GCM encryption, PBKDF2 master key, runs entirely in your browser.",
      },
    ],
  }),
});

function Index() {
  const unlocked = useVault((s) => s.unlocked);
  return unlocked ? <Vault /> : <UnlockScreen />;
}
