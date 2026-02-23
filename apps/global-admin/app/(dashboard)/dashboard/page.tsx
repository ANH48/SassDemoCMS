import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  let tenants: any[] = [];

  try {
    const data = await apiClient.get<any>("/global/tenants");
    tenants = Array.isArray(data) ? data : data?.data ?? [];
  } catch {
    // API might not be running; show empty state
  }

  const active = tenants.filter((t) => t.status === "ACTIVE").length;
  const provisioning = tenants.filter((t) => t.status === "PROVISIONING").length;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Dashboard" />
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Tenants" value={tenants.length} />
          <StatCard label="Active Tenants" value={active} />
          <StatCard label="Provisioning" value={provisioning} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Recent Tenants</p>
          {tenants.length === 0 ? (
            <p className="text-sm text-gray-400">No tenants yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tenants.slice(0, 5).map((t: any) => (
                <li key={t.id} className="flex justify-between py-2 text-sm">
                  <span className="font-medium text-gray-700">{t.name}</span>
                  <span className="text-gray-400">{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
