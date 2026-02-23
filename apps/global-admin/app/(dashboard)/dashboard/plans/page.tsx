import { Header } from "@/components/header";
import { PlanForm } from "@/components/plan-form";
import { apiClient } from "@/lib/api-client";

export default async function PlansPage() {
  let plans: any[] = [];
  try {
    plans = await apiClient.get<any[]>("/global/plans");
  } catch {
    // show empty
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Plans" />
      <main className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Max Products</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Max Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No plans yet.</td></tr>
              )}
              {plans.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">${p.price}/mo</td>
                  <td className="px-4 py-3 text-gray-500">{p.maxProducts ?? "∞"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.maxUsers ?? "∞"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Create Plan</h2>
          <PlanForm />
        </div>
      </main>
    </div>
  );
}
