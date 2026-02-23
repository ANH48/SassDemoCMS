import Link from "next/link";
import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-gray-100 text-gray-600",
  CONFIRMED:  "bg-blue-100 text-blue-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  COMPLETED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
  let orders: any[] = [];
  try {
    orders = await apiClient.get<any[]>("/tenant/orders");
  } catch {
    // show empty
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Orders" />
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <Link href="/dashboard/orders/new" className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors">
            New Order
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders yet.</td></tr>
              )}
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-gray-800">{o.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">${Number(o.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/orders/${o.id}`} className="text-violet-600 hover:underline text-xs">Detail</Link>
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
