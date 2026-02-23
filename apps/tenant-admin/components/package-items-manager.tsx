"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

interface PackageItemsManagerProps {
  productId: string;
  items: any[];
  allProducts: any[];
}

export function PackageItemsManager({ productId, items, allProducts }: PackageItemsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      childProductId: form.get("childProductId"),
      quantity: Number(form.get("quantity")),
    };
    startTransition(async () => {
      const res = await fetch(`${API_URL}/tenant/products/${productId}/package-items`, {
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

  async function removeItem(itemId: string) {
    startTransition(async () => {
      await fetch(`${API_URL}/tenant/products/${productId}/package-items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      router.refresh();
    });
  }

  const inputCls = "px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {items.map((item: any) => (
            <li key={item.id} className="flex justify-between items-center py-2 text-sm">
              <span className="text-gray-800">{item.childProduct?.name}</span>
              <span className="flex items-center gap-4">
                <span className="text-gray-500">qty: {item.quantity}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">No items in this package.</p>
      )}

      <form onSubmit={addItem} className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Product</label>
          <select name="childProductId" required className={inputCls}>
            <option value="">Select product…</option>
            {allProducts.filter((p) => p.id !== productId).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quantity</label>
          <input name="quantity" type="number" min="1" defaultValue={1} required className={`${inputCls} w-20`} />
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {isPending ? "Adding…" : "Add Item"}
        </button>
      </form>
    </div>
  );
}
