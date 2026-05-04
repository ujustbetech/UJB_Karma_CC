"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Text from "@/components/ui/Text";
import TodoForm from "@/components/admin/tasks/TodoForm";
import { useToast } from "@/components/ui/ToastProvider";
import Button from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function EditTodoPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodo = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/admin/todos/${id}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load TODO");
        }

        setTodo(data.todo || null);
      } catch (error) {
        toast.error(error.message || "Failed to load TODO");
      } finally {
        setLoading(false);
      }
    };

    loadTodo();
  }, [id, toast]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Text variant="h1">Edit TODO</Text>
        <Button variant="outline" onClick={() => router.push("/admin/tasks")}>
          <ArrowLeft size={16} /> Back to My TODO
        </Button>
      </div>
      {loading ? <p>Loading...</p> : <TodoForm mode="edit" todo={todo} />}
    </div>
  );
}
