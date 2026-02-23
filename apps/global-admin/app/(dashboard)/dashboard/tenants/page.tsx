import Link from "next/link";
import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";

export default async function TenantsPage() {
  let tenants: any[] = [];

  try {
    const data = await apiClient.get<any>("/global/tenants");
    tenants = Array.isArray(data) ? data : data?.data ?? [];
  } catch {
    // show empty state
  }

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PROVISIONING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
    FAILED: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Tenants" />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">{tenants.length} tenant(s)</p>
          <Link
            href="/dashboard/tenants/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Tenant
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No tenants found.
                  </td>
                </tr>
              )}
              {tenants.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{t.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/tenants/${t.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
