import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";

export default async function SubscriptionsPage() {
  let subscriptions: any[] = [];
  try {
    subscriptions = await apiClient.get<any[]>("/global/subscriptions");
  } catch {
    // show empty
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Subscriptions" />
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rental Fee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No subscriptions.</td></tr>
              )}
              {subscriptions.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.tenant?.name ?? s.tenantId}</td>
                  <td className="px-4 py-3 text-gray-600">{s.plan?.name ?? s.planId}</td>
                  <td className="px-4 py-3 text-gray-500">{s.status}</td>
                  <td className="px-4 py-3 text-gray-500">{s.rentalFee ? `$${s.rentalFee}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : "—"}
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
