import { Header } from "@/components/header";
import { OrderForm } from "@/components/order-form";
import { apiClient } from "@/lib/api-client";

export default async function NewOrderPage() {
  const [customers, products, team] = await Promise.allSettled([
    apiClient.get<any[]>("/tenant/customers"),
    apiClient.get<any[]>("/tenant/products"),
    apiClient.get<any[]>("/tenant/team"),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="New Order" />
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Create Order</h2>
          <OrderForm
            customers={customers.status === "fulfilled" ? customers.value : []}
            products={products.status === "fulfilled" ? products.value : []}
            teamMembers={team.status === "fulfilled" ? team.value : []}
          />
        </div>
      </main>
    </div>
  );
}
