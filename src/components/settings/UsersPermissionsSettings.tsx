import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Loader2, Shield, Eye, UserCog } from "lucide-react";

const roleInfo: Record<string, { label: string; desc: string; icon: any; color: string }> = {
  admin: { label: "Admin", desc: "Full access to all features and settings", icon: Shield, color: "text-destructive" },
  team_member: { label: "Team Member", desc: "Can manage leads, projects, and campaigns", icon: UserCog, color: "text-primary" },
  viewer: { label: "Viewer", desc: "Read-only access to dashboards", icon: Eye, color: "text-muted-foreground" },
};

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export function UsersPermissionsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [myRole, setMyRole] = useState<string>("viewer");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: allRoles } = await supabase.from("user_roles").select("*");
      setRoles((allRoles as UserRole[]) || []);
      const mine = (allRoles as UserRole[])?.find(r => r.user_id === user.id);
      if (mine) setMyRole(mine.role);
      setLoading(false);
    })();
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
      if (error) throw error;
      setRoles(prev => prev.map(r => r.user_id === userId ? { ...r, role: newRole } : r));
      toast({ title: "Role updated!" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  const isAdmin = myRole === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Users & Permissions</h1>
        <p className="text-muted-foreground text-sm">Manage user roles and access control</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Definitions</CardTitle>
          <CardDescription>Understanding what each role can access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(roleInfo).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-md border">
                <Icon className={`h-5 w-5 ${info.color}`} />
                <div>
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.desc}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>{isAdmin ? "Manage roles for all users" : "You need admin access to manage roles"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            roles.map(role => {
              const info = roleInfo[role.role] || roleInfo.viewer;
              return (
                <div key={role.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="text-sm font-mono">{role.user_id === user?.id ? `${role.user_id} (You)` : role.user_id}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(role.created_at).toLocaleDateString()}</p>
                  </div>
                  {isAdmin ? (
                    <Select value={role.role} onValueChange={v => handleRoleChange(role.user_id, v)} disabled={role.user_id === user?.id}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="team_member">Team Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{info.label}</Badge>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
