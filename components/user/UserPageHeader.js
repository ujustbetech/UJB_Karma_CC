"use client";

import { Forum } from "next/font/google";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function UserPageHeader({
  title,
  description,
  icon: Icon,
  action = null,
  align = "left",
}) {
  const isCenter = align === "center";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-orange-400/15 px-6 py-6 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.95)] ${
        isCenter ? "text-center" : ""
      }`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(6,14,29,0.96), rgba(8,21,47,0.92), rgba(10,18,35,0.96)), url('/space.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%)]" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className={isCenter ? "w-full" : ""}>
          <div
            className={`flex items-center gap-3 ${
              isCenter ? "justify-center" : "justify-start"
            }`}
          >
            {Icon ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-400/25 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/10">
                <Icon size={20} />
              </div>
            ) : null}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/80">
                UJustBe Universe
              </p>
              <h1
                className={`${forum.className} mt-1 text-3xl tracking-tight text-slate-100 md:text-4xl`}
              >
                {title}
              </h1>
            </div>
          </div>

          {description ? (
            <p
              className={`mt-4 max-w-2xl text-sm leading-6 text-slate-300/85 md:text-base ${
                isCenter ? "mx-auto" : ""
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="relative z-10 self-start">{action}</div> : null}
      </div>
    </div>
  );
}
