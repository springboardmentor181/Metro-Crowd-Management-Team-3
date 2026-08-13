import PageHeader from "@/components/layout/PageHeader";
import InsufficientDataBanner from "@/components/dashboard/InsufficientDataBanner";
import PassengerChart from "@/components/dashboard/PassengerChart";
import AIInsights from "@/components/dashboard/AIInsights";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics Dashboard"
        description="Passenger traffic trends and AI-generated insights in one
          place - visible to admins and operators. Passenger traffic
          analytics and station performance reports here are computed from
          live ridership and schedule data, and AI Insights below surfaces
          the Prediction Module's crowd/demand forecasts and smart
          recommendations."
      />
      <InsufficientDataBanner />
      <div className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PassengerChart />
        </div>
        <AIInsights />
      </div>
    </div>
  );
}
