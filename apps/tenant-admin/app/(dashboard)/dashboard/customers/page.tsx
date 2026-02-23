import { Header } from "@/components/header";
import { CustomerForm } from "@/components/customer-form";
import { apiClient } from "@/lib/api-client";

export default async function CustomersPage() {
  let customers: any[] = [];
  try {
    customers = await apiClient.get<any[]>("/tenant/customers");
  } catch {
    // show empty
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Customers" />
      <main className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No customers yet.</td></tr>
              )}
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Add Customer</h2>
          <CustomerForm />
        </div>
      </main>
    </div>
  );
}
