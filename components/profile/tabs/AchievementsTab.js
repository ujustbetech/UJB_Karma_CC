"use client";

import { useState } from "react";
import { Award, Pencil, FileText, ExternalLink } from "lucide-react";
import EditAchievementSheet from "./EditAchievementSheet";

export default function AchievementsTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);

  const achievements = Array.isArray(user?.achievementCertificates)
    ? user.achievementCertificates
    : [];

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-100 text-lg">
              Achievements
            </h3>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Pencil
              size={16}
              className="text-gray-500 hover:text-orange-500 transition"
            />
          </button>
        </div>

        {/* Content */}
        {achievements.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">

            {achievements.map((item, index) => {
              const isImage = item?.url?.match(/\.(jpg|jpeg|png|webp)$/i);
              const isPdf = item?.url?.match(/\.pdf$/i);

              return (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">

                    {isImage ? (
                      <img
                        src={item.url}
                        alt={`Achievement ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : isPdf ? (
                      <div className="flex flex-col items-center text-gray-500">
                        <FileText size={28} />
                        <span className="text-xs mt-2">PDF</span>
                      </div>
                    ) : (
                      <Award size={28} className="text-gray-400" />
                    )}

                  </div>

                  <div className="p-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {item.fileName || `Certificate ${index + 1}`}
                    </span>

                    <ExternalLink
                      size={14}
                      className="text-gray-400 group-hover:text-orange-500 transition"
                    />
                  </div>
                </a>
              );
            })}

          </div>
        ) : (
          <div className="text-center py-12">
            <Award size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              No achievements uploaded yet
            </p>
          </div>
        )}

      </div>

      {/* 🔥 Bottom Sheet Wired Here */}
      <EditAchievementSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}