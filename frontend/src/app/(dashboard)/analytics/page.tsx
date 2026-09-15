import PageHeader from "@/components/layout/PageHeader";
import CrowdRegressionMetricsCard from "@/components/dashboard/CrowdRegressionMetricsCard";
import CrowdFeatureImportanceCard from "@/components/dashboard/CrowdFeatureImportanceCard";
import CrowdModelPerformanceCard from "@/components/dashboard/CrowdModelPerformanceCard";
import CrowdConfusionMatrixCard from "@/components/dashboard/CrowdConfusionMatrixCard";
import DelayModelMetricsCard from "@/components/dashboard/DelayModelMetricsCard";
import DelayFeatureImportanceCard from "@/components/dashboard/DelayFeatureImportanceCard";
import FrequencyModelMetricsCard from "@/components/dashboard/FrequencyModelMetricsCard";
import FrequencyFeatureImportanceCard from "@/components/dashboard/FrequencyFeatureImportanceCard";
import InsufficientDataBanner from "@/components/dashboard/InsufficientDataBanner";
import PassengerChart from "@/components/dashboard/PassengerChart";
import PassengerFlowByStation from "@/components/dashboard/PassengerFlowByStation";
import StationOccupancyChart from "@/components/dashboard/StationOccupancyChart";
import AIInsights from "@/components/dashboard/AIInsights";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Prediction & Analytics"
        description="Live evaluation of the production models - real accuracy, error
          and feature-importance numbers computed from the actual training
          datasets - together with passenger traffic trends and AI-generated
          insights, all in one place. Visible to admins and operators."
      />

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-muted">Crowd &amp; demand model</h2>

        <CrowdRegressionMetricsCard />

        <CrowdFeatureImportanceCard />

        <CrowdModelPerformanceCard />

        <CrowdConfusionMatrixCard />
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-muted">Delay prediction model</h2>

        <DelayModelMetricsCard />

        <DelayFeatureImportanceCard />
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-muted">Train frequency model</h2>

        <FrequencyModelMetricsCard />

        <FrequencyFeatureImportanceCard />
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-muted">Analytics dashboard</h2>

        <InsufficientDataBanner />
        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PassengerChart />
          </div>
          <AIInsights />
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PassengerFlowByStation />
          </div>
          <StationOccupancyChart />
        </div>
      </section>
    </div>
  );
}
