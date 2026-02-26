"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {cancelText}
          </Button>

          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {description && (
        <Text variant="muted">
          {description}
        </Text>
      )}
    </Modal>
  );
}
