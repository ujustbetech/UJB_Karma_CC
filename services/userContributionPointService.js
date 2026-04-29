async function readApiResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || fallbackMessage);
  }

  return body?.success && "data" in body ? body.data : body;
}

export async function fetchCpBoardSummary(ujbCode) {
  const path = ujbCode
    ? `/api/user/contribution-points/${encodeURIComponent(ujbCode)}`
    : "/api/user/contribution-points";
  const response = await fetch(path, {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(
    response,
    "Failed to load contribution point summary"
  );

  return {
    user: data.user || null,
    activities: data.activities || [],
    totals: data.totals || { total: 0, relation: 0, health: 0, wealth: 0 },
  };
}
