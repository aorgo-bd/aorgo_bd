"use client";

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      {/* Breadcrumbs */}
      <div className="h-4 bg-slate-100 rounded-md w-1/4" />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Mock */}
        <div className="hidden lg:block w-[260px] h-[550px] bg-slate-50 border border-slate-100 rounded-2xl shrink-0" />

        {/* Product Grid Mock */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <div className="h-7 bg-slate-100 rounded-md w-48" />
              <div className="h-4 bg-slate-100 rounded-md w-24" />
            </div>
            <div className="h-10 bg-slate-100 rounded-lg w-40" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] bg-slate-100 rounded-2xl" />
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-4 bg-slate-100 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
