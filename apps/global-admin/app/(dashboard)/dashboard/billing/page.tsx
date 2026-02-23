import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";

export default async function BillingPage() {
  let billing: any = null;
  try {
    billing = await apiClient.get<any>("/global/billing");
  } catch {
    // show empty
  }

  const records: any[] = billing?.records ?? (Array.isArray(billing) ? billing : []);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Billing" />
      <main className="flex-1 p-6">
        {billing?.summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">${billing.summary.totalRevenue ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{billing.summary.activeSubscriptions ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{billing.summary.pendingInvoices ?? 0}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No billing records.</td></tr>
              )}
              {records.map((r: any, i: number) => (
                <tr key={r.id ?? i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.tenant?.name ?? r.tenantId}</td>
                  <td className="px-4 py-3 text-gray-600">${r.amount}</td>
                  <td className="px-4 py-3 text-gray-500">{r.status}</td>
                  <td className="px-4 py-3 text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
