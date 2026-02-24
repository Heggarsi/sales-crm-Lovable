import { useState } from "react";
import { Calendar as CalendarIcon, Plus, Search, Filter, Clock, MapPin, Users, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

interface Appointment {
  id: number;
  title: string;
  leadId: string;
  meetingDate: string;
  duration: string;
  mode: string;
  location: string;
  agenda: string;
  attendeesList: string;
  appointmentStatusId: string;
}

const dummyAppointments: Appointment[] = [
  { id: 1, title: "Product Demo - Acme Corp", leadId: "LD-001", meetingDate: "2024-01-18T10:00", duration: "60", mode: "Online", location: "Zoom", agenda: "Product walkthrough and Q&A", attendeesList: "John Smith, Bob Wilson", appointmentStatusId: "Scheduled" },
  { id: 2, title: "Discovery Call - TechStart", leadId: "LD-002", meetingDate: "2024-01-18T14:00", duration: "30", mode: "Online", location: "Google Meet", agenda: "Initial requirements gathering", attendeesList: "Sarah Johnson, Alice Brown", appointmentStatusId: "Scheduled" },
  { id: 3, title: "Contract Review - Global Retail", leadId: "LD-003", meetingDate: "2024-01-18T16:30", duration: "45", mode: "In-Person", location: "Office - Room 3A", agenda: "Contract terms review", attendeesList: "Mike Wilson, Legal Team", appointmentStatusId: "Scheduled" },
];

const appointmentStatuses = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];
const modes = ["Online", "In-Person", "Phone"];

export default function Appointments() {
  const [data, setData] = useState<Appointment[]>(dummyAppointments);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (item: Appointment) => { setSelectedItem(item); setIsViewOpen(true); };
  const handleEdit = (item: Appointment) => { setSelectedItem(item); setIsEditOpen(true); };
  const handleDelete = (item: Appointment) => { setSelectedItem(item); setIsDeleteOpen(true); };
  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item, readOnly = false }: { item?: Appointment; readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input defaultValue={item?.title} placeholder="Enter appointment title" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Lead ID</Label>
          <Input defaultValue={item?.leadId} placeholder="Enter lead ID" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Meeting Date & Time</Label>
          <Input type="datetime-local" defaultValue={item?.meetingDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input type="number" defaultValue={item?.duration} placeholder="30" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          {readOnly ? (
            <Input defaultValue={item?.mode} readOnly className="bg-muted" />
          ) : (
            <Select defaultValue={item?.mode}>
              <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
              <SelectContent>
                {modes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input defaultValue={item?.location} placeholder="Enter location" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Agenda</Label>
        <Textarea defaultValue={item?.agenda} placeholder="Enter meeting agenda" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Attendees List</Label>
        <Textarea defaultValue={item?.attendeesList} placeholder="Enter attendees (comma-separated)" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Appointment Status</Label>
        {readOnly ? (
          <Input defaultValue={item?.appointmentStatusId} readOnly className="bg-muted" />
        ) : (
          <Select defaultValue={item?.appointmentStatusId}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {appointmentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <CalendarIcon className="w-7 h-7 text-primary" />
              Appointments
            </h1>
            <p className="text-muted-foreground">Manage your meetings and schedules</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Today</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">3</div><p className="text-xs text-muted-foreground">appointments</p></CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Week</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">12</div><p className="text-xs text-muted-foreground">scheduled</p></CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">45</div><p className="text-xs text-muted-foreground">this month</p></CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cancelled</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">2</div><p className="text-xs text-muted-foreground">this month</p></CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search appointments..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          {filteredData.map((apt) => (
            <Card key={apt.id} className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{apt.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{apt.duration} min</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{apt.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {apt.attendeesList}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-info text-info-foreground">{apt.appointmentStatusId}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(apt)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(apt)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(apt)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Schedule Appointment" saveLabel="Create" onSave={() => setIsCreateOpen(false)}>
        <FormFields />
      </CrudDialog>
      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Appointment" mode="view">
        <FormFields item={selectedItem || undefined} readOnly />
      </CrudDialog>
      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Appointment" saveLabel="Save Changes" mode="edit" onSave={() => setIsEditOpen(false)}>
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>
      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
    </AppLayout>
  );
}
