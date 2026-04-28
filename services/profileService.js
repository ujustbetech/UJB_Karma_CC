async function readApiResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || fallbackMessage);
  }

  return body?.success && "data" in body ? body.data : body;
}

export async function fetchUserProfile() {
  const response = await fetch("/api/user/profile", {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load profile");
  return data.user || null;
}

export async function updateUserProfile(update) {
  const response = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      update: update && typeof update === "object" ? update : {},
    }),
  });

  const data = await readApiResponse(response, "Failed to update profile");
  return data.user || null;
}
