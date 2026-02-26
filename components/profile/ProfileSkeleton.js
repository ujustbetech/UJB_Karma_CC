"use client";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">

      {/* ================= HERO SECTION ================= */}
      <div className="relative h-[320px] w-full bg-gray-200">
        
        {/* Edit button */}
        <div className="absolute top-4 right-4 w-10 h-10 bg-gray-300 rounded-full" />

        {/* Center content */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center space-y-3">
          <div className="h-6 w-40 bg-gray-300 rounded" />
          <div className="h-4 w-32 bg-gray-300 rounded" />
          <div className="h-8 w-24 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="bg-white border-b px-4 py-4 flex justify-between">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="h-3 w-14 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* ================= CARD SECTION ================= */}
      <div className="px-4 py-6 space-y-4">

        {/* Card */}
        <div className="bg-gray-100 rounded-2xl p-5 space-y-5">
          
          {/* Card Title */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-gray-300 rounded" />
            <div className="w-6 h-6 bg-gray-300 rounded-full" />
          </div>

          {/* Two column content */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-300 rounded" />
              <div className="h-4 w-20 bg-gray-300 rounded" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-300 rounded" />
              <div className="h-4 w-20 bg-gray-300 rounded" />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}