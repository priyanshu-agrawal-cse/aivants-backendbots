import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderKanban,
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays, isPast } from "date-fns";

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  start_date: string | null;
  deadline: string | null;
  status: string;
  team_notifications: boolean;
  client_notifications: boolean;
  notes: string | null;
  created_at: string;
  clients?: Client;
}

interface ProjectAssignment {
  id: string;
  project_id: string;
  team_member_id: string;
  role: string;
  team_members?: TeamMember;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
}

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  development: "bg-primary/15 text-primary",
  review: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  on_hold: "bg-destructive/15 text-destructive",
};

const statuses = ["planning", "development", "review", "completed", "on_hold"];

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState({ title: "", due_date: "" });

  const [form, setForm] = useState({
    client_id: "",
    name: "",
    description: "",
    start_date: "",
    deadline: "",
    status: "planning",
    team_notifications: true,
    client_notifications: false,
    notes: "",
  });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [projectsRes, clientsRes, teamRes] = await Promise.all([
      supabase
        .from("projects")
        .select("*, clients(id, name, company)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, company").eq("user_id", user.id),
      supabase.from("team_members").select("*").eq("user_id", user.id).eq("is_active", true),
    ]);

    setProjects(projectsRes.data || []);
    setClients(clientsRes.data || []);
    setTeamMembers(teamRes.data || []);
    setLoading(false);
  };

  const fetchProjectDetails = async (projectId: string) => {
    const [assignRes, milestonesRes] = await Promise.all([
      supabase
        .from("project_team_assignments")
        .select("*, team_members(*)")
        .eq("project_id", projectId),
      supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true }),
    ]);
    setAssignments(assignRes.data || []);
    setMilestones(milestonesRes.data || []);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectDetails(selectedProject.id);
    }
  }, [selectedProject]);

  const resetForm = () => {
    setForm({
      client_id: "",
      name: "",
      description: "",
      start_date: "",
      deadline: "",
      status: "planning",
      team_notifications: true,
      client_notifications: false,
      notes: "",
    });
    setEditingProject(null);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      client_id: project.client_id || "",
      name: project.name,
      description: project.description || "",
      start_date: project.start_date || "",
      deadline: project.deadline || "",
      status: project.status,
      team_notifications: project.team_notifications,
      client_notifications: project.client_notifications,
      notes: project.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    const payload = {
      user_id: user.id,
      client_id: form.client_id || null,
      name: form.name.trim(),
      description: form.description || null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      status: form.status,
      team_notifications: form.team_notifications,
      client_notifications: form.client_notifications,
      notes: form.notes || null,
    };

    if (editingProject) {
      const { error } = await supabase.from("projects").update(payload).eq("id", editingProject.id);
      if (error) {
        toast.error("Failed to update project");
        return;
      }
      toast.success("Project updated");
    } else {
      const { error } = await supabase.from("projects").insert(payload);
      if (error) {
        toast.error("Failed to create project");
        return;
      }
      toast.success("Project created");
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete project");
    } else {
      toast.success("Project deleted");
      setSelectedProject(null);
      fetchData();
    }
  };

  const assignTeamMember = async (memberId: string) => {
    if (!selectedProject) return;
    const { error } = await supabase.from("project_team_assignments").insert({
      project_id: selectedProject.id,
      team_member_id: memberId,
      role: "contributor",
    });
    if (error) {
      if (error.code === "23505") {
        toast.error("Member already assigned");
      } else {
        toast.error("Failed to assign member");
      }
    } else {
      toast.success("Team member assigned");
      fetchProjectDetails(selectedProject.id);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from("project_team_assignments").delete().eq("id", assignmentId);
    if (error) {
      toast.error("Failed to remove assignment");
    } else {
      toast.success("Member removed");
      if (selectedProject) fetchProjectDetails(selectedProject.id);
    }
  };

  const addMilestone = async () => {
    if (!selectedProject || !newMilestone.title.trim()) return;
    const { error } = await supabase.from("project_milestones").insert({
      project_id: selectedProject.id,
      title: newMilestone.title.trim(),
      due_date: newMilestone.due_date || null,
    });
    if (error) {
      toast.error("Failed to add milestone");
    } else {
      toast.success("Milestone added");
      setNewMilestone({ title: "", due_date: "" });
      fetchProjectDetails(selectedProject.id);
    }
  };

  const toggleMilestone = async (milestone: Milestone) => {
    const { error } = await supabase
      .from("project_milestones")
      .update({ completed: !milestone.completed, completed_at: !milestone.completed ? new Date().toISOString() : null })
      .eq("id", milestone.id);
    if (error) {
      toast.error("Failed to update milestone");
    } else {
      if (selectedProject) fetchProjectDetails(selectedProject.id);
    }
  };

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    if (isPast(new Date(deadline))) return { color: "text-destructive", label: "Overdue" };
    if (days <= 3) return { color: "text-destructive", label: `${days}d left` };
    if (days <= 7) return { color: "text-warning", label: `${days}d left` };
    return { color: "text-muted-foreground", label: `${days}d left` };
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clients?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const unassignedMembers = teamMembers.filter(
    (m) => !assignments.some((a) => a.team_member_id === m.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Project Management</h1>
          <p className="text-muted-foreground">Track projects, assign teams, manage deadlines</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Project Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AI Lead Automation System" />
              </div>
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.company && `(${c.company})`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Project description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Team Notifications (Auto)</Label>
                <Switch checked={form.team_notifications} onCheckedChange={(c) => setForm({ ...form, team_notifications: c })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Client Notifications</Label>
                <Switch checked={form.client_notifications} onCheckedChange={(c) => setForm({ ...form, client_notifications: c })} />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
              </div>
              <Button onClick={handleSave}>{editingProject ? "Update Project" : "Create Project"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Badge variant="secondary">{filtered.length} projects</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <p className="text-muted-foreground p-4">Loading...</p>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-6 text-muted-foreground">No projects yet. Create your first project!</CardContent></Card>
          ) : (
            filtered.map((project) => {
              const deadlineStatus = getDeadlineStatus(project.deadline);
              return (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${selectedProject?.id === project.id ? "border-primary" : ""}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.clients?.name || "No client"}</p>
                      </div>
                      <Badge className={statusColors[project.status]}>{project.status.replace("_", " ")}</Badge>
                    </div>
                    {project.deadline && (
                      <div className={`flex items-center gap-1 mt-2 text-sm ${deadlineStatus?.color}`}>
                        {deadlineStatus?.label === "Overdue" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {format(new Date(project.deadline), "MMM d, yyyy")} ({deadlineStatus?.label})
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedProject ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedProject.name}</CardTitle>
                    <CardDescription>{selectedProject.clients?.name || "No client assigned"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(selectedProject)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(selectedProject.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={statusColors[selectedProject.status]}>{selectedProject.status.replace("_", " ")}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className="font-medium">
                          {selectedProject.deadline ? format(new Date(selectedProject.deadline), "MMM d, yyyy") : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                          {selectedProject.start_date ? format(new Date(selectedProject.start_date), "MMM d, yyyy") : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Team Size</p>
                        <p className="font-medium">{assignments.length} members</p>
                      </div>
                    </div>
                    {selectedProject.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="mt-1">{selectedProject.description}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Team Notifications:</span>
                        <Badge variant={selectedProject.team_notifications ? "default" : "secondary"}>
                          {selectedProject.team_notifications ? "ON" : "OFF"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Client Notifications:</span>
                        <Badge variant={selectedProject.client_notifications ? "default" : "secondary"}>
                          {selectedProject.client_notifications ? "ON" : "OFF"}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="team" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Select onValueChange={assignTeamMember}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Add team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {unassignedMembers.length === 0 ? (
                            <SelectItem value="none" disabled>No available members</SelectItem>
                          ) : (
                            unassignedMembers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name} — {m.role}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {assignments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No team members assigned yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {assignments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{a.team_members?.name}</p>
                                <p className="text-sm text-muted-foreground">{a.team_members?.role} — {a.team_members?.email}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeAssignment(a.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="milestones" className="space-y-4 mt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Milestone title"
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="date"
                        value={newMilestone.due_date}
                        onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                        className="w-[150px]"
                      />
                      <Button onClick={addMilestone}>Add</Button>
                    </div>
                    {milestones.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No milestones yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {milestones.map((m) => (
                          <div
                            key={m.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${m.completed ? "bg-success/5" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <button onClick={() => toggleMilestone(m)}>
                                <CheckCircle2 className={`h-5 w-5 ${m.completed ? "text-success" : "text-muted-foreground"}`} />
                              </button>
                              <div>
                                <p className={`font-medium ${m.completed ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                                {m.due_date && (
                                  <p className="text-sm text-muted-foreground">{format(new Date(m.due_date), "MMM d, yyyy")}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a project to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
