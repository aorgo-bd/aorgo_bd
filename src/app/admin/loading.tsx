"use client";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 bg-slate-100 rounded-md w-1/5" />
        <div className="h-4 bg-slate-100 rounded-md w-1/4" />
      </div>

      {/* Grid boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 border border-slate-150 rounded-2xl bg-white space-y-4">
            <div className="h-5 bg-slate-100 rounded-md w-1/3" />
            <div className="h-12 bg-slate-100 rounded-md w-1/2" />
            <div className="h-4 bg-slate-100 rounded-md w-2/3" />
          </div>
        ))}
      </div>

      {/* List mock */}
      <div className="border border-slate-150 rounded-2xl bg-white p-6 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 bg-slate-100 rounded-md w-1/6" />
          <div className="h-8 bg-slate-100 rounded-md w-24" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            <div className="h-4 bg-slate-100 rounded-md w-1/4" />
            <div className="h-4 bg-slate-100 rounded-md w-1/6 ml-auto" />
            <div className="h-6 bg-slate-100 rounded-full w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
