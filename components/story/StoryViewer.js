"use client";

import { useEffect, useState, useRef } from "react";
import { X, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StoryViewer({ stories, initialIndex, onClose }) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const router = useRouter();

  const currentStory = stories[current];

  useEffect(() => {
    if (!currentStory) return;

    setProgress(0);

    if (currentStory.contentType !== "video") {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }

    return () => clearInterval(intervalRef.current);
  }, [current]);

  const nextStory = () => {
    if (current < stories.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (current > 0) {
      setCurrent((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-99 bg-black flex flex-col">

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white z-50"
      >
        <X size={28} />
      </button>

      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-40">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width:
                  index < current
                    ? "100%"
                    : index === current
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Tap Zones */}
      <div className="absolute inset-0 flex z-30">
        <div className="w-1/2" onClick={prevStory} />
        <div className="w-1/2" onClick={nextStory} />
      </div>

      {/* Media Section */}
      <div className="flex-1 flex items-center justify-center relative">

        {currentStory.contentType === "video" ? (
          <video
            src={currentStory.VideoURL}
            autoPlay
            onEnded={nextStory}
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={currentStory.Thumbnail?.[0]}
            alt=""
            className="h-full w-full object-contain"
          />
        )}

      </div>

      {/* Content Panel */}
      <div className="bg-gradient-to-t from-black via-black/90 to-transparent p-6 space-y-3">

        {/* Title */}
        <h3 className="text-white text-lg font-semibold">
          {currentStory.contentName}
        </h3>

        {/* Description */}
        {currentStory.contDiscription && (
          <p className="text-sm text-slate-300 line-clamp-3">
            {currentStory.contDiscription}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => {
            onClose();
            router.push(`/dewdrop/${currentStory.id}`);
          }}
          className="mt-3 w-full bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <PlayCircle size={18} />
          Start Learning
        </button>

      </div>

    </div>
  );
}