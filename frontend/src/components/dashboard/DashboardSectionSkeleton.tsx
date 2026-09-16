
export default function DashboardSectionSkeleton({
  heightClass = "h-80",
}: {
  heightClass?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-3xl border border-border bg-card ${heightClass}`}
      aria-busy="true"
      aria-label="Loading section"
    />
  );
}
