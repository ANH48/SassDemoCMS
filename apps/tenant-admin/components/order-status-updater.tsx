"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"];

interface OrderStatusUpdaterProps {
  orderId: string;
  current: string;
}

export function OrderStatusUpdater({ orderId, current }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(status: string) {
    startTransition(async () => {
      await fetch(`${API_URL}/tenant/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      router.refresh();
    });
  }

  return (
    <select
      value={current}
      onChange={(e) => update(e.target.value)}
      disabled={isPending}
      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
