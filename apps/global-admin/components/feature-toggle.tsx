"use client";

import { useTransition } from "react";

interface FeatureToggleProps {
  tenantId: string;
  featureId: string;
  featureKey: string;
  enabled: boolean;
}

export function FeatureToggle({ tenantId, featureId, featureKey, enabled }: FeatureToggleProps) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/global/tenants/${tenantId}/features`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ featureId, enabled: !enabled }),
        },
      );
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={featureKey}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
        enabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
          enabled ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
