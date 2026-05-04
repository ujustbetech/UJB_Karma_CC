"use client";

import { useRouter } from "next/navigation";

import Text from "@/components/ui/Text";
import TodoForm from "@/components/admin/tasks/TodoForm";
import Button from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function AddTodoPage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Text variant="h1">Add TODO</Text>
        <Button variant="outline" onClick={() => router.push("/admin/tasks")}>
          <ArrowLeft size={16} /> Back to My TODO
        </Button>
      </div>
      <TodoForm mode="create" />
    </div>
  );
}
