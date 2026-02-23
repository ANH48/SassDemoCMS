import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";
import { CategoryActions } from "@/components/category-actions";

export default async function ProductCategoriesPage() {
  let categories: any[] = [];
  try {
    categories = await apiClient.get<any[]>("/tenant/product-categories");
  } catch {
    // show empty
  }

  const nameMap = new Map(categories.map((c: any) => [c.id, c.name]));

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Product Categories" />
      <main className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sort Order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No categories yet.</td></tr>
              )}
              {categories.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.parentId ? nameMap.get(c.parentId) ?? "—" : "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{c.sortOrder ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <CategoryActions id={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Add Category</h2>
          <CategoryActions mode="create" categories={categories} />
        </div>
      </main>
    </div>
  );
}
