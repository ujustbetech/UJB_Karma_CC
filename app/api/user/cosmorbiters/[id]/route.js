import { API_ERROR_CODES } from "@/lib/api/contracts.mjs";
import { logAuthFailure, logProviderFailure } from "@/lib/api/logging.mjs";
import { jsonError, jsonSuccess } from "@/lib/api/response.mjs";
import {
  adminDb,
} from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { requireUserSession } from "@/lib/auth/userRequestAuth.mjs";

const userCollectionName = publicEnv.collections.userDetail;
const referralCollectionName = publicEnv.collections.referral;
const favoritesCollectionName = "favorites";

function normalizeArrayField(value) {
  if (!value || value === "-" || value === "aEUR") return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return [value];
  return [];
}

function mapBusiness(data) {
  return {
    name: data.Name || "",
    email: data.Email || "",
    phone: data.MobileNo || "",
    ujbCode: data.UJBCode || "",
    businessName: data.BusinessName || "",
    businessDetails: data.BusinessHistory || "",
    profilePic: data.ProfilePhotoURL || "",
    logo: data.BusinessLogo || "",
    Locality: data.Locality || "",
    tagline: data.TagLine || "",
    category1: data.Category1 || "",
    category2: data.Category2 || "",
    businessStage: data.BusinessStage || "",
    professionType: data.ProfessionType || "",
    skills: data.Skills || [],
    languages: normalizeArrayField(data.LanguagesKnown),
    mentorName: data.MentorName || "",
    mentorPhone: data.MentorPhone || "",
    subscriptionStatus: data.subscription?.status || null,
    subscriptionStart: data.subscription?.startDate || null,
    website: data.Website || data.website || "",
  };
}

function mapOfferings(data) {
  const rawServices = Object.values(data.services || {});
  const rawProducts = Object.values(data.products || {});

  return {
    services: rawServices.map((service, index) => ({
      id: `service_${index}`,
      label: service.name || "",
      description: service.description || "",
      imageURL: service.imageURL || "",
      type: "service",
      raw: service,
    })),
    products: rawProducts.map((product, index) => ({
      id: `product_${index}`,
      label: product.name || "",
      description: product.description || "",
      imageURL: product.imageURL || "",
      type: "product",
      raw: product,
    })),
  };
}

function mapOrbiter(data) {
  return {
    name: data.Name || "",
    email: data.Email || "",
    phone: data.MobileNo || "",
    ujbCode: data.UJBCode || "",
    mentorName: data.MentorName || "",
    mentorPhone: data.MentorPhone || "",
  };
}

export async function GET(req, { params }) {
  const authResult = await requireUserSession(req);

  if (!authResult.ok) {
    logAuthFailure({
      route: "/api/user/cosmorbiters/[id]",
      status: authResult.status,
      code: authResult.code,
      reason: authResult.reason,
    });

    return jsonError(authResult.message, {
      status: authResult.status,
      code: authResult.code,
    });
  }

  try {
    const { id } = await params;
    const sessionUjbCode = String(authResult.context?.ujbCode || "").trim();

    if (!id) {
      return jsonError("Missing id", {
        status: 400,
        code: API_ERROR_CODES.INVALID_INPUT,
      });
    }

    const [businessSnap, orbiterSnap, favoriteSnap, referralCountSnap, existingReferralSnap] =
      await Promise.all([
        adminDb.collection(userCollectionName).doc(id).get(),
        sessionUjbCode
          ? adminDb.collection(userCollectionName).doc(sessionUjbCode).get()
          : Promise.resolve(null),
        sessionUjbCode
          ? adminDb
              .collection(favoritesCollectionName)
              .doc(`${sessionUjbCode}_${id}`)
              .get()
          : Promise.resolve(null),
        adminDb
          .collection(referralCollectionName)
          .where("cosmoUjbCode", "==", id)
          .get(),
        sessionUjbCode
          ? adminDb
              .collection(referralCollectionName)
              .where("orbiter.ujbCode", "==", sessionUjbCode)
              .get()
          : Promise.resolve(null),
      ]);

    if (!businessSnap.exists) {
      return jsonError("CosmOrbiter not found", {
        status: 404,
        code: API_ERROR_CODES.NOT_FOUND,
      });
    }

    const businessData = businessSnap.data() || {};
    const offerings = mapOfferings(businessData);
    const existingReferrals = (existingReferralSnap?.docs || [])
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((referral) => referral.cosmoUjbCode === id);

    return jsonSuccess({
      business: mapBusiness(businessData),
      services: offerings.services,
      products: offerings.products,
      orbiter: orbiterSnap?.exists ? mapOrbiter(orbiterSnap.data() || {}) : null,
      isFavorite: Boolean(favoriteSnap?.exists),
      referralCount: referralCountSnap.size,
      existingReferrals,
    });
  } catch (error) {
    logProviderFailure({
      route: "/api/user/cosmorbiters/[id]",
      provider: "firebase",
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
      error,
    });

    return jsonError(error?.message || "Failed to fetch CosmOrbiter details", {
      status: 500,
      code: error?.code || API_ERROR_CODES.PROVIDER_FAILURE,
    });
  }
}


