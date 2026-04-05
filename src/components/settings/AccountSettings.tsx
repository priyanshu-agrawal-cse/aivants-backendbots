import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export function AccountSettings() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
        <div><Label>User ID</Label><Input value={user?.id || ""} disabled className="font-mono text-xs" /></div>
      </CardContent>
    </Card>
  );
}
