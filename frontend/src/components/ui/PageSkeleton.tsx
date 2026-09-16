
export default function PageSkeleton() {
  return (
    <section className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="space-y-3">
        <div className="h-9 w-64 rounded-lg bg-card border border-border" />
        <div className="h-4 w-96 max-w-full rounded bg-card border border-border" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-3xl border border-border bg-card"
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-3xl border border-border bg-card" />
        <div className="h-80 rounded-3xl border border-border bg-card" />
      </div>
    </section>
  );
}
