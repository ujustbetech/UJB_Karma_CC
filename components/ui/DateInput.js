import Input from "@/components/ui/Input";

export default function DateInput({ type = "datetime-local", ...props }) {
  return <Input type={type} {...props} />;
}