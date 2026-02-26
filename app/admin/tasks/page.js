"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("tasks");

  const tabs = [
    { key: "tasks", label: "Tasks" },
    { key: "discussion", label: "Discussion" },
    { key: "timeline", label: "Timeline" },
    { key: "files", label: "Files" },
  ];

  return (
    <>
      <Tabs
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Content */}
      {activeTab === "tasks" && <div>Tasks content</div>}
      {activeTab === "discussion" && <div>Discussion content</div>}
      {activeTab === "timeline" && <div>Timeline content</div>}
      {activeTab === "files" && <div>Files content</div>}
    </>
  );
}
