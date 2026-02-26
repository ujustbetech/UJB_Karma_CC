"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "@/components/ui/Input";
import ActionButton from "@/components/ui/ActionButton";

export default function PasswordInput({ error, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        error={error}
        {...props}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <ActionButton
          icon={visible ? EyeOff : Eye}
          label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible(!visible)}
        />
      </div>
    </div>
  );
}
