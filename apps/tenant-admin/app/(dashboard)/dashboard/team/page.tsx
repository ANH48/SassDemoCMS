import { Header } from "@/components/header";
import { apiClient } from "@/lib/api-client";
import { TeamMemberForm } from "@/components/team-member-form";

export default async function TeamPage() {
  let members: any[] = [];
  try {
    members = await apiClient.get<any[]>("/tenant/team");
  } catch {
    // show empty
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Team" />
      <main className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No team members yet.</td></tr>
              )}
              {members.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === "TENANT_ADMIN" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Add Team Member</h2>
          <TeamMemberForm />
        </div>
      </main>
    </div>
  );
}
