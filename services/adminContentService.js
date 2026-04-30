async function readApiResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || fallbackMessage);
  }

  return body?.success && "data" in body ? body.data : body;
}

export async function fetchContentReferenceData() {
  const response = await fetch("/api/admin/content/reference", {
    method: "GET",
    credentials: "include",
  });

  return readApiResponse(response, "Failed to load content reference data");
}

export async function fetchPartnerDetails(partnerId) {
  const response = await fetch(
    `/api/admin/content/reference?partnerId=${encodeURIComponent(partnerId)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await readApiResponse(response, "Failed to load partner details");
  return data.partner || null;
}

export async function createContentEntry(payload) {
  const response = await fetch("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return readApiResponse(response, "Failed to create content entry");
}

export async function fetchContentListing() {
  const response = await fetch("/api/admin/content", {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to fetch content");
  return data.content || [];
}

export async function deleteContentEntry(contentId) {
  const response = await fetch(`/api/admin/content/${encodeURIComponent(contentId)}`, {
    method: "DELETE",
    credentials: "include",
  });

  await readApiResponse(response, "Failed to delete content");
}

export async function fetchContentEntry(contentId) {
  const response = await fetch(`/api/admin/content/${encodeURIComponent(contentId)}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load content");
  return data.content || null;
}

export async function updateContentEntry(contentId, payload) {
  const response = await fetch(`/api/admin/content/${encodeURIComponent(contentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return readApiResponse(response, "Failed to update content");
}
