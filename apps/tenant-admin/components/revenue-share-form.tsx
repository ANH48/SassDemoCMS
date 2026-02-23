"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

export function RevenueShareForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name:       form.get("name"),
      type:       form.get("type"),
      percentage: Number(form.get("percentage")),
    };

    startTransition(async () => {
      const res = await fetch(`${API_URL}/tenant/revenue-shares`, {
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

  const inputCls = "px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  const labelCls = "block text-xs text-gray-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap items-end">
      <div>
        <label className={labelCls}>Name *</label>
        <input name="name" required className={inputCls} placeholder="Staff Commission" />
      </div>
      <div>
        <label className={labelCls}>Type *</label>
        <select name="type" required className={inputCls}>
          <option value="STAFF">Staff</option>
          <option value="OWNER">Owner</option>
          <option value="PLATFORM">Platform</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Percentage *</label>
        <input name="percentage" type="number" min="0" max="100" step="0.01" required className={`${inputCls} w-24`} />
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button type="submit" disabled={isPending} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
        {isPending ? "Saving…" : "Add"}
      </button>
    </form>
  );
}
