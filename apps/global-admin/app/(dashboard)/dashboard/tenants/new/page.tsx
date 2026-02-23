import { Header } from "@/components/header";
import { TenantForm } from "@/components/tenant-form";
import { apiClient } from "@/lib/api-client";

export default async function NewTenantPage() {
  let plans: any[] = [];
  try {
    plans = await apiClient.get<any[]>("/global/plans");
  } catch {
    // plans optional
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="New Tenant" />
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Create Tenant</h2>
          <TenantForm plans={plans} />
        </div>
      </main>
    </div>
  );
}
