"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Heart,
  Music,
  Video,
  FileText,
  Tag,
  ImageOff,
  User,
} from "lucide-react";
import Link from "next/link";
import UserPageHeader from "@/components/user/UserPageHeader";
import { fetchUserDewdropContent } from "@/services/dewdropService";

export default function ContentPage() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH CONTENT ================= */
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const list = await fetchUserDewdropContent();
        setContents(list);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const getFormatIcon = (format) => {
    if (format === "Audio") return <Music size={16} />;
    if (format === "Video") return <Video size={16} />;
    return <FileText size={16} />;
  };
  const isTextFormat = (format) =>
    String(format || "").trim().toLowerCase() === "text";

  const stripHtml = (value) =>
    String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getTextPreview = (content) =>
    stripHtml(content?.textContentHtml || content?.contDiscription || "");
  const getPrimaryImage = (content) => {
    const format = String(content?.contentFormat || "").trim().toLowerCase();
    if (format === "image") {
      return content?.contentFileImages?.[0] || content?.Thumbnail?.[0] || "";
    }
    return content?.Thumbnail?.[0] || "";
  };
  const isImageFormat = (format) =>
    String(format || "").trim().toLowerCase() === "image";

  const truncateWords = (value, limit = 5) => {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= limit) {
      return {
        text: words.join(" "),
        truncated: false,
      };
    }
    return {
      text: words.slice(0, limit).join(" "),
      truncated: true,
    };
  };

  const getProfileImage = (item) => {
    if (Array.isArray(item?.lpProfile) && item.lpProfile[0]) return item.lpProfile[0];
    if (typeof item?.lpProfile === "string" && item.lpProfile.trim()) return item.lpProfile.trim();
    return "";
  };

  const isUjustBeOwner = (item) =>
    String(item?.ownershipType || "").trim().toLowerCase() === "ujustbe" ||
    String(item?.partnerNamelp || "").trim().toLowerCase() === "ujustbe";

  const getPartnerTypeLabel = (item) => {
    if (isUjustBeOwner(item)) return "Brand";
    return item?.partnerDesig || "Profile unavailable";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-6">
      <div className="space-y-5">

        {/* HEADER */}
        <UserPageHeader
          title="Content Library"
          description="Explore audio, video, and curated partner content designed to keep your learning momentum strong."
          icon={FileText}
        />

        {/* GRID */}
        <div className="grid grid-cols-1 gap-6">

          {contents.map((content) => {
            const profileImage = getProfileImage(content);
            const showUjustBeLogo = !profileImage && isUjustBeOwner(content);
            return (
            <Link
              href={`/user/dewdrop/content/${content.id}`}
              key={content.id}
              className="block bg-white rounded-3xl shadow-md border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition duration-300"
            >
              {/* THUMBNAIL */}
              <div className="relative h-48 bg-gray-100">
                {getPrimaryImage(content) ? (
                  <img
                    src={getPrimaryImage(content)}
                    alt={content.contentName || "Content thumbnail"}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`absolute inset-0 ${
                    getPrimaryImage(content) ? "hidden" : "flex"
                  } items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500`}
                >
                  {isTextFormat(content.contentFormat) ? (
                    <div className="mx-4 w-full rounded-2xl border border-indigo-100 bg-white/90 px-5 py-4 text-left text-slate-700 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-500 mb-2">
                        Text Content
                      </p>
                      <p className="text-sm leading-6 line-clamp-4 text-slate-700">
                        {getTextPreview(content) || "No text content added."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageOff size={28} />
                      <span className="text-sm font-medium">
                        {isImageFormat(content.contentFormat) ? "Image unavailable" : "Media preview unavailable"}
                      </span>
                    </div>
                  )}
                </div>

                {/* FORMAT BADGE */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs flex items-center gap-1 font-medium shadow">
                  {getFormatIcon(content.contentFormat)}
                  {content.contentFormat}
                </div>
              </div>

              {/* CONTENT BODY */}
              <div className="p-6">

                {/* TITLE */}
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {content.contentName}
                </h3>

                {/* DESCRIPTION */}
                {isTextFormat(content.contentFormat) ? (
                  <p className="text-sm leading-6 text-gray-500 line-clamp-2 mb-4">
                    {(() => {
                      const summary = truncateWords(content.contDiscription, 5);
                      return (
                        <>
                          {summary.text || "No description added."}
                          {summary.truncated ? (
                            <span className="ml-1 font-medium text-indigo-600">View more</span>
                          ) : null}
                        </>
                      );
                    })()}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-gray-500 line-clamp-2 mb-4">
                    {stripHtml(content.contDiscription)}
                  </p>
                )}

                {/* TAGS */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {content.inputTag?.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* PARTNER INFO */}
                <div className="flex items-center gap-3 mb-4">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={content.partnerNamelp || "UjustBe"}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  {showUjustBeLogo ? (
                    <img
                      src="/ujustbe-logo.svg"
                      alt="UjustBe"
                      className="h-10 w-10 rounded-full border border-slate-200 bg-white p-1 object-contain"
                    />
                  ) : null}
                  <div
                    className={`${
                      profileImage || showUjustBeLogo ? "hidden" : "flex"
                    } h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500`}
                  >
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {content.partnerNamelp || "UjustBe"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {getPartnerTypeLabel(content)}
                    </p>
                  </div>
                </div>

                {/* STATS */}
                <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {content.totalViews || 0}
                    </span>

                    <span className="flex items-center gap-1">
                      <Heart size={14} />
                      {content.totallike || 0}
                    </span>
                  </div>
                </div>

              </div>
            </Link>
            );
          })}

        </div>
      </div>
    </main>
  );
}


