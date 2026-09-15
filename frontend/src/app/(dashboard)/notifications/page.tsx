import PageHeader from "@/components/layout/PageHeader";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Everything from the last 7 days - email notifications, operator-
          raised alerts, system announcements, and system failure notices, all
          in one place. Older notifications are automatically dropped from this
          list."
      />
      <NotificationCenter />
    </div>
  );
}
