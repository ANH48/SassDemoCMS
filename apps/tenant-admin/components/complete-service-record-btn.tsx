"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

export function CompleteServiceRecordBtn({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function complete() {
    startTransition(async () => {
      await fetch(`${API_URL}/tenant/service-records/${id}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      router.refresh();
    });
  }

  return (
    <button
      onClick={complete}
      disabled={isPending}
      className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
    >
      {isPending ? "…" : "Complete"}
    </button>
  );
}
