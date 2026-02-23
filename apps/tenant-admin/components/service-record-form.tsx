"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

interface ServiceRecordFormProps {
  products: any[];
  customers: any[];
  teamMembers: any[];
}

export function ServiceRecordForm({ products, customers, teamMembers }: ServiceRecordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const serviceProducts = products.filter(
    (p) => p.productType === "SERVICE" || p.productType === "SERVICE_PACKAGE",
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body: any = {
      productId:  form.get("productId"),
      customerId: form.get("customerId"),
      staffId:    form.get("staffId"),
    };
    if (form.get("notes")) body.notes = form.get("notes");

    startTransition(async () => {
      const res = await fetch(`${API_URL}/tenant/service-records`, {
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

  const selectCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  const labelCls  = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-w-xl">
      <div>
        <label className={labelCls}>Service / Package *</label>
        <select name="productId" required className={selectCls}>
          <option value="">Select…</option>
          {serviceProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Customer *</label>
        <select name="customerId" required className={selectCls}>
          <option value="">Select…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Staff *</label>
        <select name="staffId" required className={selectCls}>
          <option value="">Select…</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <input name="notes" className={selectCls} />
      </div>
      {error && <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="col-span-2">
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {isPending ? "Creating…" : "Create Record"}
        </button>
      </div>
    </form>
  );
}
