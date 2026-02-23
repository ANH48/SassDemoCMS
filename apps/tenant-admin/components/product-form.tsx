"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

const PRODUCT_TYPES = [
  { value: "GOODS",            label: "Goods" },
  { value: "SERVICE",          label: "Service" },
  { value: "SERVICE_PACKAGE",  label: "Service Package" },
  { value: "MATERIAL_TRACKED", label: "Material (Tracked)" },
  { value: "RAW_MATERIAL",     label: "Raw Material" },
];

const INVENTORY_TYPES = new Set(["GOODS", "MATERIAL_TRACKED", "RAW_MATERIAL"]);
const SERVICE_TYPES   = new Set(["SERVICE", "SERVICE_PACKAGE"]);

interface ProductFormProps {
  categories: any[];
  product?: any;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [productType, setProductType] = useState<string>(product?.productType ?? "GOODS");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasInventory = INVENTORY_TYPES.has(productType);
  const isService    = SERVICE_TYPES.has(productType);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const body: any = {
      name:          form.get("name"),
      sku:           form.get("sku") || undefined,
      description:   form.get("description") || undefined,
      productType:   productType,
      categoryId:    form.get("categoryId") || undefined,
      sellingPrice1: Number(form.get("sellingPrice1")),
      unit:          form.get("unit") || undefined,
    };

    const optNum = (k: string) => form.get(k) ? Number(form.get(k)) : undefined;

    body.sellingPrice2    = optNum("sellingPrice2");
    body.sellingPrice3    = optNum("sellingPrice3");
    body.sellingPrice4    = optNum("sellingPrice4");
    body.importPrice      = optNum("importPrice");
    body.costPrice        = optNum("costPrice");
    body.commissionRate1  = optNum("commissionRate1");
    body.commissionRate2  = optNum("commissionRate2");
    body.commissionRate3  = optNum("commissionRate3");
    body.isDefault        = form.get("isDefault") === "on";
    body.isOpenPrice      = form.get("isOpenPrice") === "on";

    if (hasInventory) {
      body.stock    = optNum("stock");
      body.minStock = optNum("minStock");
    }

    if (isService) {
      body.treatmentCycleDays = optNum("treatmentCycleDays");
      body.treatmentSessions  = optNum("treatmentSessions");
    }

    startTransition(async () => {
      const url    = isEdit ? `${API_URL}/tenant/products/${product.id}` : `${API_URL}/tenant/products`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        setError(Array.isArray(err.message) ? err.message.join(", ") : err.message);
        return;
      }

      if (isEdit) {
        router.refresh();
      } else {
        router.push("/dashboard/products");
      }
    });
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";
  const sectionCls = "grid grid-cols-2 gap-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Type + Basic */}
      <div>
        <label className={labelCls}>Product Type</label>
        <select value={productType} onChange={(e) => setProductType(e.target.value)} className={inputCls}>
          {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className={sectionCls}>
        <div>
          <label className={labelCls}>Name *</label>
          <input name="name" required defaultValue={product?.name} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>SKU</label>
          <input name="sku" defaultValue={product?.sku} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea name="description" rows={2} defaultValue={product?.description} className={inputCls} />
      </div>

      <div className={sectionCls}>
        <div>
          <label className={labelCls}>Category</label>
          <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={inputCls}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Unit</label>
          <input name="unit" defaultValue={product?.unit} className={inputCls} placeholder="pcs, kg, bottle…" />
        </div>
      </div>

      {/* Pricing */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-xs font-semibold text-gray-500 px-1">Pricing</legend>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className={labelCls}>Selling Price 1 *</label>
            <input name="sellingPrice1" type="number" step="0.01" min="0" required defaultValue={product?.sellingPrice1} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Selling Price 2</label>
            <input name="sellingPrice2" type="number" step="0.01" min="0" defaultValue={product?.sellingPrice2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Selling Price 3</label>
            <input name="sellingPrice3" type="number" step="0.01" min="0" defaultValue={product?.sellingPrice3} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Selling Price 4</label>
            <input name="sellingPrice4" type="number" step="0.01" min="0" defaultValue={product?.sellingPrice4} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Import Price</label>
            <input name="importPrice" type="number" step="0.01" min="0" defaultValue={product?.importPrice} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cost Price</label>
            <input name="costPrice" type="number" step="0.01" min="0" defaultValue={product?.costPrice} className={inputCls} />
          </div>
        </div>
      </fieldset>

      {/* Inventory — only for inventory types */}
      {hasInventory && (
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-xs font-semibold text-gray-500 px-1">Inventory</legend>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className={labelCls}>Stock</label>
              <input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Min Stock</label>
              <input name="minStock" type="number" min="0" defaultValue={product?.minStock} className={inputCls} />
            </div>
          </div>
        </fieldset>
      )}

      {/* Commission */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-xs font-semibold text-gray-500 px-1">Commission Rates (%)</legend>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[1, 2, 3].map((n) => (
            <div key={n}>
              <label className={labelCls}>Level {n}</label>
              <input name={`commissionRate${n}`} type="number" step="0.01" min="0" max="100" defaultValue={(product as any)?.[`commissionRate${n}`]} className={inputCls} />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Service fields */}
      {isService && (
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-xs font-semibold text-gray-500 px-1">Service Details</legend>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className={labelCls}>Treatment Cycle (days)</label>
              <input name="treatmentCycleDays" type="number" min="1" defaultValue={product?.treatmentCycleDays} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sessions</label>
              <input name="treatmentSessions" type="number" min="1" defaultValue={product?.treatmentSessions} className={inputCls} />
            </div>
          </div>
        </fieldset>
      )}

      {/* Flags */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input name="isDefault" type="checkbox" defaultChecked={product?.isDefault} className="rounded" />
          Default product
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input name="isOpenPrice" type="checkbox" defaultChecked={product?.isOpenPrice} className="rounded" />
          Open price
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
        </button>
        <a href="/dashboard/products" className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </a>
      </div>
    </form>
  );
}
