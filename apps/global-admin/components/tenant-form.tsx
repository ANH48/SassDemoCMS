"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
}

interface TenantFormProps {
  plans: Plan[];
}

export function TenantForm({ plans }: TenantFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const body = {
      name: form.get("name"),
      slug: form.get("slug"),
      adminEmail: form.get("adminEmail"),
      adminPassword: form.get("adminPassword"),
      adminName: form.get("adminName"),
      planId: form.get("planId") || undefined,
    };

    startTransition(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/global/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create tenant" }));
        setError(Array.isArray(err.message) ? err.message.join(", ") : err.message);
        return;
      }

      const tenant = await res.json();
      router.push(`/dashboard/tenants/${tenant.id}`);
    });
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className={labelClass}>Tenant Name</label>
        <input name="name" required className={inputClass} placeholder="My Store" />
      </div>
      <div>
        <label className={labelClass}>Slug</label>
        <input name="slug" required pattern="[a-z0-9][a-z0-9_-]*" className={inputClass} placeholder="my-store" />
        <p className="text-xs text-gray-400 mt-1">Lowercase alphanumeric, hyphens, underscores</p>
      </div>
      <div>
        <label className={labelClass}>Admin Name</label>
        <input name="adminName" required className={inputClass} placeholder="John Doe" />
      </div>
      <div>
        <label className={labelClass}>Admin Email</label>
        <input name="adminEmail" type="email" required className={inputClass} placeholder="admin@mystore.com" />
      </div>
      <div>
        <label className={labelClass}>Admin Password</label>
        <input name="adminPassword" type="password" minLength={6} required className={inputClass} />
      </div>
      {plans.length > 0 && (
        <div>
          <label className={labelClass}>Plan (optional)</label>
          <select name="planId" className={inputClass}>
            <option value="">No plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Creating…" : "Create Tenant"}
        </button>
        <a href="/dashboard/tenants" className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </a>
      </div>
    </form>
  );
}
