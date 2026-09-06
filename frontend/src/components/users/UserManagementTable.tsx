
"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, UserCog, XCircle } from "lucide-react";

import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/providers/AuthProvider";
import { getUsers, updateUserRole } from "@/lib/api/users";
import { queryKeys } from "@/lib/queryKeys";
import type { UserProfile, UserRole } from "@/lib/api/types";

const ROLES: UserRole[] = ["admin", "operator", "passenger"];

function roleBadgeClass(role: UserRole) {
  switch (role) {
    case "admin":
      return "bg-red-500/10 text-red-500";
    case "operator":
      return "bg-primary/10 text-primary";
    default:
      return "bg-border text-muted";
  }
}

export default function UserManagementTable() {
  const { profile: currentUser } = useAuth();
  const { data: users, loading, error, refresh } = useApiData(queryKeys.users, getUsers, []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function handleRoleChange(user: UserProfile, role: UserRole) {
    if (role === user.role) return;
    setSavingId(user.id);
    setRowError(null);
    try {
      await updateUserRole(user.id, { role });
      refresh();
    } catch {
      setRowError(`Couldn't update ${user.full_name}'s role - try again.`);
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleActive(user: UserProfile) {
    setSavingId(user.id);
    setRowError(null);
    try {
      await updateUserRole(user.id, { is_active: !user.is_active });
      refresh();
    } catch {
      setRowError(`Couldn't update ${user.full_name}'s status - try again.`);
    } finally {
      setSavingId(null);
    }
  }

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="rounded-3xl border border-border bg-card p-8">
        <div className="flex items-center gap-3 text-muted">
          <ShieldAlert size={20} />
          <p>Only admins can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">All Users</h2>
          <p className="mt-2 text-muted">
            Promote a user to operator/admin, or deactivate an account.
          </p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <UserCog className="text-primary" size={28} />
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
      )}
      {rowError && (
        <p className="mb-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{rowError}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-3 pr-4 font-semibold">Name</th>
                <th className="py-3 pr-4 font-semibold">Email</th>
                <th className="py-3 pr-4 font-semibold">Role</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isSaving = savingId === user.id;
                return (
                  <tr key={user.id} className="border-b border-border/60">
                    <td className="py-4 pr-4 font-semibold">
                      {user.full_name}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-muted">(you)</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-muted">{user.email ?? "-"}</td>
                    <td className="py-4 pr-4">
                      <select
                        value={user.role}
                        disabled={isSelf || isSaving}
                        onChange={(e) =>
                          handleRoleChange(user, e.target.value as UserRole)
                        }
                        className={`rounded-lg border border-border px-3 py-1.5 text-xs font-semibold capitalize ${roleBadgeClass(
                          user.role,
                        )} ${isSelf ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 pr-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle2 size={16} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-500">
                          <XCircle size={16} /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button
                        type="button"
                        disabled={isSelf || isSaving}
                        onClick={() => handleToggleActive(user)}
                        className={`inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted ${
                          isSelf ? "cursor-not-allowed opacity-60" : ""
                        }`}
                      >
                        {isSaving && <Loader2 size={14} className="animate-spin" />}
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(users ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
