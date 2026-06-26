"use client";

export default function SellerLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 bg-slate-100 rounded-md w-1/4" />
        <div className="h-4 bg-slate-100 rounded-md w-1/3" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 border border-slate-150 rounded-2xl bg-white space-y-3">
            <div className="h-5 w-5 bg-slate-100 rounded-lg" />
            <div className="h-8 bg-slate-100 rounded-md w-1/2" />
            <div className="h-4 bg-slate-100 rounded-md w-2/3" />
          </div>
        ))}
      </div>

      {/* Main Table / Area */}
      <div className="border border-slate-150 rounded-2xl bg-white p-6 space-y-4">
        <div className="h-5 bg-slate-100 rounded-md w-1/5 mb-6" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-10 w-10 bg-slate-100 rounded-lg shrink-0" />
            <div className="h-4 bg-slate-100 rounded-md w-1/3" />
            <div className="h-4 bg-slate-100 rounded-md w-1/4 ml-auto" />
            <div className="h-6 bg-slate-100 rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
