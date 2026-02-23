import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let tenant: any = null;
  try {
    tenant = await apiClient.get<any>(`/global/tenants/${id}`);
  } catch {
    notFound();
  }

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PROVISIONING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
    FAILED: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title={tenant?.name ?? "Tenant Detail"} />
      <main className="flex-1 p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-base font-semibold text-gray-800">Tenant Info</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[tenant?.status] ?? "bg-gray-100 text-gray-600"}`}>
              {tenant?.status}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">ID</dt>
              <dd className="font-mono text-gray-700 text-xs mt-0.5">{tenant?.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Slug</dt>
              <dd className="font-mono text-gray-700 mt-0.5">{tenant?.slug}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-700 mt-0.5">{new Date(tenant?.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Database URL</dt>
              <dd className="text-gray-700 mt-0.5 truncate">{tenant?.databaseUrl ? "Configured" : "Not set"}</dd>
            </div>
          </dl>
        </div>

        {tenant?.subscription && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Subscription</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Plan</dt>
                <dd className="text-gray-700 mt-0.5">{tenant.subscription?.plan?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="text-gray-700 mt-0.5">{tenant.subscription?.status ?? "—"}</dd>
              </div>
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}
