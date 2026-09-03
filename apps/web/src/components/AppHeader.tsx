"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

type AppHeaderProps = {
  email: string;
};

export function AppHeader({ email }: AppHeaderProps) {
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
      <div className="text-lg font-semibold tracking-tight">Johel</div>
      <div className="flex items-center gap-4 text-sm text-zinc-600">
        <span>{email}</span>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
