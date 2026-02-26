"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, MapPin, BadgeCheck } from "lucide-react";
import EditHeroSheet from "./EditHeroSheet";

export default function ProfileHero({ user, setUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative h-[320px] overflow-hidden rounded-tl-lg rounded-tr-lg">
        <Image
          src={user.ProfilePhotoURL || "/placeholder.jpg"}
          fill
          className="object-cover"
          alt="profile"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />

        {/* Edit Button */}
        <button
          onClick={() => setOpen(true)}
          className="absolute top-5 right-5 bg-white/20 backdrop-blur-md p-3 rounded-full"
        >
          <Pencil size={18} className="text-white" />
        </button>

        {/* Content */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-white px-4">
          <h1 className="text-2xl font-bold">{user.Name}</h1>

          <p className="text-sm opacity-90 mt-1">
            {user.TagLine}
          </p>

          <div className="flex justify-center items-center gap-2 mt-2 text-xs opacity-90">
            <MapPin size={14} />
            {user.City}
          </div>

          <div className="mt-3 inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs">
            <BadgeCheck size={14} />
            {user.ProfileStatus}
          </div>
        </div>
      </div>

      <EditHeroSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
      />
    </>
  );
}