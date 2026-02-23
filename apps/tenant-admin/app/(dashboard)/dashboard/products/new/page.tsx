import { Header } from "@/components/header";
import { ProductForm } from "@/components/product-form";
import { apiClient } from "@/lib/api-client";

export default async function NewProductPage() {
  let categories: any[] = [];
  try {
    categories = await apiClient.get<any[]>("/tenant/product-categories");
  } catch {
    // optional
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="New Product" />
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Create Product</h2>
          <ProductForm categories={categories} />
        </div>
      </main>
    </div>
  );
}
