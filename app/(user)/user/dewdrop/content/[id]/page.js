"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import {
  Eye,
  Heart,
  Music,
  Video,
  FileText,
  Tag,
} from "lucide-react";

export default function ContentDetails() {
  const { id } = useParams();

  const [content, setContent] = useState(null);
  const [liked, setLiked] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);

  /* ================= FETCH CONTENT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchContent = async () => {
      const docRef = doc(db, "ContentData", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setContent({ id: snap.id, ...snap.data() });

        // Increment view count
        await updateDoc(docRef, {
          totalViews: increment(1),
        });
      }
    };

    fetchContent();
  }, [id]);

  /* ================= LIKE FUNCTION ================= */
  const handleLike = async () => {
    if (liked) return;

    const docRef = doc(db, "ContentData", id);

    await updateDoc(docRef, {
      totallike: increment(1),
    });

    setContent((prev) => ({
      ...prev,
      totallike: (prev.totallike || 0) + 1,
    }));

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

      {/* MOBILE WRAPPER */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden mt-6">

        {/* HEADER */}
        <div className="flex items-center gap-3 p-4 border-b">
          <img
            src={content.lpProfile?.[0] || "/avatar.png"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {content.partnerNamelp}
            </p>
            <p className="text-xs text-gray-400">
              {content.partnerDesig}
            </p>
          </div>
        </div>

        {/* IMAGE / MEDIA */}
        <div className="relative bg-black">

          {content.contentFormat === "Video" ? (
            <video
              controls
              className="w-full max-h-[500px] object-cover"
              src={content.contentFile?.[0]}
            />
          ) : (
            <img
              src={content.Thumbnail?.[0] || "/placeholder.jpg"}
              className="w-full max-h-[500px] object-cover"
            />
          )}

          {/* Big Heart Animation */}
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

        {/* BODY */}
        <div className="p-4">

          {/* FORMAT */}
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium mb-2">
            {getFormatIcon(content.contentFormat)}
            {content.contentFormat}
          </div>

          {/* TITLE */}
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {content.contentName}
          </h2>

          {/* CAPTION */}
          <p className="text-sm text-gray-600 mb-4">
            {content.contDiscription}
          </p>

          {/* TAGS */}
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

          {/* STATS */}
          <div className="flex justify-between items-center border-t pt-3 text-sm">

            <div className="flex items-center gap-5 text-gray-500">

              <span className="flex items-center gap-1">
                <Eye size={16} />
                {content.totalViews || 0}
              </span>

              <button
                onClick={handleLike}
                className={`flex items-center gap-1 transition ${
                  liked
                    ? "text-red-500"
                    : "text-gray-500 hover:text-red-500"
                }`}
              >
                <Heart
                  size={18}
                  fill={liked ? "currentColor" : "none"}
                />
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