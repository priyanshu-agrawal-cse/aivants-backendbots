import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Copy, Trash2, Variable, Eye, Sparkles, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Script {
  id: string;
  name: string;
  category: string;
  hook: string;
  context: string;
  value_proposition: string;
  proof: string;
  call_to_action: string;
  full_template: string;
  variables: string[];
  created_at: string;
}

const CATEGORIES = [
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "case_study", label: "Case Study" },
  { value: "value_email", label: "Value Email" },
  { value: "meeting_request", label: "Meeting Request" },
  { value: "closing_email", label: "Closing Email" },
  { value: "breakup_email", label: "Breakup Email" },
];

const CATEGORY_COLORS: Record<string, string> = {
  cold_outreach: "bg-primary/10 text-primary",
  follow_up: "bg-accent/10 text-accent-foreground",
  case_study: "bg-chart-3/10 text-foreground",
  value_email: "bg-chart-4/10 text-foreground",
  meeting_request: "bg-chart-2/10 text-foreground",
  closing_email: "bg-success/10 text-foreground",
  breakup_email: "bg-destructive/10 text-destructive",
};

const VARIABLES = ["{first_name}", "{last_name}", "{company_name}", "{industry}", "{location}"];

const SEED_SCRIPTS: Omit<Script, "id" | "created_at">[] = [
  {
    name: "The Consultative Opener",
    category: "cold_outreach",
    hook: "Hi {first_name},\n\nI came across {company_name} and noticed your work in {industry}.",
    context: "We've been working with companies in {industry} who face challenges scaling their client acquisition.",
    value_proposition: "We recently helped similar companies increase their inbound lead generation by 3x through automation.",
    proof: "One of our clients in {location} went from 50 to 200+ qualified leads per month within 60 days.",
    call_to_action: "Would you be open to a quick 15-minute conversation this week to see if we could help {company_name} achieve similar results?",
    full_template: "Hi {first_name},\n\nI came across {company_name} and noticed your work in {industry}.\n\nWe've been working with companies in {industry} who face challenges scaling their client acquisition.\n\nWe recently helped similar companies increase their inbound lead generation by 3x through automation.\n\nOne of our clients in {location} went from 50 to 200+ qualified leads per month within 60 days.\n\nWould you be open to a quick 15-minute conversation this week to see if we could help {company_name} achieve similar results?",
    variables: ["{first_name}", "{company_name}", "{industry}", "{location}"],
  },
  {
    name: "Gentle Follow-Up",
    category: "follow_up",
    hook: "Hi {first_name},\n\nJust wanted to quickly follow up on my previous email.",
    context: "I understand things get busy at {company_name}, so I wanted to keep this brief.",
    value_proposition: "I truly believe our solution could help {company_name} streamline its outbound process and save your team hours each week.",
    proof: "",
    call_to_action: "Would a quick 10-minute call work for you this week? Happy to work around your schedule.",
    full_template: "Hi {first_name},\n\nJust wanted to quickly follow up on my previous email.\n\nI understand things get busy at {company_name}, so I wanted to keep this brief.\n\nI truly believe our solution could help {company_name} streamline its outbound process and save your team hours each week.\n\nWould a quick 10-minute call work for you this week? Happy to work around your schedule.",
    variables: ["{first_name}", "{company_name}"],
  },
  {
    name: "Case Study Share",
    category: "case_study",
    hook: "Hi {first_name},\n\nI thought you might find this interesting.",
    context: "We recently worked with a company in {industry} facing similar challenges to what {company_name} might be experiencing.",
    value_proposition: "They were able to 4x their qualified pipeline in just 90 days using our automated outreach system.",
    proof: "I've attached the full case study with their results, strategy, and timeline.",
    call_to_action: "Would you like to explore if a similar approach could work for {company_name}?",
    full_template: "Hi {first_name},\n\nI thought you might find this interesting.\n\nWe recently worked with a company in {industry} facing similar challenges to what {company_name} might be experiencing.\n\nThey were able to 4x their qualified pipeline in just 90 days using our automated outreach system.\n\nI've attached the full case study with their results, strategy, and timeline.\n\nWould you like to explore if a similar approach could work for {company_name}?",
    variables: ["{first_name}", "{company_name}", "{industry}"],
  },
  {
    name: "Value-First Insight",
    category: "value_email",
    hook: "Hi {first_name},\n\nI was researching {industry} trends and found some data I thought you'd find valuable.",
    context: "Companies in {industry} in {location} are seeing a shift in how they acquire clients — moving from manual outreach to AI-powered systems.",
    value_proposition: "Here are 3 quick insights we've gathered:\n\n1. Personalized outreach gets 3x higher response rates\n2. Automated follow-ups recover 40% of silent leads\n3. Companies using structured scripts close 25% more deals",
    proof: "",
    call_to_action: "Happy to share more details on how {company_name} could leverage these trends. Worth a quick chat?",
    full_template: "Hi {first_name},\n\nI was researching {industry} trends and found some data I thought you'd find valuable.\n\nCompanies in {industry} in {location} are seeing a shift in how they acquire clients — moving from manual outreach to AI-powered systems.\n\nHere are 3 quick insights we've gathered:\n\n1. Personalized outreach gets 3x higher response rates\n2. Automated follow-ups recover 40% of silent leads\n3. Companies using structured scripts close 25% more deals\n\nHappy to share more details on how {company_name} could leverage these trends. Worth a quick chat?",
    variables: ["{first_name}", "{company_name}", "{industry}", "{location}"],
  },
  {
    name: "Direct Meeting Request",
    category: "meeting_request",
    hook: "Hi {first_name},\n\nI'll keep this short.",
    context: "I've been following {company_name}'s growth in {industry} and believe we can add value.",
    value_proposition: "We help companies like yours automate client acquisition — from lead research to personalized outreach to follow-up sequences.",
    proof: "We're already working with several companies in {location} in your space.",
    call_to_action: "Can I get 15 minutes on your calendar this week? Here's my booking link: [link]",
    full_template: "Hi {first_name},\n\nI'll keep this short.\n\nI've been following {company_name}'s growth in {industry} and believe we can add value.\n\nWe help companies like yours automate client acquisition — from lead research to personalized outreach to follow-up sequences.\n\nWe're already working with several companies in {location} in your space.\n\nCan I get 15 minutes on your calendar this week? Here's my booking link: [link]",
    variables: ["{first_name}", "{company_name}", "{industry}", "{location}"],
  },
  {
    name: "The Confident Close",
    category: "closing_email",
    hook: "Hi {first_name},\n\nGreat chatting with you about {company_name}'s growth plans.",
    context: "Based on our conversation, it's clear that automating your outreach process would have an immediate impact on your pipeline.",
    value_proposition: "Here's a summary of what we'd deliver:\n\n• Automated personalized outreach to your target companies\n• Follow-up sequences that run on autopilot\n• AI-generated emails using proven copywriting frameworks",
    proof: "Teams that onboard this month typically see their first results within 2 weeks.",
    call_to_action: "Shall I send over the agreement so we can get started?",
    full_template: "Hi {first_name},\n\nGreat chatting with you about {company_name}'s growth plans.\n\nBased on our conversation, it's clear that automating your outreach process would have an immediate impact on your pipeline.\n\nHere's a summary of what we'd deliver:\n\n• Automated personalized outreach to your target companies\n• Follow-up sequences that run on autopilot\n• AI-generated emails using proven copywriting frameworks\n\nTeams that onboard this month typically see their first results within 2 weeks.\n\nShall I send over the agreement so we can get started?",
    variables: ["{first_name}", "{company_name}"],
  },
  {
    name: "The Graceful Breakup",
    category: "breakup_email",
    hook: "Hi {first_name},\n\nI've reached out a few times but haven't heard back, so I'll assume the timing isn't right.",
    context: "No hard feelings at all — I understand priorities shift at {company_name}.",
    value_proposition: "If things change in the future and you'd like to explore how automation could help {company_name} scale its client acquisition, I'm just an email away.",
    proof: "",
    call_to_action: "Wishing you and the team at {company_name} all the best. Feel free to reach out anytime.",
    full_template: "Hi {first_name},\n\nI've reached out a few times but haven't heard back, so I'll assume the timing isn't right.\n\nNo hard feelings at all — I understand priorities shift at {company_name}.\n\nIf things change in the future and you'd like to explore how automation could help {company_name} scale its client acquisition, I'm just an email away.\n\nWishing you and the team at {company_name} all the best. Feel free to reach out anytime.",
    variables: ["{first_name}", "{company_name}"],
  },
];

