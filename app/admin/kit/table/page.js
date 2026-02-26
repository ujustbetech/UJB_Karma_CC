"use client";

import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import StatusBadge from "@/components/ui/StatusBadge";

export default function TablePage() {
  const columns = [
    { key: "select", label: "" },
    { key: "receiver", label: "Receiver" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "actions", label: "" },
  ];

  return (
    <div className="">
      <div className="rounded-2xl bg-white px-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <h2 className="font-bold text-black text-2xl  text-black">
            Transactions
          </h2>

          <input
            placeholder="Search"
            className="h-9 w-[200px] rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <Table>
          <TableHeader columns={columns} />

          <tbody>
            {/* Row 1 */}
            <TableRow>
              <td className="px-4 py-4">
                <input type="checkbox" className="h-4 w-4" />
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/avatar-1.jpg"
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Emma Ryan Jr.
                  </span>
                </div>
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                Salary
              </td>

              <td className="px-4 py-4">
                <StatusBadge status="pending" tone="table" />
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                Feb 19th, 2023
              </td>

              <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                $3,892
              </td>

              <td className="px-4 py-4 text-right">
                <button className="h-8 rounded-full border border-slate-200 px-4 text-sm text-slate-600">
                  Details
                </button>
              </td>
            </TableRow>

            {/* Row 2 */}
            <TableRow>
              <td className="px-4 py-4">
                <input type="checkbox" className="h-4 w-4" />
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/avatar-2.jpg"
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Adrian Daren
                  </span>
                </div>
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                Bonus
              </td>

              <td className="px-4 py-4">
                <StatusBadge status="approved" tone="table" />
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                Feb 18th, 2023
              </td>

              <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                $1073
              </td>

              <td className="px-4 py-4 text-right">
                <button className="h-8 rounded-full border border-slate-200 px-4 text-sm text-slate-600">
                  Details
                </button>
              </td>
            </TableRow>

            {/* Row 3 */}
            <TableRow>
              <td className="px-4 py-4">
                <input type="checkbox" className="h-4 w-4" />
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/avatar-3.jpg"
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Roxanne Hills
                  </span>
                </div>
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                Salary
              </td>

              <td className="px-4 py-4">
                <StatusBadge status="approved" tone="table" />
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                Apr 16th, 2023
              </td>

              <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                $2,790
              </td>

              <td className="px-4 py-4 text-right">
                <button className="h-8 rounded-full border border-slate-200 px-4 text-sm text-slate-600">
                  Details
                </button>
              </td>
            </TableRow>
          </tbody>
        </Table>
      </div>
    </div>
  );
}
