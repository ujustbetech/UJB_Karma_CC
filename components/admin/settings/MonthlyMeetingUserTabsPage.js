"use client";

import { useEffect, useMemo, useState } from "react";
import {
  db,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "@/services/adminMonthlyMeetingFirebaseService";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getDefaultMonthlyMeetingUserTabsConfig,
  MONTHLY_MEETING_USER_TAB_DEFINITIONS,
  MONTHLY_MEETING_USER_TAB_SETTINGS_COLLECTION,
  MONTHLY_MEETING_USER_TAB_SETTINGS_DOC,
  normalizeMonthlyMeetingUserTabsConfig,
} from "@/lib/monthlymeeting/userTabsConfig";

export default function MonthlyMeetingUserTabsPage() {
  const toast = useToast();
  const [config, setConfig] = useState(getDefaultMonthlyMeetingUserTabsConfig());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const settingsRef = doc(
      db,
      MONTHLY_MEETING_USER_TAB_SETTINGS_COLLECTION,
      MONTHLY_MEETING_USER_TAB_SETTINGS_DOC
    );

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        const data = snapshot.data() || {};
        setConfig(normalizeMonthlyMeetingUserTabsConfig(data.tabs));
        setLoaded(true);
      },
      () => {
        setConfig(getDefaultMonthlyMeetingUserTabsConfig());
        setLoaded(true);
      }
    );

    return () => unsubscribe();
  }, []);

  const enabledCount = useMemo(
    () => Object.values(config).filter(Boolean).length,
    [config]
  );

  const handleToggle = (key) => {
    setConfig((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await setDoc(
        doc(
          db,
          MONTHLY_MEETING_USER_TAB_SETTINGS_COLLECTION,
          MONTHLY_MEETING_USER_TAB_SETTINGS_DOC
        ),
        {
          tabs: config,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Monthly meeting user tabs updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save monthly meeting tab settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(getDefaultMonthlyMeetingUserTabsConfig());
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Text variant="h3">Monthly Meeting User Tabs</Text>
        <Text variant="muted" className="mt-2">
          Control which tabs appear on the user-side monthly meeting detail page. This
          is a global setting and applies to all existing and future monthly meetings.
        </Text>
        <Text className="mt-3 text-sm font-medium text-slate-700">
          {enabledCount} of {MONTHLY_MEETING_USER_TAB_DEFINITIONS.length} tabs enabled
        </Text>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MONTHLY_MEETING_USER_TAB_DEFINITIONS.map((tab) => {
          const Icon = tab.icon;
          const enabled = !!config[tab.key];

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleToggle(tab.key)}
              className={`rounded-2xl border p-5 text-left transition ${
                enabled
                  ? "border-blue-200 bg-blue-50/70 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      enabled
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tab.label}</p>
                    <p className="text-xs text-slate-500">{tab.key}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {enabled ? "Visible" : "Hidden"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="muted">
          {loaded
            ? "Changes take effect for all monthly meeting user pages."
            : "Loading saved tab visibility settings..."}
        </Text>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleReset} disabled={saving}>
            Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving || !loaded}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
