import PageHeader from "@/components/layout/PageHeader";
import EnquiryCenter from "@/components/dashboard/EnquiryCenter";

export default function EnquiriesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Enquiries"
        description="A professional two-way enquiry desk. Passengers send an
          enquiry and receive the metro team's response here. Admins and
          operators receive every incoming enquiry and manage it end to end -
          reply, mark in progress, or resolve."
      />
      <EnquiryCenter />
    </div>
  );
}