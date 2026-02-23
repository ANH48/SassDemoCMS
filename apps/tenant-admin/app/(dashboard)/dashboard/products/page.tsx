import Link from "next/link";
import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";

const TYPE_COLORS: Record<string, string> = {
  GOODS:            "bg-blue-100 text-blue-700",
  SERVICE:          "bg-purple-100 text-purple-700",
  SERVICE_PACKAGE:  "bg-violet-100 text-violet-700",
  MATERIAL_TRACKED: "bg-amber-100 text-amber-700",
  RAW_MATERIAL:     "bg-orange-100 text-orange-700",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; productType?: string; status?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.search)      qs.set("search", params.search);
  if (params.productType) qs.set("productType", params.productType);
  if (params.status)      qs.set("status", params.status);

  let products: any[] = [];
  try {
    products = await apiClient.get<any[]>(`/tenant/products?${qs.toString()}`);
  } catch {
    // show empty
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Products" />
      <main className="flex-1 p-6">
        <div className="flex gap-3 mb-4 flex-wrap">
          <form className="flex gap-2 flex-1">
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Search name / SKU…"
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 flex-1 max-w-xs"
            />
            <select name="productType" defaultValue={params.productType ?? ""} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="">All types</option>
              <option value="GOODS">Goods</option>
              <option value="SERVICE">Service</option>
              <option value="SERVICE_PACKAGE">Service Package</option>
              <option value="MATERIAL_TRACKED">Material (Tracked)</option>
              <option value="RAW_MATERIAL">Raw Material</option>
            </select>
            <select name="status" defaultValue={params.status ?? ""} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button type="submit" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Filter
            </button>
          </form>
          <Link
            href="/dashboard/products/new"
            className="px-4 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
          >
            New Product
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Price 1</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No products found.</td></tr>
              )}
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[p.productType] ?? "bg-gray-100 text-gray-600"}`}>
                      {p.productType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">${Number(p.sellingPrice1).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.stock ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.status === "ACTIVE" ? "text-green-600" : "text-gray-400"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/products/${p.id}`} className="text-violet-600 hover:underline text-xs">
                      Edit
                    </Link>
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
