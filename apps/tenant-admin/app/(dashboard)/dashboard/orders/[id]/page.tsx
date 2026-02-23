import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { OrderStatusUpdater } from "@/components/order-status-updater";
import { apiClient } from "@/lib/api-client";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let order: any = null;
  try {
    order = await apiClient.get<any>(`/tenant/orders`);
    // find the specific order from list since no single-order endpoint
    const orders = Array.isArray(order) ? order : [];
    order = orders.find((o: any) => o.id === id);
  } catch {
    notFound();
  }

  if (!order) notFound();

  return (
    <div className="flex-1 flex flex-col">
      <Header title={`Order ${order.id.slice(0, 8)}…`} />
      <main className="flex-1 p-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-semibold text-gray-800">{order.customer?.name ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-800">${Number(order.total).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <OrderStatusUpdater orderId={order.id} current={order.status} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unit Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Discount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(order.items ?? []).map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.product?.name ?? item.productId}</td>
                  <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">${Number(item.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400">{item.priceTier ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400">${Number(item.discount ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400">{item.staffId ? item.staffId.slice(0, 8) + "…" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
