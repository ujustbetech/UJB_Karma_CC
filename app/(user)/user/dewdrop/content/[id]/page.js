"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Eye, Heart, Music, Video, FileText, Tag, ImageOff, User } from "lucide-react";
import {
  fetchUserDewdropContentDetails,
  likeUserDewdropContent,
} from "@/services/dewdropService";

export default function ContentDetails() {
  const { id } = useParams();
  const audioRef = useRef(null);

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

  const isAudioFormat =
    String(content?.contentFormat || "").trim().toLowerCase() === "audio";
  const mediaUrl =
    content?.contentFileImages?.[0] ||
    content?.contentFile?.[0] ||
    "";
  const imageUrl = content?.contentFileImages?.[0] || content?.Thumbnail?.[0] || "";

  useEffect(() => {
    if (!isAudioFormat || !audioRef.current || !mediaUrl) return;
    const player = audioRef.current;
    const tryPlay = async () => {
      try {
        await player.play();
      } catch {
        // Browser autoplay policy may block; controls remain available.
      }
    };
    tryPlay();
  }, [isAudioFormat, mediaUrl]);

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
        <div className="h-14 w-14 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
      </div>
    );
  }

  const getFormatIcon = (format) => {
    if (format === "Audio") return <Music size={16} />;
    if (format === "Video") return <Video size={16} />;
    return <FileText size={16} />;
  };
  const isTextFormat =
    String(content?.contentFormat || "").trim().toLowerCase() === "text";
  const textContentHtml = content.textContentHtml || content.contDiscription || "";
  const profileImage =
    (Array.isArray(content.lpProfile) && content.lpProfile[0]) ||
    (typeof content.lpProfile === "string" && content.lpProfile.trim()) ||
    "";
  const showUjustBeLogo =
    !profileImage &&
    (
      String(content.ownershipType || "").trim().toLowerCase() === "ujustbe" ||
      String(content.partnerNamelp || "").trim().toLowerCase() === "ujustbe"
    );
  const partnerTypeLabel = showUjustBeLogo ||
    String(content.ownershipType || "").trim().toLowerCase() === "ujustbe" ||
    String(content.partnerNamelp || "").trim().toLowerCase() === "ujustbe"
    ? "Brand"
    : (content.partnerDesig || "Profile unavailable");

  return (
    <div className="min-h-screen bg-[#0b1120] flex justify-center pb-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden mt-6">
        <div className="flex items-center gap-3 p-4 border-b">
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
            <p className="text-sm font-semibold text-gray-800">
              {content.partnerNamelp || "UjustBe"}
            </p>
            <p className="text-xs text-gray-400">
              {partnerTypeLabel}
            </p>
          </div>
        </div>

        <div className="relative bg-black">
          {content.contentFormat === "Video" ? (
            <video
              controls
              autoPlay
              muted
              playsInline
              className="w-full max-h-[500px] object-cover"
              src={mediaUrl}
            />
          ) : isAudioFormat ? (
            <div className="min-h-[220px] p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex flex-col items-center justify-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Music size={24} />
              </div>
              <audio
                ref={audioRef}
                controls
                autoPlay
                className="w-full max-w-md"
                src={mediaUrl}
              />
            </div>
          ) : isTextFormat ? (
            <div className="min-h-[280px] p-5 bg-gradient-to-br from-slate-50 to-indigo-50/60 text-slate-800 overflow-auto">
              <div
                className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm prose prose-sm max-w-none prose-headings:mt-0 prose-headings:text-slate-800 prose-p:text-slate-700 prose-p:leading-7 prose-li:leading-7 prose-strong:text-slate-800"
                dangerouslySetInnerHTML={{
                  __html: textContentHtml || "<p>No text content added.</p>",
                }}
              />
            </div>
          ) : (
            <div className="relative min-h-[280px] bg-slate-100">
              {imageUrl ? (
                <img
                  src={imageUrl}
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
                  imageUrl ? "hidden" : "flex"
                } absolute inset-0 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500`}
              >
                <div className="flex flex-col items-center gap-3">
                  <ImageOff size={36} />
                  <span className="text-sm font-medium">Media preview unavailable</span>
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

          {!isTextFormat ? (
            <p className="text-sm text-gray-600 mb-4">{content.contDiscription}</p>
          ) : null}

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
          </div>
        </div>
      </div>
    </div>
  );
}


