"use client";

import { use } from "react";

import OrbiterProfilePage from "@/components/admin/orbiters/OrbiterProfilePage";

export default function OrbitersListingPage({ params }) {
  const resolvedParams = use(params);
  const ujbcode = resolvedParams.ujbcode;
  return <OrbiterProfilePage ujbcode={ujbcode} />;
}
