"use client";

import { useEffect, useState } from "react";
import { getMe, type User } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then((res) => {
      if (res.data) setUser(res.data);
    });
  }, []);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted">Your account details.</p>
      </div>
      <div className="max-w-md space-y-3 rounded-lg border border-border bg-surface p-4">
        <div className="space-y-1 text-sm">
          <div className="text-muted">Email</div>
          <div className="font-medium">{user?.email ?? "…"}</div>
        </div>
      </div>
    </section>
  );
}
