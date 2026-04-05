import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Pencil, Trash2, Users, Eye } from "lucide-react";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    subject: string | null;
    leadCount: number;
    emailStats?: { sent: number; openRate: number; replyRate: number; bounceRate: number };
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onOpen: () => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active": return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
    case "paused": return <Badge className="bg-warning/10 text-warning border-warning/20">Paused</Badge>;
    case "completed": return <Badge className="bg-primary/10 text-primary border-primary/20">Completed</Badge>;
    case "draft": return <Badge variant="secondary">Draft</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export function CampaignCard({ campaign, onEdit, onDelete, onToggleStatus, onOpen }: CampaignCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={onOpen}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{campaign.name}</h3>
              {getStatusBadge(campaign.status)}
            </div>
            {campaign.subject && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                Subject: {campaign.subject}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {campaign.leadCount} lead{campaign.leadCount !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {campaign.status !== "draft" && (
              <Button variant="outline" size="sm" onClick={onToggleStatus}>
                {campaign.status === "active" ? (
                  <><Pause className="h-3.5 w-3.5 mr-1" /> Pause</>
                ) : (
                  <><Play className="h-3.5 w-3.5 mr-1" /> Resume</>
                )}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onOpen}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {campaign.emailStats && campaign.emailStats.sent > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-bold">{campaign.emailStats.sent.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{campaign.emailStats.openRate}%</div>
              <div className="text-xs text-muted-foreground">Open Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{campaign.emailStats.replyRate}%</div>
              <div className="text-xs text-muted-foreground">Reply Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{campaign.emailStats.bounceRate}%</div>
              <div className="text-xs text-muted-foreground">Bounce Rate</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
