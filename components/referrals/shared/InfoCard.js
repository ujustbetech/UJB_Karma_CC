'use client';

export default function InfoCard({
  title,
  icon: Icon,
  action,
  children,
  className = ""
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-4 ${className}`}
    >
      {(title || Icon || action) && (
        <div className="flex items-center justify-between mb-3">
          
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon size={18} className="text-slate-600" />
            )}
            {title && (
              <p className="text-sm font-semibold text-slate-800">
                {title}
              </p>
            )}
          </div>

          {action && (
            <div className="text-sm">
              {action}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 text-sm text-slate-600">
        {children}
      </div>
    </div>
  );
}