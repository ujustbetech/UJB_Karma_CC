"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/utility_collection";
import { format } from "date-fns";
import * as XLSX from "xlsx";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import Pagination from "@/components/table/Pagination";
import { useToast } from "@/components/ui/ToastProvider";

import { Trash2, Pencil, Download, Users, AlertCircle } from "lucide-react";

export default function ProspectsListingPage() {

const toast = useToast();

const [prospects, setProspects] = useState([]);
const [loading, setLoading] = useState(true);

const [nameFilter, setNameFilter] = useState("");
const [orbiterFilter, setOrbiterFilter] = useState("");
const [typeFilter, setTypeFilter] = useState("all");

const [deleteOpen, setDeleteOpen] = useState(false);
const [prospectToDelete, setProspectToDelete] = useState(null);

const [page, setPage] = useState(1);
const perPage = 10;

const columns = [
{ key: "sr", label: "#" },
{ key: "name", label: "Prospect Name" },
{ key: "occupation", label: "Occupation" },
{ key: "orbiter", label: "Orbiter" },
{ key: "stage", label: "Current Stage" },
// { key: "progress", label: "Progress" },
{ key: "last", label: "Last Engagement" },
{ key: "next", label: "Next Follow-up" },
{ key: "type", label: "Type" },
{ key: "actions", label: "Actions" },
];



/* ------------------------------------------------ */
/* STAGE DETECTION */
/* ------------------------------------------------ */

const getProspectStage = (p) => {

if (p.status === "Choose to enroll")
return { stage: "Enrolled", progress: 100 };

if (p.enrollmentStages?.some(s => s.status === "Completed"))
return { stage: "Enrollment Process", progress: 90 };

if (p.assessmentMail?.sent)
return { stage: "Assessment Completed", progress: 80 };

if (p.caseStudy2?.sent)
return { stage: "Case Study 2", progress: 75 };

if (p.caseStudy1?.sent)
return { stage: "Case Study 1", progress: 70 };

if (p.knowledgeSeries10_evening?.sent)
return { stage: "Knowledge Series 10", progress: 65 };

if (p.knowledgeSeries5_morning?.sent)
return { stage: "Knowledge Series", progress: 55 };

if (p.ntIntro?.sent)
return { stage: "NT Intro", progress: 45 };

if (p.sections?.length > 0)
return { stage: "Assessment Form", progress: 35 };

if (p.introevent?.length > 0)
return { stage: "Intro Meeting", progress: 20 };

return { stage: "Prospect Created", progress: 5 };

};



/* ------------------------------------------------ */
/* FETCH PROSPECTS */
/* ------------------------------------------------ */

const fetchProspects = async () => {

setLoading(true);

try {

const snap = await getDocs(collection(db, COLLECTIONS.prospect));

const list = await Promise.all(

snap.docs.map(async (docSnap) => {

const data = docSnap.data();

const engagementCol = collection(
db,
`${COLLECTIONS.prospect}/${docSnap.id}/engagementform`
);

const engagementSnap = await getDocs(engagementCol);

let lastEngagementDate = null;
let nextFollowupDate = null;

if (!engagementSnap.empty) {

const engagements = engagementSnap.docs.map((e) => e.data());

engagements.sort((a, b) => {

const dateA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
const dateB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;

return dateB - dateA;

});

const latest = engagements[0];

if (latest.callDate) lastEngagementDate = latest.callDate;
else if (latest.updatedAt) lastEngagementDate = latest.updatedAt;
else if (latest.createdAt) lastEngagementDate = latest.createdAt;

if (latest.nextFollowupDate)
nextFollowupDate = latest.nextFollowupDate;
}

return {
id: docSnap.id,
...data,
lastEngagementDate,
nextFollowupDate,
};

})
);

setProspects(list);

} catch {

toast.error("Failed to fetch prospects");

} finally {

setLoading(false);

}
};

useEffect(() => {
fetchProspects();
}, []);



/* ------------------------------------------------ */
/* DATE FORMAT */
/* ------------------------------------------------ */

const formatDate = (dateValue) => {

if (!dateValue) return "-";

if (typeof dateValue === "string") {
const d = new Date(dateValue);
return isNaN(d) ? "-" : format(d, "dd/MM/yyyy HH:mm");
}

if (dateValue?.seconds) {
return format(new Date(dateValue.seconds * 1000), "dd/MM/yyyy HH:mm");
}

return "-";
};



/* ------------------------------------------------ */
/* FILTERING */
/* ------------------------------------------------ */

const filtered = useMemo(() => {

return prospects.filter((p) => {

const matchName =
!nameFilter ||
p.prospectName?.toLowerCase().includes(nameFilter.toLowerCase());

const matchOrbiter =
!orbiterFilter ||
p.orbiterName?.toLowerCase().includes(orbiterFilter.toLowerCase());

const matchType =
typeFilter === "all" ||
(typeFilter === "etu" && p.userType === "orbiter") ||
(typeFilter === "ntu" && p.userType !== "orbiter");

return matchName && matchOrbiter && matchType;

});

}, [prospects, nameFilter, orbiterFilter, typeFilter]);

const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

const paginated = filtered.slice(
(page - 1) * perPage,
page * perPage
);



/* ------------------------------------------------ */
/* DELETE */
/* ------------------------------------------------ */

const openDelete = (p) => {
setProspectToDelete(p);
setDeleteOpen(true);
};

const confirmDelete = async () => {

try {

await deleteDoc(doc(db, COLLECTIONS.prospect, prospectToDelete.id));

toast.success("Prospect deleted");

fetchProspects();

} catch {

toast.error("Delete failed");

}

setDeleteOpen(false);
};



/* ------------------------------------------------ */
/* EXPORT */
/* ------------------------------------------------ */

const exportExcel = () => {

if (!prospects.length) return;

const ws = XLSX.utils.json_to_sheet(prospects);
const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb, ws, "Prospects");

XLSX.writeFile(wb, "prospects.xlsx");

};



