"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
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
import Link from "next/link";

export default function ContentPage() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH CONTENT ================= */
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const q = query(
          collection(db, "ContentData"),
          orderBy("AdminCreatedby", "desc")
        );

        const snap = await getDocs(q);

        setContents(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-800">
            Content Library
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Explore audio, video and curated partner content
          </p>
        </div>

        {/* GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {contents.map((content) => (
            <Link
              href={`/user/dewdrop/content/${content.id}`}
              key={content.id}
              className="block bg-white rounded-3xl shadow-md border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition duration-300"
            >
              {/* THUMBNAIL */}
              <div className="relative h-48 bg-gray-100">
                <img
                  src={content.Thumbnail?.[0] || "/placeholder.jpg"}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />

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
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {content.contDiscription}
                </p>

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
                  <img
                    src={content.lpProfile?.[0] || "/avatar.png"}
                    alt="Partner"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {content.partnerNamelp}
                    </p>
                    <p className="text-xs text-gray-400">
                      {content.partnerDesig}
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

                  <span className="font-medium text-indigo-600">
                    CP {content.totalCp || 0}
                  </span>
                </div>

              </div>
            </Link>
          ))}

        </div>
      </div>
    </main>
  );
}