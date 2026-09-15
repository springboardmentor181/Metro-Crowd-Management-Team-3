import PageHeader from "@/components/layout/PageHeader";
import InsufficientDataBanner from "@/components/dashboard/InsufficientDataBanner";
import AlertsManager from "@/components/dashboard/AlertsManager";

export default function AlertsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Alert & Notification Center"
        description="Overcrowding, delay, emergency, and maintenance alerts
          raised by admins and operators, station by station. Admins and
          operators can publish a new alert or mark one resolved here;
          everyone can see what's currently active. Real-time push/SMS/email
          dispatch is a later addition - this is the working alert log and
          resolve workflow behind it."
      />
      <InsufficientDataBanner />
      <AlertsManager />
    </div>
  );
}