/* ------------------------------------------------ */
/* STATS */
/* ------------------------------------------------ */

const totalProspects = prospects.length;
const ntu = prospects.filter((p) => p.userType !== "orbiter").length;
const etu = prospects.filter((p) => p.userType === "orbiter").length;



/* ------------------------------------------------ */
/* UI */
/* ------------------------------------------------ */

return (
<>

<Text variant="h1">Prospects</Text>

<div className="grid grid-cols-3 gap-4 mb-4">

<Card>
<div className="flex justify-between">
<div>
<Text variant="h3">{totalProspects}</Text>
<Text variant="muted">Total Prospects</Text>
</div>
<Users />
</div>
</Card>

<Card>
<div className="flex justify-between">
<div>
<Text variant="h3">{ntu}</Text>
<Text variant="muted">NTU</Text>
</div>
<AlertCircle />
</div>
</Card>

<Card>
<div className="flex justify-between">
<div>
<Text variant="h3">{etu}</Text>
<Text variant="muted">ETU</Text>
</div>
<AlertCircle />
</div>
</Card>

</div>



<Card className="mb-4">

<div className="flex gap-3">

<Input
placeholder="Search Prospect"
value={nameFilter}
onChange={(e) => setNameFilter(e.target.value)}
/>

<Input
placeholder="Search Orbiter"
value={orbiterFilter}
onChange={(e) => setOrbiterFilter(e.target.value)}
/>

<Select
value={typeFilter}
onChange={setTypeFilter}
options={[
{ label: "All", value: "all" },
{ label: "NTU", value: "ntu" },
{ label: "ETU", value: "etu" },
]}
/>

<Button onClick={exportExcel}>
<Download size={16} /> Excel
</Button>

</div>

</Card>



<Card>

{loading ? (
<p>Loading...</p>
) : (

<Table>

<TableHeader columns={columns} />

<tbody>

{paginated.map((p, i) => {

const { stage, progress } = getProspectStage(p);

return (

<TableRow key={p.id}>

<td className="px-4 py-3">{(page - 1) * perPage + i + 1}</td>

<td className="px-4 py-3">{p.prospectName}</td>

<td className="px-4 py-3">{p.occupation}</td>

<td className="px-4 py-3">{p.orbiterName}</td>

<td className="px-4 py-3 text-blue-600 font-medium">
{stage}
</td>

{/* <td className="px-4 py-3 w-40">

<div className="w-full bg-gray-200 rounded-full h-2">

<div
className="bg-black h-2 rounded-full"
style={{ width: `${progress}%` }}
/>

</div>

<span className="text-xs text-gray-600">{progress}%</span>

</td> */}

<td className="px-4 py-3">
{formatDate(p.lastEngagementDate)}
</td>

<td className="px-4 py-3">
{formatDate(p.nextFollowupDate)}
</td>

<td className="px-4 py-3">
{p.userType === "orbiter" ? "ETU" : "NTU"}
</td>

<td className="px-4 py-3">

<div className="flex gap-2">

<Tooltip content="Edit">
<ActionButton
icon={Pencil}
onClick={() =>
(window.location.href =
`/admin/prospect/edit/${p.id}`)
}
/>
</Tooltip>

<Tooltip content="Delete">
<ActionButton
icon={Trash2}
variant="danger"
onClick={() => openDelete(p)}
/>
</Tooltip>

</div>

</td>

</TableRow>

);

})}

</tbody>

</Table>
)}

<div className="mt-4 flex justify-end">

<Pagination
page={page}
pageSize={perPage}
total={filtered.length}
onPageChange={setPage}
/>

</div>

</Card>



<ConfirmModal
open={deleteOpen}
title="Delete Prospect"
description={`Delete ${prospectToDelete?.prospectName}?`}
onConfirm={confirmDelete}
onClose={() => setDeleteOpen(false)}
/>

</>
);
}