import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductForm } from "@/components/product-form";
import { PackageItemsManager } from "@/components/package-items-manager";
import { apiClient } from "@/lib/api-client";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [productResult, categoriesResult, allProductsResult] = await Promise.allSettled([
    apiClient.get<any>(`/tenant/products/${id}`),
    apiClient.get<any[]>("/tenant/product-categories"),
    apiClient.get<any[]>("/tenant/products"),
  ]);

  if (productResult.status === "rejected") notFound();

  const product     = productResult.value;
  const categories  = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const allProducts = allProductsResult.status === "fulfilled" ? allProductsResult.value : [];
  const packageItems = product.packageItems ?? [];

  return (
    <div className="flex-1 flex flex-col">
      <Header title={product.name} />
      <main className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Edit Product</h2>
          <ProductForm categories={categories} product={product} />
        </div>

        {product.productType === "SERVICE_PACKAGE" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Package Items</h2>
            <PackageItemsManager
              productId={id}
              items={packageItems}
              allProducts={allProducts}
            />
          </div>
        )}
      </main>
    </div>
  );
}
