"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

interface OrderFormProps {
  customers: any[];
  products: any[];
  teamMembers: any[];
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  priceTier?: number;
  discount?: number;
  staffId?: string;
}

export function OrderForm({ customers, products, teamMembers }: OrderFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<OrderItem[]>([
    { productId: "", quantity: 1, unitPrice: 0, priceTier: 1 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateItem(index: number, field: keyof OrderItem, value: any) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1, unitPrice: 0, priceTier: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form  = new FormData(e.currentTarget);
    const body  = {
      customerId: form.get("customerId") as string,
      items: items.map((item) => ({
        ...item,
        quantity:  Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        priceTier: item.priceTier ? Number(item.priceTier) : undefined,
        discount:  item.discount ? Number(item.discount) : 0,
        staffId:   item.staffId || undefined,
      })),
    };

    startTransition(async () => {
      const res = await fetch(`${API_URL}/tenant/orders`, {
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

      router.push("/dashboard/orders");
    });
  }

  const selectCls = "px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full";
  const inputCls  = "px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
        <select name="customerId" required className={selectCls}>
          <option value="">Select customer…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-slate-700">Line Items</p>
          <button type="button" onClick={addItem} className="text-xs text-violet-600 hover:underline">+ Add item</button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-6 gap-2 items-end bg-gray-50 rounded-lg p-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Product *</label>
                <select
                  value={item.productId}
                  onChange={(e) => {
                    const p = products.find((pr) => pr.id === e.target.value);
                    updateItem(index, "productId", e.target.value);
                    if (p) updateItem(index, "unitPrice", Number(p.sellingPrice1));
                  }}
                  required
                  className={selectCls}
                >
                  <option value="">Select…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Qty *</label>
                <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit Price *</label>
                <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tier</label>
                <select value={item.priceTier ?? 1} onChange={(e) => updateItem(index, "priceTier", Number(e.target.value))} className={selectCls}>
                  {[1, 2, 3, 4].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Discount</label>
                <input type="number" step="0.01" min="0" value={item.discount ?? 0} onChange={(e) => updateItem(index, "discount", e.target.value)} className={inputCls} />
              </div>
              {teamMembers.length > 0 && (
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Staff</label>
                  <select value={item.staffId ?? ""} onChange={(e) => updateItem(index, "staffId", e.target.value)} className={selectCls}>
                    <option value="">None</option>
                    {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} className="text-xs text-red-500 hover:text-red-700 col-span-1">Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className="px-5 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {isPending ? "Creating…" : "Create Order"}
        </button>
        <a href="/dashboard/orders" className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</a>
      </div>
    </form>
  );
}
