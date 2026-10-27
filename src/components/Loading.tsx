export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[rgba(3,6,20,0.85)] backdrop-blur-[8px]"
    >
      <div
        className="h-12 w-12 animate-girar rounded-full border-[3px] border-[rgba(79,195,247,0.2)] border-t-atmos"
        aria-hidden="true"
      />
      <p>Buscando clima...</p>
    </div>
  );
}
