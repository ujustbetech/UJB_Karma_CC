async function readApiResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || fallbackMessage);
  }

  return body?.success && "data" in body ? body.data : body;
}

export async function fetchAdminMonthlyMeetings() {
  const response = await fetch("/api/admin/monthlymeeting", {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load monthly meetings");
  return data.events || [];
}

export async function createAdminMonthlyMeeting(payload) {
  const response = await fetch("/api/admin/monthlymeeting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readApiResponse(response, "Failed to create monthly meeting");
  return data.id || "";
}

export async function deleteAdminMonthlyMeeting(id) {
  const response = await fetch(`/api/admin/monthlymeeting/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });

  await readApiResponse(response, "Failed to delete monthly meeting");
}
