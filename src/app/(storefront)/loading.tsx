"use client";

export default function StorefrontLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-pulse">
      {/* Banner Skeleton */}
      <div className="w-full aspect-[21/9] sm:aspect-[3/1] bg-slate-100 rounded-3xl" />

      {/* Rail 1 */}
      <div className="space-y-4">
        <div className="h-6 bg-slate-100 rounded-md w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-slate-100 rounded-2xl" />
              <div className="h-4 bg-slate-100 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Rail 2 */}
      <div className="space-y-4">
        <div className="h-6 bg-slate-100 rounded-md w-1/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-slate-100 rounded-2xl" />
              <div className="h-4 bg-slate-100 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
