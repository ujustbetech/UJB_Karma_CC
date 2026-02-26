"use client";

import { X, Phone, MessageCircle, Percent } from "lucide-react";

export default function ServiceDetailModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-99 flex items-end bg-black/40 backdrop-blur-sm">

      {/* Bottom Sheet */}
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {item.label}
          </h2>
          <button onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Image */}
        {item.imageURL && (
          <img
            src={item.imageURL}
            alt=""
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        )}

        {/* Description */}
        {item.description && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.description}
            </p>
          </div>
        )}

        {/* Commission */}
        {item.raw?.agreedValue?.single?.value && (
          <div className="mb-4 flex items-center gap-2 text-green-600 text-sm font-medium">
            <Percent size={16} />
            Commission: {item.raw.agreedValue.single.value}%
          </div>
        )}

        {/* Keywords */}
        {item.raw?.keywords && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Keywords
            </h3>

            <div className="flex flex-wrap gap-2">
              {(Array.isArray(item.raw.keywords)
                ? item.raw.keywords
                : String(item.raw.keywords).split(",")
              ).map((k, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-xs rounded-full"
                >
                  {k.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <a
            href={`tel:${item.phone || ""}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 py-3 rounded-xl text-sm font-medium"
          >
            <Phone size={16} />
            Call
          </a>

          <a
            href="#"
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl text-sm font-medium"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}