import { Header } from "@/components/header";

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header title="Settings" />
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-2">Store Settings</h2>
          <p className="text-sm text-gray-500">Tenant-specific settings coming in Phase 6.</p>
        </div>
      </main>
    </div>
  );
}
