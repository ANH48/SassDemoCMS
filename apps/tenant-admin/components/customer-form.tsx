"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

export function CustomerForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body: any = { name: form.get("name") };
    if (form.get("email"))   body.email   = form.get("email");
    if (form.get("phone"))   body.phone   = form.get("phone");
    if (form.get("address")) body.address = form.get("address");

    startTransition(async () => {
      const res = await fetch(`${API_URL}/tenant/customers`, {
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
      <div className="col-span-2">
        <label className={labelCls}>Name *</label>
        <input name="name" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input name="email" type="email" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input name="phone" className={inputCls} />
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Address</label>
        <input name="address" className={inputCls} />
      </div>
      {error && <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="col-span-2">
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {isPending ? "Saving…" : "Add Customer"}
        </button>
      </div>
    </form>
  );
}