export default function Scripts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editing, setEditing] = useState<Script | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Editor state
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("cold_outreach");
  const [editHook, setEditHook] = useState("");
  const [editContext, setEditContext] = useState("");
  const [editValueProp, setEditValueProp] = useState("");
  const [editProof, setEditProof] = useState("");
  const [editCTA, setEditCTA] = useState("");

  const buildFullTemplate = () =>
    [editHook, editContext, editValueProp, editProof, editCTA].filter(Boolean).join("\n\n");

  const extractVariables = (text: string) => {
    const matches = text.match(/\{[a-z_]+\}/g) || [];
    return [...new Set(matches)];
  };

  const fetchScripts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("outreach_scripts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setScripts((data as Script[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchScripts(); }, [user]);

  const seedTemplates = async () => {
    if (!user) return;
    const inserts = SEED_SCRIPTS.map((s) => ({
      ...s,
      user_id: user.id,
    }));
    const { error } = await supabase.from("outreach_scripts").insert(inserts);
    if (error) {
      toast({ title: "Error seeding", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Scripts added!", description: "7 proven outreach scripts loaded." });
      fetchScripts();
    }
  };

  const openCreate = () => {
    setEditing(null);
    setEditName("");
    setEditCategory("cold_outreach");
    setEditHook("");
    setEditContext("");
    setEditValueProp("");
    setEditProof("");
    setEditCTA("");
    setShowEditor(true);
    setShowPreview(false);
  };

  const openEdit = (s: Script) => {
    setEditing(s);
    setEditName(s.name);
    setEditCategory(s.category);
    setEditHook(s.hook);
    setEditContext(s.context);
    setEditValueProp(s.value_proposition);
    setEditProof(s.proof);
    setEditCTA(s.call_to_action);
    setShowEditor(true);
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!user || !editName.trim()) return;
    const full = buildFullTemplate();
    const vars = extractVariables(full);
    const payload = {
      name: editName,
      category: editCategory,
      hook: editHook,
      context: editContext,
      value_proposition: editValueProp,
      proof: editProof,
      call_to_action: editCTA,
      full_template: full,
      variables: vars,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("outreach_scripts").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Script updated" });
    } else {
      const { error } = await supabase.from("outreach_scripts").insert({ ...payload, user_id: user.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Script created" });
    }
    setShowEditor(false);
    fetchScripts();
  };

  const handleDuplicate = async (s: Script) => {
    if (!user) return;
    const { error } = await supabase.from("outreach_scripts").insert({
      user_id: user.id, name: `${s.name} (Copy)`, category: s.category,
      hook: s.hook, context: s.context, value_proposition: s.value_proposition,
      proof: s.proof, call_to_action: s.call_to_action,
      full_template: s.full_template, variables: s.variables,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Script duplicated" });
    fetchScripts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("outreach_scripts").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Script deleted" });
    setDeleteId(null);
    fetchScripts();
  };

  const applyPreview = (text: string) =>
    text
      .replace(/\{first_name\}/g, "John")
      .replace(/\{last_name\}/g, "Smith")
      .replace(/\{company_name\}/g, "Alpha Realty")
      .replace(/\{industry\}/g, "Real Estate")
      .replace(/\{location\}/g, "New York");

  const filteredScripts = filterCategory === "all"
    ? scripts
    : scripts.filter((s) => s.category === filterCategory);

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Script Library</h1>
          <p className="text-muted-foreground">Structured outreach scripts from proven copywriting frameworks</p>
        </div>
        <div className="flex gap-2">
          {scripts.length === 0 && !loading && (
            <Button variant="outline" onClick={seedTemplates}>
              <Sparkles className="h-4 w-4 mr-2" />
              Load Templates
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Script
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      {!showEditor && scripts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory("all")}
          >
            All ({scripts.length})
          </Button>
          {CATEGORIES.map((cat) => {
            const count = scripts.filter((s) => s.category === cat.value).length;
            if (count === 0) return null;
            return (
              <Button
                key={cat.value}
                variant={filterCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(cat.value)}
              >
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* Editor */}
      {showEditor && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Script" : "New Script"}</CardTitle>
            <CardDescription>Build your outreach script section by section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Script Name *</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. The Consultative Opener" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-1">Variables:</span>
              {VARIABLES.map((v) => (
                <Badge key={v} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs font-mono">
                  {v}
                </Badge>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                  Hook
                </Label>
                <Textarea value={editHook} onChange={(e) => setEditHook(e.target.value)} placeholder="Opening line that grabs attention..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-chart-3" />
                  Context
                </Label>
                <Textarea value={editContext} onChange={(e) => setEditContext(e.target.value)} placeholder="Why you're reaching out..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                  Value Proposition
                </Label>
                <Textarea value={editValueProp} onChange={(e) => setEditValueProp(e.target.value)} placeholder="What's in it for them..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-chart-4" />
                  Proof
                </Label>
                <Textarea value={editProof} onChange={(e) => setEditProof(e.target.value)} placeholder="Social proof, stats, case study reference..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-success" />
                  Call To Action
                </Label>
                <Textarea value={editCTA} onChange={(e) => setEditCTA(e.target.value)} placeholder="What you want them to do..." rows={2} />
              </div>
            </div>

            {/* Preview Toggle */}
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>

            {showPreview && (
              <div className="rounded-lg border bg-muted/30 p-5">
                <p className="text-xs font-medium text-muted-foreground mb-3">Preview with sample data:</p>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {applyPreview(buildFullTemplate()) || "Start writing to see preview..."}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!editName.trim()}>
                {editing ? "Save Changes" : "Save Script"}
              </Button>
              <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Script List */}
      {loading ? (
        <p className="text-muted-foreground">Loading scripts…</p>
      ) : filteredScripts.length === 0 && !showEditor ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {scripts.length === 0
                ? "No scripts yet. Click \"Load Templates\" to start with 7 proven outreach frameworks, or create your own."
                : "No scripts match this filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{script.name}</h3>
                      <Badge className={`text-xs ${CATEGORY_COLORS[script.category] || ""}`}>
                        {getCategoryLabel(script.category)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                      {script.hook || script.full_template}
                    </div>
                    {script.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {script.variables.map((v) => (
                          <Badge key={v} variant="outline" className="text-xs font-mono">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(script)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(script)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(script.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete script?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this outreach script.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
