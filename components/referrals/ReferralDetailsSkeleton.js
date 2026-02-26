"use client";

export default function ReferralDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      
      {/* Header */}
      <div className="shadow-sm">
        <div className="h-6 w-40 bg-slate-200 rounded mb-3"></div>
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
      </div>

      {/* Card Section */}
      <div className="space-y-4">

        {/* Main Info Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="h-5 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-full bg-slate-200 rounded"></div>
          <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
          <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
        </div>

        {/* Status / Timeline */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <div className="h-5 w-28 bg-slate-200 rounded"></div>

          <div className="space-y-3">
            <div className="h-3 w-full bg-slate-200 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
            <div className="h-3 w-4/6 bg-slate-200 rounded"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <div className="h-10 flex-1 bg-slate-200 rounded-lg"></div>
          <div className="h-10 flex-1 bg-slate-200 rounded-lg"></div>
        </div>

      </div>
    </div>
  );
}