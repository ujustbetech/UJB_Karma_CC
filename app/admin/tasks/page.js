"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Table from "@/components/table/Table";
import TableHeader from "@/components/table/TableHeader";
import TableRow from "@/components/table/TableRow";
import Pagination from "@/components/table/Pagination";
import Tooltip from "@/components/ui/Tooltip";
import ActionButton from "@/components/ui/ActionButton";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  TODO_PURPOSE_OPTIONS,
  TODO_STATUS_OPTIONS,
} from "@/lib/todo/constants";
import { CheckCircle, Eye, Pencil, Play, Plus } from "lucide-react";

function formatDisplayDate(value) {
  if (!value) return "-";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split("-");
    return `${day}/${month}/${year.slice(-2)}`;
  }

  const parsed = new Date(value?.seconds ? value.seconds * 1000 : value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function formatDisplayDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value?.seconds ? value.seconds * 1000 : value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const date = formatDisplayDate(parsed);
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${date} ${hours}:${minutes}`;
}

function formatMinutesAsDuration(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "-";
  }

  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return "-";
  if (minutes < 60) return `${minutes} min`;

  const hoursPart = Math.floor(minutes / 60);
  const minutesPart = minutes % 60;

  return minutesPart ? `${hoursPart} hr ${minutesPart} min` : `${hoursPart} hr`;
}

export default function TasksPage() {
  const router = useRouter();
  const toast = useToast();
  const { admin } = useAdminSession();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [assignToFilter, setAssignToFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const isOps = String(admin?.role || "").trim().toLowerCase() === "ops";

  const loadTodos = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.set("status", statusFilter);
      if (purposeFilter) query.set("purpose", purposeFilter);
      if (!isOps && assignToFilter) query.set("assignTo", assignToFilter);
      if (search.trim()) query.set("search", search.trim());

      const res = await fetch(`/api/admin/todos?${query.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to load TODOs");
      }

      setTodos(Array.isArray(data.todos) ? data.todos : []);
    } catch (error) {
      toast.error(error.message || "Failed to load TODOs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [statusFilter, purposeFilter, assignToFilter, search, isOps]);

  const assignToOptions = useMemo(() => {
    const seen = new Map();
    todos.forEach((todo) => {
      const key = String(todo.assign_to || "").trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.set(key, {
          label: todo.assign_to_name
            ? `${todo.assign_to_name} (${todo.assign_to})`
            : todo.assign_to,
          value: key,
        });
      }
    });

    return [{ label: "All OPS", value: "" }, ...seen.values()];
  }, [todos]);

  const paginated = todos.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, purposeFilter, assignToFilter, search]);

  const handleStart = async (id) => {
    try {
      const res = await fetch(`/api/admin/todos/${id}/start`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to start TODO");
      }

      if (data.todo) {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? { ...todo, ...data.todo } : todo))
        );
      } else {
        await loadTodos();
      }

      toast.success("TODO started");
    } catch (error) {
      toast.error(error.message || "Failed to start TODO");
    }
  };

  const handleDone = async (id) => {
    try {
      const res = await fetch(`/api/admin/todos/${id}/done`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to complete TODO");
      }

      if (data.todo) {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? { ...todo, ...data.todo } : todo))
        );
      } else {
        await loadTodos();
      }

      toast.success("TODO completed");
    } catch (error) {
      toast.error(error.message || "Failed to complete TODO");
    }
  };

  const columns = [
    { key: "linked", label: "Linked Person" },
    { key: "type", label: "Type" },
    { key: "purpose", label: "Purpose" },
    { key: "followup", label: "Follow-up Date" },
    { key: "ops", label: "OPS Owner" },
    { key: "status", label: "Status" },
    { key: "start", label: "Start Time" },
    { key: "end", label: "Completion Date" },
    { key: "minutes", label: "Minutes" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Text variant="h1">My TODO</Text>
        <Button onClick={() => router.push("/admin/tasks/add")}>
          <Plus size={16} /> Add TODO
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[220px]">
            <Input
              placeholder="Search linked person / purpose"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="w-[180px]">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={TODO_STATUS_OPTIONS}
            />
          </div>

          <div className="w-[220px]">
            <Select
              value={purposeFilter}
              onChange={setPurposeFilter}
              options={[
                { label: "All Purposes", value: "" },
                ...TODO_PURPOSE_OPTIONS.filter((option) => option.value),
              ]}
            />
          </div>

          {!isOps && (
            <div className="w-[240px]">
              <Select
                value={assignToFilter}
                onChange={setAssignToFilter}
                options={assignToOptions}
              />
            </div>
          )}
        </div>
      </Card>

      <Card>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table>
            <TableHeader columns={columns} />
            <tbody>
              {paginated.map((todo) => (
                <TableRow key={todo.id}>
                  <td className="px-4 py-3">{todo.linked_name || "-"}</td>
                  <td className="px-4 py-3">{todo.user_type || "-"}</td>
                  <td className="px-4 py-3">{todo.purpose || "-"}</td>
                  <td className="px-4 py-3">{formatDisplayDate(todo.follow_up_date)}</td>
                  <td className="px-4 py-3">{todo.assign_to_name || todo.assign_to || "-"}</td>
                  <td className="px-4 py-3">{todo.status || "-"}</td>
                  <td className="px-4 py-3">{formatDisplayDateTime(todo.start_time)}</td>
                  <td className="px-4 py-3">{formatDisplayDateTime(todo.completion_date)}</td>
                  <td className="px-4 py-3">{formatMinutesAsDuration(todo.completion_time)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Tooltip content="View">
                        <ActionButton
                          icon={Eye}
                          onClick={() => router.push(`/admin/tasks/${todo.id}`)}
                        />
                      </Tooltip>

                      <Tooltip content="Edit">
                        <ActionButton
                          icon={Pencil}
                          onClick={() => router.push(`/admin/tasks/${todo.id}/edit`)}
                        />
                      </Tooltip>

                      {todo.status === "Pending" && (
                        <Tooltip content="Start">
                          <ActionButton
                            icon={Play}
                            onClick={() => handleStart(todo.id)}
                          />
                        </Tooltip>
                      )}

                      {todo.status === "In Progress" && (
                        <Tooltip content="Done">
                          <ActionButton
                            icon={CheckCircle}
                            onClick={() => handleDone(todo.id)}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}

        <div className="mt-4 flex justify-end">
          <Pagination
            page={page}
            pageSize={perPage}
            total={todos.length}
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}
