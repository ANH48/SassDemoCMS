import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";
import { ServiceRecordForm } from "@/components/service-record-form";
import { CompleteServiceRecordBtn } from "@/components/complete-service-record-btn";

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

export default async function ServiceRecordsPage() {
  const [records, products, customers, team] = await Promise.allSettled([
    apiClient.get<any[]>("/tenant/service-records"),
    apiClient.get<any[]>("/tenant/products"),
    apiClient.get<any[]>("/tenant/customers"),
    apiClient.get<any[]>("/tenant/team"),
  ]);

  const recordList   = records.status   === "fulfilled" ? records.value   : [];
  const productList  = products.status  === "fulfilled" ? products.value  : [];
  const customerList = customers.status === "fulfilled" ? customers.value : [];
  const teamList     = team.status      === "fulfilled" ? team.value      : [];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Service Records" />
      <main className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recordList.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No service records yet.</td></tr>
              )}
              {recordList.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.product?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{r.staff?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
                      <CompleteServiceRecordBtn id={r.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">New Service Record</h2>
          <ServiceRecordForm products={productList} customers={customerList} teamMembers={teamList} />
        </div>
      </main>
    </div>
  );
}
