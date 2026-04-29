"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Eye, Heart, Music, Video, FileText, Tag, ImageOff, User } from "lucide-react";
import {
  fetchUserDewdropContentDetails,
  likeUserDewdropContent,
} from "@/services/dewdropService";

export default function ContentDetails() {
  const { id } = useParams();

  const [content, setContent] = useState(null);
  const [liked, setLiked] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchContent = async () => {
      const record = await fetchUserDewdropContentDetails(id);
      if (record) {
        setContent(record);
      }
    };

    fetchContent();
  }, [id]);

  const handleLike = async () => {
    if (liked) return;
    const updated = await likeUserDewdropContent(id);
    if (updated) setContent(updated);

    setLiked(true);
    setAnimateLike(true);

    setTimeout(() => setAnimateLike(false), 600);
  };

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1120] text-white">
        Loading...
      </div>
    );
  }

  const getFormatIcon = (format) => {
    if (format === "Audio") return <Music size={16} />;
    if (format === "Video") return <Video size={16} />;
    return <FileText size={16} />;
  };

  return (
    <div className="min-h-screen bg-[#0b1120] flex justify-center pb-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden mt-6">
        <div className="flex items-center gap-3 p-4 border-b">
          {content.lpProfile?.[0] ? (
            <img
              src={content.lpProfile[0]}
              alt={content.partnerNamelp || "Partner"}
              className="w-10 h-10 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`${
              content.lpProfile?.[0] ? "hidden" : "flex"
            } h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500`}
          >
            <User size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {content.partnerNamelp || "Partner"}
            </p>
            <p className="text-xs text-gray-400">
              {content.partnerDesig || "Profile unavailable"}
            </p>
          </div>
        </div>

        <div className="relative bg-black">
          {content.contentFormat === "Video" ? (
            <video
              controls
              className="w-full max-h-[500px] object-cover"
              src={content.contentFile?.[0]}
            />
          ) : (
            <div className="relative min-h-[280px] bg-slate-100">
              {content.Thumbnail?.[0] ? (
                <img
                  src={content.Thumbnail[0]}
                  alt={content.contentName || "Content thumbnail"}
                  className="w-full max-h-[500px] object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`${
                  content.Thumbnail?.[0] ? "hidden" : "flex"
                } absolute inset-0 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500`}
              >
                <div className="flex flex-col items-center gap-3">
                  <ImageOff size={36} />
                  <span className="text-sm font-medium">No image available</span>
                </div>
              </div>
            </div>
          )}

          {animateLike && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart
                size={120}
                className="text-red-500 animate-ping"
                fill="currentColor"
              />
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium mb-2">
            {getFormatIcon(content.contentFormat)}
            {content.contentFormat}
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {content.contentName}
          </h2>

          <p className="text-sm text-gray-600 mb-4">{content.contDiscription}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {content.inputTag?.map((tag, index) => (
              <span
                key={index}
                className="bg-indigo-100 text-indigo-600 text-xs px-3 py-1 rounded-full flex items-center gap-1"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex justify-between items-center border-t pt-3 text-sm">
            <div className="flex items-center gap-5 text-gray-500">
              <span className="flex items-center gap-1">
                <Eye size={16} />
                {content.totalViews || 0}
              </span>

              <button
                onClick={handleLike}
                className={`flex items-center gap-1 transition ${
                  liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                }`}
              >
                <Heart size={18} fill={liked ? "currentColor" : "none"} />
                {content.totallike || 0}
              </button>
            </div>

            <span className="font-semibold text-indigo-600">
              CP {content.totalCp || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


