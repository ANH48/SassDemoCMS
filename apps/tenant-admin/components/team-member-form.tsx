"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

export function TeamMemberForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name:     form.get("name"),
      email:    form.get("email"),
      password: form.get("password"),
      role:     form.get("role"),
    };

    startTransition(async () => {
      const res = await fetch(`${API_URL}/tenant/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        setError(Array.isArray(err.message) ? err.message.join(", ") : err.message);
      } else {
        setError(null);
        router.refresh();
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-w-xl">
      <div>
        <label className={labelCls}>Name *</label>
        <input name="name" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Email *</label>
        <input name="email" type="email" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Password * (min 8 chars)</label>
        <input name="password" type="password" minLength={8} required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Role *</label>
        <select name="role" required className={inputCls}>
          <option value="TENANT_USER">Staff (Tenant User)</option>
          <option value="TENANT_ADMIN">Admin</option>
        </select>
      </div>
      {error && <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="col-span-2">
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {isPending ? "Adding…" : "Add Member"}
        </button>
      </div>
    </form>
  );
}
