"use client";

import { useState } from "react";
import { Plus, Eye, Trash2, Edit } from "lucide-react";

import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Text from "@/components/ui/Text";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";



export default function UIPlayground() {
  // ✅ STATE IS DEFINED HERE
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState("full");
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();
  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-12">
      {/* Page Title */}
      <Text as="h1" variant="h1">
        UI Playground
      </Text>

      {/* ================================
          Buttons
      ================================ */}
      <section className="space-y-4">
        <Text as="h2" variant="h2">
          Button Variants
        </Text>

        <div className="flex flex-wrap gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      {/* ================================
          Action Buttons
      ================================ */}
      <section className="space-y-4">
        <Text as="h2" variant="h2">
          ActionButton (with Tooltips)
        </Text>

        <div className="flex gap-3">
          <ActionButton icon={Eye} label="View" />
          <ActionButton icon={Edit} label="Edit" />
          <ActionButton
            icon={Trash2}
            label="Delete"
            variant="ghostDanger"
          />
        </div>
      </section>

      {/* ================================
          Cards
      ================================ */}
      <section className="space-y-6">
        <Text as="h2" variant="h2">
          Cards
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <Text as="h3" variant="h3">
              Default Card
            </Text>
            <Text variant="muted">
              Standard surface
            </Text>
          </Card>

          <Card variant="dashed">
            <Text as="h3" variant="h3">
              Dashed Card
            </Text>
            <Text variant="muted">
              Empty / add new
            </Text>
          </Card>

          <Card variant="subtle" padding="sm">
            <Text as="h3" variant="h3">
              Subtle Card
            </Text>
            <Text variant="caption">
              Secondary surface
            </Text>
          </Card>
        </div>
      </section>

      {/* ================================
          Tabs
      ================================ */}
      <section className="space-y-4">
        <Text as="h2" variant="h2">
          Tabs
        </Text>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { label: "Full Statistics", value: "full" },
            { label: "Results Summary", value: "summary" },
          ]}
        />
      </section>

      {/* ================================
          Inputs
      ================================ */}
      <section className="space-y-4 max-w-sm">
        <Text as="h2" variant="h2">
          Inputs
        </Text>

        <Input placeholder="Default input" />
        <Input size="sm" placeholder="Small input" />
        <Input size="lg" placeholder="Large input" />
        <Input error placeholder="Error input" />
        <Input disabled placeholder="Disabled input" />
      </section>

      {/* ================================
          Modal
      ================================ */}
      <section className="space-y-4">
        <Text as="h2" variant="h2">
          Modal
        </Text>

        <Button onClick={() => setModal(true)}>
          Open Modal
        </Button>

        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Example Modal"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setModal(false)}
              >
                Cancel
              </Button>
              <Button>
                Confirm
              </Button>
            </>
          }
        >
          <Text variant="muted">
            This is a reference-aligned modal.
          </Text>
        </Modal>
      </section>

      {/* Confirmation */}
      <section className="space-y-4">
        <Text as="h2" variant="h2">
          Confirm Modal
        </Text>

        <Button
          variant="danger"
          onClick={() => setConfirm(true)}
        >
          Delete Item
        </Button>

        <ConfirmModal
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => console.log("Confirmed")}
          title="Delete item"
          description="This action cannot be undone."
          confirmText="Delete"
          danger
        />
      </section>
      {/* toast */}
      <section className="space-y-4">
        <Text as="h2" variant="h2">
          Toasts
        </Text>

        <div className="flex gap-3">
          <Button onClick={() => toast.success("Success message")}>
            Success
          </Button>

          <Button
            variant="secondary"
            onClick={() => toast.info("Info message")}
          >
            Info
          </Button>

          <Button
            variant="danger"
            onClick={() => toast.error("Error message")}
          >
            Error
          </Button>
        </div>
      </section>
    </div>
  );
}
