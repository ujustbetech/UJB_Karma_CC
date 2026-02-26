import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <Card className="w-96">
        <h1 className="text-lg font-semibold text-neutral-700 mb-4">
          Admin Login
        </h1>

        <div className="space-y-4">
          <Input placeholder="Email" />
          <Input placeholder="Password" type="password" />
          <Button className="w-full">Sign In</Button>
        </div>
      </Card>
    </div>
  );
}
