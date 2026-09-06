interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <h1 className="text-2xl font-black">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        {description}
      </p>
    </div>
  );
}
