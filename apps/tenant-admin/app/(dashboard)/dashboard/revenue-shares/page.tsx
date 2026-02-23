import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";
import { RevenueShareForm } from "@/components/revenue-share-form";

export default async function RevenueSharesPage() {
  let shares: any[] = [];
  try {
    shares = await apiClient.get<any[]>("/tenant/revenue-shares");
  } catch {
    // show empty
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Revenue Shares" />
      <main className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shares.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No revenue shares configured.</td></tr>
              )}
              {shares.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.type}</td>
                  <td className="px-4 py-3 text-gray-700">{Number(s.percentage).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Add Revenue Share</h2>
          <RevenueShareForm />
        </div>
      </main>
    </div>
  );
}
