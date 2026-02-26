"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function NewlyAddedSection() {
  const router = useRouter();
  const [services, setServices] = useState([]);

  useEffect(() => {
    async function fetchNewServices() {
      const q = query(
        collection(db, "usersDetail"),
        orderBy("subscription.startDate", "desc"),
        limit(5)
      );

      const snap = await getDocs(q);

      const newServices = [];

      snap.forEach((doc) => {
        const data = doc.data();
        const userServices = data.services || [];

        userServices.forEach((service) => {
          newServices.push({
            businessName: data.BusinessName,
            serviceName: service.name,
            description: service.description,
            ujbCode: data.UJBCode,
          });
        });
      });

      setServices(newServices.slice(0, 4));
    }

    fetchNewServices();
  }, []);

  if (services.length === 0) return null;

  return (
    <div className="space-y-4">

      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-white">
          Newly Added
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {services.map((item, index) => (
          <div
            key={index}
            className="min-w-[240px] bg-white rounded-2xl p-4 shadow-md"
          >
            <span className="text-[10px] text-orange-500 font-semibold">
              NEW
            </span>

            <h4 className="text-sm font-semibold text-slate-900 mt-1">
              {item.serviceName}
            </h4>

            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {item.description}
            </p>

            <button
              onClick={() => router.push(`/business/${item.ujbCode}`)}
              className="mt-3 text-xs text-orange-500 font-medium"
            >
              View Details →
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}