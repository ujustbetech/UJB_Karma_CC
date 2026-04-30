async function readApiResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || fallbackMessage);
  }

  return body?.success && "data" in body ? body.data : body;
}

export async function fetchAdminConclaveUsers() {
  const response = await fetch("/api/admin/conclave?view=users", {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load conclave users");
  return data.users || [];
}

export async function createAdminConclave(payload) {
  const response = await fetch("/api/admin/conclave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readApiResponse(response, "Failed to create conclave");
  return data.id || "";
}

export async function fetchAdminConclaves() {
  const response = await fetch("/api/admin/conclave", {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load conclaves");
  return data.conclaves || [];
}

export async function deleteAdminConclave(id) {
  const response = await fetch(`/api/admin/conclave/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });

  await readApiResponse(response, "Failed to delete conclave");
}

export async function fetchAdminConclave(id) {
  const response = await fetch(`/api/admin/conclave/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await readApiResponse(response, "Failed to load conclave");
  return {
    conclave: data.conclave || null,
    meetings: data.meetings || [],
  };
}

export async function updateAdminConclave(id, payload) {
  const response = await fetch(`/api/admin/conclave/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  await readApiResponse(response, "Failed to update conclave");
}

export async function createAdminConclaveMeeting(id, payload) {
  const response = await fetch(
    `/api/admin/conclave/${encodeURIComponent(id)}/meetings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  const data = await readApiResponse(response, "Failed to create conclave meeting");
  return data.id || "";
}

export async function fetchAdminConclaveMeetingDetails(conclaveId, meetingId) {
  const response = await fetch(
    `/api/admin/conclave/${encodeURIComponent(conclaveId)}/meetings/${encodeURIComponent(meetingId)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await readApiResponse(response, "Failed to load conclave meeting");
  return data.meeting || null;
}

export async function updateAdminConclaveMeeting(conclaveId, meetingId, payload) {
  const response = await fetch(
    `/api/admin/conclave/${encodeURIComponent(conclaveId)}/meetings/${encodeURIComponent(meetingId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  await readApiResponse(response, "Failed to update conclave meeting");
}

export async function fetchAdminConclaveRegisteredUsers(conclaveId, meetingId) {
  const response = await fetch(
    `/api/admin/conclave/${encodeURIComponent(conclaveId)}/meetings/${encodeURIComponent(meetingId)}/registered-users`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await readApiResponse(response, "Failed to load registered users");
  return data.users || [];
}

export async function markAdminConclaveAttendance(conclaveId, meetingId, userId) {
  const response = await fetch(
    `/api/admin/conclave/${encodeURIComponent(conclaveId)}/meetings/${encodeURIComponent(meetingId)}/registered-users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ attendanceStatus: true }),
    }
  );

  await readApiResponse(response, "Failed to update attendance");
}
