async function readApiResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || fallbackMessage);
  }

  return body?.success && "data" in body ? body.data : body;
}

export async function fetchUserDewdropContent() {
  const response = await fetch("/api/user/dewdrop", {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load content");
  return data.contents || [];
}

export async function fetchUserDewdropContentDetails(id) {
  const response = await fetch(`/api/user/dewdrop/${id}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load content details");
  return data.content || null;
}

export async function likeUserDewdropContent(id) {
  const response = await fetch(`/api/user/dewdrop/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "like" }),
  });

  const data = await readApiResponse(response, "Failed to like content");
  return data.content || null;
}
