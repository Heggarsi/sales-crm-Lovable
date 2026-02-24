import { useState } from "react";
import { MessageSquare, Plus, Search, Filter, Calendar, Users, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

interface MOMRecord {
  id: number;
  appointmentId: string;
  leadId: string;
  meetingDate: string;
  attendees: string;
  discussionPoints: string;
  decisions: string;
  actionItems: string;
  nextSteps: string;
  followUpDate: string;
  clientFeedback: string;
  internalNotes: string;
  status: string;
  sharedWithClient: boolean;
  meetingTitle: string;
}

const dummyMOMs: MOMRecord[] = [
  { id: 1, appointmentId: "APT-001", leadId: "LD-001", meetingDate: "2024-01-15", attendees: "John Smith, Bob Wilson (Client)", discussionPoints: "Discussed pricing options, enterprise plan features", decisions: "Client to proceed with enterprise plan", actionItems: "Send revised quote by Friday", nextSteps: "Schedule contract review", followUpDate: "2024-01-22", clientFeedback: "Positive", internalNotes: "High priority client", status: "Pending Follow-up", sharedWithClient: false, meetingTitle: "Product Demo - Acme Corp" },
  { id: 2, appointmentId: "APT-002", leadId: "LD-002", meetingDate: "2024-01-14", attendees: "Sarah Johnson, Alice Brown (Client), Tech Lead", discussionPoints: "Identified key pain points, technical requirements", decisions: "Budget discussion postponed", actionItems: "Prepare technical proposal", nextSteps: "Technical deep-dive session", followUpDate: "2024-01-20", clientFeedback: "Interested", internalNotes: "", status: "Completed", sharedWithClient: true, meetingTitle: "Discovery Call - TechStart" },
  { id: 3, appointmentId: "APT-003", leadId: "LD-003", meetingDate: "2024-01-13", attendees: "Mike Wilson, Legal Team, CFO (Client)", discussionPoints: "Payment terms, SLA requirements", decisions: "Payment terms agreed at Net 30", actionItems: "Legal to finalize contract", nextSteps: "Signing ceremony", followUpDate: "2024-01-18", clientFeedback: "Ready to sign", internalNotes: "Fast-track this deal", status: "In Progress", sharedWithClient: false, meetingTitle: "Contract Negotiation - Global Retail" },
];

const momStatuses = ["Draft", "In Progress", "Pending Follow-up", "Completed"];

export default function MOM() {
  const [data, setData] = useState<MOMRecord[]>(dummyMOMs);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MOMRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (item: MOMRecord) => { setSelectedItem(item); setIsViewOpen(true); };
  const handleEdit = (item: MOMRecord) => { setSelectedItem(item); setIsEditOpen(true); };
  const handleDelete = (item: MOMRecord) => { setSelectedItem(item); setIsDeleteOpen(true); };
  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item, readOnly = false }: { item?: MOMRecord; readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Appointment ID</Label>
          <Input defaultValue={item?.appointmentId} placeholder="Enter appointment ID" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Lead ID</Label>
          <Input defaultValue={item?.leadId} placeholder="Enter lead ID" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Meeting Date</Label>
          <Input type="date" defaultValue={item?.meetingDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Follow-Up Date</Label>
          <Input type="date" defaultValue={item?.followUpDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Attendees</Label>
        <Textarea defaultValue={item?.attendees} placeholder="Enter attendees (comma-separated)" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Discussion Points</Label>
        <Textarea defaultValue={item?.discussionPoints} placeholder="Enter discussion points" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Decisions</Label>
        <Textarea defaultValue={item?.decisions} placeholder="Enter decisions made" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Action Items</Label>
        <Textarea defaultValue={item?.actionItems} placeholder="Enter action items" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Next Steps</Label>
        <Textarea defaultValue={item?.nextSteps} placeholder="Enter next steps" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Client Feedback</Label>
        <Textarea defaultValue={item?.clientFeedback} placeholder="Enter client feedback" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Internal Notes</Label>
        <Textarea defaultValue={item?.internalNotes} placeholder="Enter internal notes" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Attachments</Label>
        <Input type="file" multiple disabled={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          {readOnly ? (
            <Input defaultValue={item?.status} readOnly className="bg-muted" />
          ) : (
            <Select defaultValue={item?.status}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {momStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Label>Shared with Client</Label>
          <Switch defaultChecked={item?.sharedWithClient ?? false} disabled={readOnly} />
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-primary" />
              Minutes of Meeting
            </h1>
            <p className="text-muted-foreground">Record and track meeting notes and follow-ups</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New MOM
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total MOMs</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">156</div><p className="text-xs text-muted-foreground">All time</p></CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-warning">12</div><p className="text-xs text-muted-foreground">Action required</p></CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Week</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">8</div><p className="text-xs text-muted-foreground">Meetings recorded</p></CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search meetings..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="space-y-4">
          {filteredData.map((mom) => (
            <Card key={mom.id} className="card-elevated">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{mom.meetingTitle}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{mom.meetingDate}</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" />{mom.attendees.split(",").length} attendees</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mom.status === "Completed" ? "default" : mom.status === "Pending Follow-up" ? "secondary" : "outline"}
                           className={mom.status === "Completed" ? "bg-success text-success-foreground" : ""}>
                      {mom.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(mom)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(mom)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(mom)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Discussion Points:</h4>
                    <p className="text-sm text-muted-foreground">{mom.discussionPoints}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Follow-up: </span>
                      <span className="font-medium">{mom.followUpDate}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create Minutes of Meeting" saveLabel="Create" onSave={() => setIsCreateOpen(false)}>
        <FormFields />
      </CrudDialog>
      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Minutes of Meeting" mode="view">
        <FormFields item={selectedItem || undefined} readOnly />
      </CrudDialog>
      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Minutes of Meeting" saveLabel="Save Changes" mode="edit" onSave={() => setIsEditOpen(false)}>
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>
      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
    </AppLayout>
  );
}
