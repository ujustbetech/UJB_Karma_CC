"use client";

import { Phone, MessageCircle } from "lucide-react";

const BusinessHeader = ({
  userDetails,
  serviceCount,
}) => {
  return (
    <div className="pb-6 shadow-sm">

      <div className="relative">
        <img
          src={userDetails.profilePic}
          className="w-full h-44 object-cover"
          alt=""
        />

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
            {userDetails.logo && (
              <img
                src={userDetails.logo}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-14 text-center px-4">
        <h2 className="text-xl font-semibold">
          {userDetails.businessName}
        </h2>

        <p className="text-sm text-gray-500">
          {userDetails.Locality}
        </p>

        {/* Stats Row */}
        <div className="flex justify-center gap-8 mt-4">
          <div>
            <p className="font-semibold">{serviceCount}</p>
            <p className="text-xs text-gray-500">Services</p>
          </div>
          <div>
            <p className="font-semibold">Active</p>
            <p className="text-xs text-gray-500">Status</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mt-5">
          <a
            href={`tel:${userDetails.phone}`}
            className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm"
          >
            <Phone size={16} /> Call
          </a>

          <a
            href={`https://wa.me/${userDetails.phone}`}
            target="_blank"
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default BusinessHeader;