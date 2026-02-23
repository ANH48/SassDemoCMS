"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PlanForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const body = {
      name: form.get("name"),
      price: Number(form.get("price")),
      maxProducts: Number(form.get("maxProducts")) || undefined,
      maxUsers: Number(form.get("maxUsers")) || undefined,
    };

    startTransition(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/global/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        setError(Array.isArray(err.message) ? err.message.join(", ") : err.message);
        return;
      }

      router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelClass}>Name</label>
        <input name="name" required className={inputClass} placeholder="Starter" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Price ($/mo)</label>
          <input name="price" type="number" min="0" step="0.01" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Max Products</label>
          <input name="maxProducts" type="number" min="1" className={inputClass} placeholder="∞" />
        </div>
        <div>
          <label className={labelClass}>Max Users</label>
          <input name="maxUsers" type="number" min="1" className={inputClass} placeholder="∞" />
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Creating…" : "Create Plan"}
      </button>
    </form>
  );
}
