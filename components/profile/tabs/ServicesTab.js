"use client";

import { useState } from "react";
import { Briefcase, Package, Pencil } from "lucide-react";
import EditServiceSheet from "./EditServiceSheet";
import EditProductSheet from "./EditProductSheet";

export default function ServiceTab({ user = {}, setUser, ujbCode }) {
  const [active, setActive] = useState("services");
  const [openService, setOpenService] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);

  const services = Array.isArray(user?.services) ? user.services : [];
  const products = Array.isArray(user?.products) ? user.products : [];

  return (
    <>
      {/* Transparent Main Container */}
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-200 text-lg">
            Offerings
          </h3>

          <button
            onClick={() =>
              active === "services"
                ? setOpenService(true)
                : setOpenProduct(true)
            }
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Pencil
              size={16}
              className="text-gray-500 hover:text-orange-500 transition"
            />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button
            onClick={() => setActive("services")}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition
              ${
                active === "services"
                  ? "bg-white shadow text-orange-500"
                  : "text-gray-500"
              }`}
          >
            <Briefcase size={16} />
            Services <span className="font-medium text-gray-700">
            {services.length}
          </span>
          </button>

          <button
            onClick={() => setActive("products")}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition
              ${
                active === "products"
                  ? "bg-white shadow text-orange-500"
                  : "text-gray-500"
              }`}
          >
            <Package size={16} />
            Products  <span className="font-medium text-gray-700">
            {products.length}
          </span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {active === "services"
            ? services.length === 0
              ? <EmptyState text="No services added yet" />
              : services.map((item, i) => (
                  <OfferingCard key={i} item={item} />
                ))
            : products.length === 0
              ? <EmptyState text="No products added yet" />
              : products.map((item, i) => (
                  <OfferingCard key={i} item={item} />
                ))}
        </div>

      </div>

      <EditServiceSheet
        open={openService}
        setOpen={setOpenService}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />

      <EditProductSheet
        open={openProduct}
        setOpen={setOpenProduct}
        user={user}
        setUser={setUser}
        ujbCode={ujbCode}
      />
    </>
  );
}

/* ---------- Offering Card ---------- */

function OfferingCard({ item }) {
  const commission =
    item?.agreedValue?.single?.value || "-";

  const commissionType =
    item?.agreedValue?.single?.type === "percentage"
      ? "%"
      : "";

  const keywords = Array.isArray(item?.keywords)
    ? item.keywords
    : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition duration-300 overflow-hidden">

      {item.imageURL && (
        <div className="h-40 overflow-hidden">
          <img
            src={item.imageURL}
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
            {commission}{commissionType}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {item.description || "No description provided."}
        </p>

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {keywords.slice(0, 5).map((k) => (
              <span
                key={k}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {k}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

/* ---------- Empty State ---------- */

function EmptyState({ text }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400 text-sm">
        {text}
      </p>
      <p className="text-xs text-gray-300 mt-1">
        Click edit to add
      </p>
    </div>
  );
}