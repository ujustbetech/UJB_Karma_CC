export default function EventInfoSkeleton() {
  return (
    <div className="p-6 space-y-8 animate-pulse">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="h-6 w-48 bg-gray-200 rounded" />
      </div>

      {/* 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>

          {/* Event Name */}
          <div className="space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>

          {/* Date Time */}
          <div className="space-y-2">
            <div className="h-3 w-28 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>

          {/* Zoom Link */}
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>

        {/* Toggle */}
        <div className="flex gap-6">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>

        {/* Agenda Blocks */}
        <div className="space-y-3">
          <div className="h-20 w-full bg-gray-200 rounded-lg" />
          <div className="h-20 w-full bg-gray-200 rounded-lg" />
          <div className="h-20 w-full bg-gray-200 rounded-lg" />
        </div>

        {/* Add Button */}
        <div className="h-10 w-44 bg-gray-200 rounded" />
      </div>

      {/* Save Bar */}
      <div className="flex justify-end pt-4 border-t">
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
