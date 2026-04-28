export async function fetchProspectById(id) {
  const res = await fetch(`/api/admin/prospects?id=${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Failed to fetch prospect");
  }
  return payload.prospect || null;
}

export async function patchProspectById(id, update, section) {
  const query = new URLSearchParams({ id: String(id) });
  if (section) query.set("section", section);
  const res = await fetch(`/api/admin/prospects?${query.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(update),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || "Failed to update prospect");
  }
  return payload;
}
