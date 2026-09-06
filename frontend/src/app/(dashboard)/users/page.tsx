import PageHeader from "@/components/layout/PageHeader";
import UserManagementTable from "@/components/users/UserManagementTable";

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Every account registered with MetroFlow AI. Admins can promote
          a user to operator or admin, or deactivate an account - the same
          role-based access control the backend already enforces on every
          request, now with a UI instead of only the set_user_role.py script."
      />
      <UserManagementTable />
    </div>
  );
}
