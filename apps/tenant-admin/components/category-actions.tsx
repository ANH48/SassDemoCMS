"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

interface CategoryActionsProps {
  mode?: "create" | "delete";
  id?: string;
  categories?: any[];
}

export function CategoryActions({ mode = "delete", id, categories = [] }: CategoryActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (mode === "delete" && id) {
    return (
      <button
        onClick={() => {
          startTransition(async () => {
            const res = await fetch(`${API_URL}/tenant/product-categories/${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: "Delete failed" }));
              setError(err.message);
            } else {
              router.refresh();
            }
          });
        }}
        disabled={isPending}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        {error ?? "Delete"}
      </button>
    );
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body: any = { name: form.get("name") };
    if (form.get("parentId")) body.parentId = form.get("parentId");
    if (form.get("sortOrder")) body.sortOrder = Number(form.get("sortOrder"));

    startTransition(async () => {
      const res = await fetch(`${API_URL}/tenant/product-categories`, {
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

  return (
    <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Name *</label>
        <input name="name" required className={inputCls} placeholder="Category name" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Parent</label>
        <select name="parentId" className={inputCls}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
        <input name="sortOrder" type="number" min="0" className={`${inputCls} w-24`} defaultValue={0} />
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Saving…" : "Add"}
      </button>
    </form>
  );
}
