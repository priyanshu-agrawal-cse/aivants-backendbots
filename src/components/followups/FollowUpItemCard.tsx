import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Pause, Play, SkipForward, Trash2, CalendarClock, User,
  CreditCard, Bell, AlertCircle, Mail, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { useState } from "react";

export interface FollowUpItemData {
  id: string;
  lead_id: string;
  sequence_id: string;
  campaign_id: string | null;
  current_step: number;
  status: string;
  next_followup_date: string | null;
  last_email_sent_at: string | null;
  followup_type: string;
  category: string;
  scheduled_date: string | null;
  condition_stop_on: string | null;
  sender_name: string;
  sender_email: string;
  purpose: string;
  end_date: string | null;
  notes: string;
  client_name: string;
  client_email: string;
  client_company: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  lead?: { first_name: string; last_name: string | null; email: string; company_name: string | null };
  sequence?: { name: string; followup_type: string };
  steps?: StepData[];
}

export interface StepData {
  id: string;
  step_number: number;
  delay_days: number;
  channel: string;
  subject_override: string;
  body_override: string;
  action_type: string;
  notes: string;
  template_id: string | null;
  script_id: string | null;
  content_asset_id: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  cold_outreach: "bg-primary/10 text-primary",
  proposal_followup: "bg-chart-4/10 text-chart-4",
  meeting_reminder: "bg-accent/10 text-accent",
  payment_reminder: "bg-warning/10 text-warning",
  contract_renewal: "bg-destructive/10 text-destructive",
  client_checkin: "bg-success/10 text-success",
  custom: "bg-muted text-muted-foreground",
  sales: "bg-primary/10 text-primary",
  nurturing: "bg-accent/10 text-accent",
  check_in: "bg-success/10 text-success",
};

const TYPE_LABELS: Record<string, string> = {
  cold_outreach: "Cold Outreach",
  proposal_followup: "Proposal Follow-Up",
  meeting_reminder: "Meeting Reminder",
  payment_reminder: "Payment Reminder",
  contract_renewal: "Contract Renewal",
  client_checkin: "Client Check-In",
  custom: "Custom",
  sales: "Sales",
  nurturing: "Nurturing",
  check_in: "Check-In",
};

interface FollowUpItemCardProps {
  item: FollowUpItemData;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onSkip: (item: FollowUpItemData) => void;
  onReschedule: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FollowUpItemCard({ item, onPause, onResume, onSkip, onReschedule, onDelete }: FollowUpItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isManualClient = !!item.client_name;
  const displayName = isManualClient
    ? item.client_name
    : item.lead ? `${item.lead.first_name} ${item.lead.last_name || ""}`.trim() : "Unknown";
  const company = isManualClient ? item.client_company : item.lead?.company_name;
  const email = isManualClient ? item.client_email : item.lead?.email;
  const seqName = item.sequence?.name || "—";
  const type = item.followup_type || "sales";
  const isOverdue = item.next_followup_date && isPast(parseISO(item.next_followup_date)) && !isToday(parseISO(item.next_followup_date));

  return (
    <div className="rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
            {type === "payment_reminder" || type === "contract_renewal"
              ? <CreditCard className="h-4 w-4 text-warning" />
              : <User className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{displayName}</span>
              {company && <span className="text-sm text-muted-foreground">— {company}</span>}
              <Badge variant="outline" className={TYPE_COLORS[type] || "bg-muted text-muted-foreground"}>
                {TYPE_LABELS[type] || type.replace(/_/g, " ")}
              </Badge>
              {isOverdue && item.status === "active" && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
              {item.status === "paused" && <Badge variant="secondary" className="text-xs">Paused</Badge>}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.next_followup_date ? format(parseISO(item.next_followup_date), "MMM d, yyyy") : "No date"}
              </span>
              <span>Step {item.current_step + 1}</span>
              <span>{seqName}</span>
              {item.purpose && <span className="text-xs italic">"{item.purpose}"</span>}
              {item.sender_name && (
                <span className="flex items-center gap-1 text-xs">
                  <Mail className="h-3 w-3" />
                  {item.sender_name}
                </span>
              )}
              {item.condition_stop_on && (
                <span className="flex items-center gap-1 text-xs text-accent">
                  <Bell className="h-3 w-3" />
                  Stop: {item.condition_stop_on.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)} title="Details">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {item.status === "active" && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPause(item.id)} title="Pause">
                <Pause className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSkip(item)} title="Skip step">
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReschedule(item.id)} title="Reschedule">
                <CalendarClock className="h-4 w-4" />
              </Button>
            </>
          )}
          {item.status === "paused" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onResume(item.id)} title="Resume">
              <Play className="h-4 w-4 text-success" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(item.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {email && (
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <span className="font-mono text-xs">{email}</span>
              </div>
            )}
            {item.sender_email && (
              <div>
                <span className="text-xs text-muted-foreground block">Sender</span>
                <span className="font-mono text-xs">{item.sender_name} &lt;{item.sender_email}&gt;</span>
              </div>
            )}
            {item.end_date && (
              <div>
                <span className="text-xs text-muted-foreground block">End Date</span>
                <span>{format(parseISO(item.end_date), "MMM d, yyyy")}</span>
              </div>
            )}
            {item.last_email_sent_at && (
              <div>
                <span className="text-xs text-muted-foreground block">Last Sent</span>
                <span>{format(parseISO(item.last_email_sent_at), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
          {item.notes && (
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Notes</span>
              <p className="text-sm bg-card rounded p-2 border">{item.notes}</p>
            </div>
          )}
          {/* Step timeline */}
          {item.steps && item.steps.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground block mb-2">Sequence Steps</span>
              <div className="space-y-1">
                {item.steps.map((step) => {
                  const isDone = step.step_number <= item.current_step;
                  const isCurrent = step.step_number === item.current_step + 1;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${
                        isCurrent ? "bg-primary/10 border border-primary/20" : isDone ? "opacity-50" : "bg-card border"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full shrink-0 ${isDone ? "bg-success" : isCurrent ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      <span className="font-medium text-xs w-14">Day {step.delay_days}</span>
                      <span className="flex-1 truncate text-xs">
                        {step.subject_override || step.action_type || step.channel}
                      </span>
                      {step.content_asset_id && <FileText className="h-3 w-3 text-muted-foreground" />}
                      {isDone && <span className="text-xs text-success">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
