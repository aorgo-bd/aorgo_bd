"use client";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Breadcrumbs */}
      <div className="h-4 bg-slate-100 rounded-md w-1/3" />

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-16">
        {/* Left Column: Gallery Mock */}
        <div className="lg:col-span-7 aspect-[4/5] bg-slate-100 rounded-2xl" />

        {/* Right Column: Info Details Mock */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="space-y-3">
            <div className="h-4 bg-slate-100 rounded-md w-1/4" />
            <div className="h-10 bg-slate-100 rounded-md w-3/4" />
          </div>
          <div className="h-6 bg-slate-100 rounded-md w-1/3" />
          <div className="h-12 bg-slate-100 rounded-xl w-1/2" />
          <div className="space-y-2">
            <div className="h-10 bg-slate-100 rounded-xl w-full" />
            <div className="h-10 bg-slate-100 rounded-xl w-full" />
          </div>
          <div className="h-28 bg-slate-50 border border-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
