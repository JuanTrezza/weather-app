/** Skeleton con la forma de la tarjeta principal del clima, mientras se busca y gira el globo */
export default function Loading() {
  return (
    <div className="glass w-full max-w-[520px] rounded-hero p-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-2/3" />
          <div className="skeleton h-4 w-1/3" />
        </div>
        <div className="skeleton h-4 w-20" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="skeleton h-20 w-36 rounded-2xl" />
        <div className="skeleton h-20 w-20 rounded-full" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-4 w-2/5" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="skeleton h-16 rounded-card" />
        <div className="skeleton h-16 rounded-card" />
      </div>
    </div>
  );
}
