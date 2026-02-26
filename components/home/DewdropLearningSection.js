"use client";

import { useEffect, useState } from "react";
import Slider from "react-slick";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { Droplet, PlayCircle, Image as ImageIcon } from "lucide-react";
import { Forum } from "next/font/google";
import StoryViewer from "@/components/story/StoryViewer";

const forum = Forum({
  subsets: ["latin"],
  weight: "400",
});

export default function DewdropLearningSection() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    async function fetchContent() {
      const q = query(
        collection(db, "ContentData"),
        where("switchValue", "==", true),
        orderBy("AdminCreatedby", "desc"),
        limit(8)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setContents(data);
      setLoading(false);
    }

    fetchContent();
  }, []);

  const settings = {
    dots: false,
    infinite: false,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1.2 },
      },
    ],
  };

  return (
    <div className="space-y-4">

      {/* Heading */}
      <div className="flex items-center gap-2">
        <Droplet size={18} className="text-orange-500" />
        <h3
          className={`${forum.className} text-xl tracking-wide`}
          style={{ color: "#a2cbda" }}
        >
          Dewdrop Stories
        </h3>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="flex gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-64 w-48 rounded-3xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && contents.length > 0 && (
        <Slider {...settings}>
          {contents.map((item, index) => (
            <div key={item.id} className="px-2">
              <div
                onClick={() => {
                  setSelectedIndex(index);
                  setViewerOpen(true);
                }}
                className="relative h-64 rounded-3xl overflow-hidden cursor-pointer group active:scale-[0.97] transition"
              >
                {/* Background */}
                {item.Thumbnail?.[0] ? (
                  <img
                    src={item.Thumbnail[0]}
                    alt={item.contentName}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <ImageIcon size={40} className="text-slate-400" />
                  </div>
                )}

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] bg-black/60 text-white px-2 py-1 rounded-full flex items-center gap-1">
                    {item.contentType === "video" ? (
                      <>
                        <PlayCircle size={12} />
                        Video
                      </>
                    ) : (
                      <>
                        <ImageIcon size={12} />
                        Image
                      </>
                    )}
                  </span>
                </div>

                {/* Title */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-white text-sm font-semibold line-clamp-2">
                    {item.contentName}
                  </h4>
                </div>

              </div>
            </div>
          ))}
        </Slider>
      )}

      {/* Story Viewer */}
      {viewerOpen && (
        <StoryViewer
          stories={contents}
          initialIndex={selectedIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

    </div>
  );
}