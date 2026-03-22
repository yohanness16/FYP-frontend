export function Spinner({ size = "sm" }: { size?: "sm"|"md"|"lg" }) {
  const s = { sm:"w-4 h-4", md:"w-6 h-6", lg:"w-8 h-8" }[size];
  return <div className={`${s} border-2 rounded-full animate-spin`} style={{ borderColor:"var(--border)", borderTopColor:"var(--brand)" }} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="md" />
    </div>
  );
}
