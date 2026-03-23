export function Spinner({ size = "sm" }: { size?: "sm"|"md"|"lg" }) {
  const s = { sm:"w-4 h-4", md:"w-6 h-6", lg:"w-8 h-8" }[size];
  return (
    <div className={`${s} border-2 rounded-full animate-spin`}
      style={{ borderColor:"var(--border)", borderTopColor:"var(--neon)" }} />
  );
}
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner size="md" />
      <span style={{ color:"var(--text3)", fontSize:12, letterSpacing:"0.1em" }}>LOADING</span>
    </div>
  );
}
