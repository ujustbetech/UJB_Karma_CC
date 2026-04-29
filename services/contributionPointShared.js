import * as XLSX from "xlsx";

export function getCpCategoryLabel(category) {
  if (category === "R") return "Relation";
  if (category === "H") return "Health";
  return "Wealth";
}

export function filterCpActivities(activities, category = "All", searchTerm = "") {
  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();

  return activities.filter((activity) => {
    const matchesCategory =
      category === "All" || activity.categories?.includes(category);

    const matchesSearch =
      !normalizedSearch ||
      activity.activityName?.toLowerCase().includes(normalizedSearch) ||
      activity.purpose?.toLowerCase().includes(normalizedSearch) ||
      activity.month?.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
}

export function parseCpActivityWorkbook(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows.map((row, index) => ({
    id: index + 1,
    activityName: String(
      row.activityName || row.ActivityName || row.Activity || ""
    ).trim(),
    categories: String(
      row.categories || row.Categories || row.Category || "W"
    )
      .split(",")
      .map((category) => category.trim().toUpperCase())
      .filter(Boolean),
    points: Number(row.points || row.Points || 0),
    purpose: String(row.purpose || row.Purpose || "").trim(),
    month: String(row.month || row.Month || "").trim(),
  }));
}
