import { useState, useEffect, useCallback } from "react";
import { Activity, Search, Filter, Phone, Mail, MessageSquare, Calendar, FileText, Users, Loader2, Clock, MapPin, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface ActivityRecord {
  ActivityId: number;
  AppointmentId: number;  // Changed from LeadId
  Subject: string;
  Description: string;
  Direction: string;
  Duration: number | string;
  Outcome: string;
  ActivityDate: string;
  ScheduledFollowUp: string;
  Attachments: any;
  CreatedByUserId: number;
  IsDeleted: number;
  CreatedAt: string;
  UpdatedAt: string;
  ActivityTypeId: number;
  ActivityTypeName: string;
  AppointmentNumber?: string;  // Added for appointment reference
  FirstName?: string;
  LastName?: string;
  CompanyName?: string;
  CreatedByName: string;
}

// Updated interface for Appointment
interface Appointment {
  AppointmentId: number;
  AppointmentNumber: string;
  FirstName: string;
  LastName: string;
  CompanyName: string;
  Email?: string;
  Phone?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getTypeIcon = (typeName: string) => {
  const name = typeName.toLowerCase();
  if (name.includes("call")) return Phone;
  if (name.includes("email")) return Mail;
  if (name.includes("meeting")) return Calendar;
  if (name.includes("note")) return MessageSquare;
  if (name.includes("demo") || name.includes("proposal")) return FileText;
  return Activity;
};

const getTypeColor = (typeName: string) => {
  const name = typeName.toLowerCase();
  if (name.includes("call")) return "bg-blue-500";
  if (name.includes("email")) return "bg-emerald-500";
  if (name.includes("meeting")) return "bg-purple-500";
  if (name.includes("note")) return "bg-amber-500";
  if (name.includes("demo") || name.includes("proposal")) return "bg-indigo-500";
  return "bg-slate-500";
};

export default function ActivityLog() {
  const [data, setData] = useState<ActivityRecord[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]); // Changed from leads
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ActivityRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const { toast } = useToast();

  const openView = (item: ActivityRecord) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const [formData, setFormData] = useState<Partial<ActivityRecord>>({
    AppointmentId: 0,  // Changed from LeadId
    ActivityTypeId: 0,
    Subject: "",
    Description: "",
    Direction: "Outbound",
    Duration: "",
    Outcome: "",
    ActivityDate: new Date().toISOString().split('T')[0],
    ScheduledFollowUp: ""
  });

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [actRes, typesRes, appointmentsRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/activities?page=${currentPage}&limit=10`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/activities/types`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/appointments`, { headers: getAuthHeaders() }) // Changed endpoint
      ]);

      if (!actRes.ok) throw new Error("Failed to fetch activities");

      const actData = await actRes.json();
      const typesData = await typesRes.json();
      const appointmentsData = await appointmentsRes.json();

      setData(actData.data || actData.activities || []);
      if (actData.pagination) {
        setTotalPages(actData.pagination.totalPages);
      } else if (actData.total) {
        setTotalPages(Math.ceil(actData.total / 10));
      }
      setActivityTypes(typesData.data || []);
      setAppointments(appointmentsData.data || appointmentsData.appointments || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item =>
    item.Subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.CompanyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.FirstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.LastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ActivityTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.AppointmentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      if (!formData.AppointmentId || !formData.ActivityTypeId || !formData.Subject) {
        throw new Error("Subject, Appointment and Activity Type are required");
      }

      const res = await fetch(`${BACKEND_BASE_URL}/api/activities`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          AppointmentId: Number(formData.AppointmentId), // Changed from LeadId
          ActivityTypeId: Number(formData.ActivityTypeId)
        }),
      });
      if (!res.ok) throw new Error("Failed to log activity");
      toast({ title: "Success", description: "Activity logged successfully" });
      fetchData();
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      AppointmentId: 0, // Changed from LeadId
      ActivityTypeId: 0,
      Subject: "",
      Description: "",
      Direction: "Outbound",
      Duration: "",
      Outcome: "",
      ActivityDate: new Date().toISOString().split('T')[0],
      ScheduledFollowUp: ""
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  // Helper to get appointment display text
  const getAppointmentDisplay = (appointment: Appointment) => {
    return `${appointment.AppointmentNumber} - ${appointment.CompanyName} (${appointment.FirstName} ${appointment.LastName})`;
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary" />
              Activity Log
            </h1>
            <p className="text-muted-foreground">Track all sales activities and interactions</p>
          </div>
          <Button className="gradient-primary h-10" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Activity className="w-4 h-4 mr-2" />
            Log Activity
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, company or appointment..."
              className="pl-10 h-11 border-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 px-6">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {isRefreshing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Loading activities...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-muted">
              <Activity className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground italic">No activities recorded yet.</p>
            </div>
          ) : (
            filteredData.map((activity) => {
              const Icon = getTypeIcon(activity.ActivityTypeName);
              return (
                <Card key={activity.ActivityId} className="card-elevated group border-none hover:shadow-premium transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-5">
                      <div className={`w-12 h-12 rounded-2xl ${getTypeColor(activity.ActivityTypeName)} flex items-center justify-center text-white shadow-lg shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg leading-tight">{activity.Subject}</h3>
                              <Badge variant="outline" className="text-[10px] font-bold uppercase h-5">{activity.Direction}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{activity.Description}</p>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3">
                              <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-bold text-[10px] uppercase h-6 px-2">
                                {activity.CompanyName}
                              </Badge>
                              {activity.AppointmentNumber && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold text-[10px] uppercase h-6 px-2">
                                  #{activity.AppointmentNumber}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />
                                <span>by <strong className="text-foreground">{activity.CreatedByName}</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{activity.Duration} mins</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-2">
                            <div className="text-xs font-bold text-muted-foreground">{getTimeAgo(activity.ActivityDate)}</div>
                            <div className="flex items-center justify-end gap-2">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold h-6">{activity.Outcome}</Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:bg-blue-50 ml-2" onClick={() => openView(activity)} title="View Details">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Log Activity" saveLabel="Log Activity" onSave={handleCreate}>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              value={formData.Subject}
              onChange={(e) => setFormData({ ...formData, Subject: e.target.value })}
              placeholder="e.g. Follow-up call"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Appointment *</Label> {/* Changed from Lead to Appointment */}
              <Select
                value={formData.AppointmentId?.toString()}
                onValueChange={(val) => setFormData({ ...formData, AppointmentId: parseInt(val) })}
              >
                <SelectTrigger><SelectValue placeholder="Select appointment" /></SelectTrigger>
                <SelectContent>
                  {appointments.map(a => (
                    <SelectItem key={a.AppointmentId} value={a.AppointmentId.toString()}>
                      {getAppointmentDisplay(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activity Type *</Label>
              <Select
                value={formData.ActivityTypeId?.toString()}
                onValueChange={(val) => setFormData({ ...formData, ActivityTypeId: parseInt(val) })}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {activityTypes.map(t => (
                    <SelectItem key={t.ActivityTypeId} value={t.ActivityTypeId.toString()}>
                      {t.TypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={formData.Direction}
                onValueChange={(val) => setFormData({ ...formData, Direction: val })}
              >
                <SelectTrigger><SelectValue placeholder="Direction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inbound">Inbound</SelectItem>
                  <SelectItem value="Outbound">Outbound</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (mins)</Label>
              <Input
                type="number"
                value={formData.Duration}
                onChange={(e) => setFormData({ ...formData, Duration: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Input
                value={formData.Outcome}
                onChange={(e) => setFormData({ ...formData, Outcome: e.target.value })}
                placeholder="e.g. Interested, Call back"
              />
            </div>
            <div className="space-y-2">
              <Label>Activity Date</Label>
              <Input
                type="date"
                value={formData.ActivityDate}
                onChange={(e) => setFormData({ ...formData, ActivityDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.Description}
              onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
              placeholder="Details about the activity..."
              className="h-24"
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled Follow-up</Label>
            <Input
              type="date"
              value={formData.ScheduledFollowUp}
              onChange={(e) => setFormData({ ...formData, ScheduledFollowUp: e.target.value })}
            />
          </div>
        </div>
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="Activity Details" mode="view">
        {selectedItem && (
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4 pb-4 border-b">
              <div className={`w-14 h-14 rounded-2xl ${getTypeColor(selectedItem.ActivityTypeName)} flex items-center justify-center text-white shadow-lg shrink-0`}>
                {(() => {
                  const Icon = getTypeIcon(selectedItem.ActivityTypeName);
                  return <Icon className="w-7 h-7" />;
                })()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedItem.Subject}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">{selectedItem.Direction}</Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">{selectedItem.Outcome}</Badge>
                  <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-full">{selectedItem.ActivityTypeName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-8 pb-4 border-b">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Appointment Context</span> {/* Changed from Lead */}
                <p className="text-sm font-semibold">{selectedItem.CompanyName}</p>
                <p className="text-xs text-slate-500">{selectedItem.FirstName} {selectedItem.LastName}</p>
                {selectedItem.AppointmentNumber && (
                  <p className="text-xs text-slate-500 font-mono mt-1">Appointment #{selectedItem.AppointmentNumber}</p>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Timing & Follow-up</span>
                <p className="text-sm"><strong>Date:</strong> {selectedItem.ActivityDate ? new Date(selectedItem.ActivityDate).toLocaleDateString() : 'N/A'}</p>
                <p className="text-sm"><strong>Duration:</strong> {selectedItem.Duration || 0} mins</p>
                {selectedItem.ScheduledFollowUp && (
                  <p className="text-sm text-amber-600 font-medium"><strong>Follow-up:</strong> {new Date(selectedItem.ScheduledFollowUp).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="pb-4 border-b">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Description</span>
              <div className="bg-muted/30 p-4 rounded-xl border border-muted/50 text-sm whitespace-pre-wrap text-slate-700 min-h-[80px]">
                {selectedItem.Description || <span className="italic text-slate-400">No description provided.</span>}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Raw Metadata</span>
              <div className="bg-muted/50 rounded-xl text-sm border border-muted w-full min-w-0 overflow-hidden">
                <div className="p-4 space-y-1">
                  <div className="grid grid-cols-[150px_1fr] gap-4">
                    <span className="font-semibold text-slate-600">Activity ID:</span>
                    <span>{selectedItem.ActivityId}</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-4">
                    <span className="font-semibold text-slate-600">Appointment ID:</span> {/* Changed from Lead */}
                    <span>{selectedItem.AppointmentId}</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-4">
                    <span className="font-semibold text-slate-600">Created By:</span>
                    <span>{selectedItem.CreatedByName} (ID: {selectedItem.CreatedByUserId})</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-4">
                    <span className="font-semibold text-slate-600">Created At:</span>
                    <span>{selectedItem.CreatedAt ? new Date(selectedItem.CreatedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  {selectedItem.UpdatedAt && (
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <span className="font-semibold text-slate-600">Updated At:</span>
                      <span>{new Date(selectedItem.UpdatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CrudDialog>
    </SettingsLayout>
  );
}