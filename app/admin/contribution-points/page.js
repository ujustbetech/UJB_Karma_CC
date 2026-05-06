"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import { fetchCpBoardMembers } from "@/services/adminContributionPointService";

export default function AdminContributionPointsPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      try {
        const rows = await fetchCpBoardMembers();
        if (active) {
          setMembers(rows);
        }
      } catch (error) {
        console.error("Failed to load CP members", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text as="h1" variant="h1">Contribution Points</Text>
          <Text variant="muted">View CP board members and totals.</Text>
        </div>

        <Link href="/admin/contribution-points/add">
          <Button>Add Activity</Button>
        </Link>
      </div>

      <Card className="overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6">
            <Text variant="muted">Loading contribution point members...</Text>
          </div>
        ) : members.length === 0 ? (
          <div className="p-6">
            <Text variant="muted">No CP board members found.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Total Points</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{member.name || "-"}</td>
                    <td className="px-4 py-3">{member.phoneNumber || "-"}</td>
                    <td className="px-4 py-3">{member.role || "-"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {member.totalPoints || 0}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/contribution-points/${member.id}`}
                        className="text-sm font-medium text-orange-600 hover:text-orange-700"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}


