import PageHeader from "@/components/layout/PageHeader";
import ProfilePage from "@/components/profile/ProfilePage";

export default function ProfileRoute() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Passenger identity and location preferences"
      />
      <ProfilePage />
    </div>
  );
}