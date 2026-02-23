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
  const [products, orders, customers] = await Promise.allSettled([
    apiClient.get<any[]>("/tenant/products"),
    apiClient.get<any[]>("/tenant/orders"),
    apiClient.get<any[]>("/tenant/customers"),
  ]);

  const productList = products.status === "fulfilled" ? products.value : [];
  const orderList = orders.status === "fulfilled" ? orders.value : [];
  const customerList = customers.status === "fulfilled" ? customers.value : [];

  const totalRevenue = orderList
    .filter((o: any) => o.status === "COMPLETED")
    .reduce((sum: number, o: any) => sum + Number(o.total), 0);

  const recentOrders = orderList.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Dashboard" />
      <main className="flex-1 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Products" value={productList.length} />
          <StatCard label="Orders" value={orderList.length} />
          <StatCard label="Customers" value={customerList.length} />
          <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Recent Orders</p>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentOrders.map((o: any) => (
                <li key={o.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">{o.customer?.name ?? "—"}</span>
                  <span className="flex gap-3">
                    <span className="font-medium text-gray-800">${Number(o.total).toFixed(2)}</span>
                    <span className="text-gray-400">{o.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
