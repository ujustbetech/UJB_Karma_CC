"use client";

import { useState } from "react";
import { Package, Pencil } from "lucide-react";
import EditProductSheet from "./EditProductSheet";

export default function ProductFieldsTab({ user = {}, setUser, ujbCode }) {
  const [open, setOpen] = useState(false);
  const products = Array.isArray(user?.products) ? user.products : [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-200 text-lg">Product Fields</h3>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Pencil size={16} className="text-gray-500 hover:text-orange-500 transition" />
          </button>
        </div>

        <div className="space-y-5">
          {products.length === 0 ? (
            <EmptyState text="No products added yet" />
          ) : (
            products.map((item, i) => <OfferingCard key={i} item={item} />)
          )}
        </div>
      </div>

      <EditProductSheet
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}

function OfferingCard({ item }) {
  const commission = item?.agreedValue?.single?.value || "-";
  const commissionType =
    item?.agreedValue?.single?.type === "percentage" ? "%" : "";
  const keywords = Array.isArray(item?.keywords) ? item.keywords : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition duration-300 overflow-hidden">
      {(item.imageURL || item.images?.[0]?.url) && (
        <div className="h-40 overflow-hidden">
          <img
            src={item.imageURL || item.images?.[0]?.url}
            className="w-full h-full object-cover transition duration-500 hover:scale-105"
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-gray-800 text-base">
            {item.name || "Untitled"}
          </h4>
          <span className="text-xs font-medium bg-orange-50 text-orange-600 px-3 py-1 rounded-full">
            {commission}
            {commissionType}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {item.description || "No description provided."}
        </p>

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {keywords.slice(0, 5).map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400 text-sm">{text}</p>
      <p className="text-xs text-gray-300 mt-1">Click edit to add</p>
    </div>
  );
}
