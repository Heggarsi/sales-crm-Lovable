import { useState } from "react";
import { Link2, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";

interface ProposalAppointment {
  id: number;
  proposalId: number;
  proposalNumber: string;
  proposalTitle: string;
  appointmentId: number;
  appointmentNumber: string;
  appointmentTitle: string;
  meetingDate: string;
  createdAt: string;
}

const dummyData: ProposalAppointment[] = [
  { id: 1, proposalId: 1, proposalNumber: "PROP-001", proposalTitle: "Cloud Migration Proposal", appointmentId: 1, appointmentNumber: "APT-001", appointmentTitle: "Initial Discussion", meetingDate: "2024-01-20", createdAt: "2024-01-15" },
  { id: 2, proposalId: 1, proposalNumber: "PROP-001", proposalTitle: "Cloud Migration Proposal", appointmentId: 2, appointmentNumber: "APT-002", appointmentTitle: "Technical Review", meetingDate: "2024-01-25", createdAt: "2024-01-15" },
  { id: 3, proposalId: 2, proposalNumber: "PROP-002", proposalTitle: "CRM Implementation", appointmentId: 3, appointmentNumber: "APT-003", appointmentTitle: "Demo Session", meetingDate: "2024-01-22", createdAt: "2024-01-14" },
  { id: 4, proposalId: 3, proposalNumber: "PROP-003", proposalTitle: "ERP Upgrade", appointmentId: 4, appointmentNumber: "APT-004", appointmentTitle: "Stakeholder Meeting", meetingDate: "2024-01-28", createdAt: "2024-01-13" },
];

export default function ProposalAppointments() {
  const [data, setData] = useState<ProposalAppointment[]>(dummyData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProposalAppointment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.appointmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item: ProposalAppointment) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = (item: ProposalAppointment) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleView = (item: ProposalAppointment) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item }: { item?: ProposalAppointment }) => (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Proposal</Label>
        <Select defaultValue={item?.proposalId.toString()}>
          <SelectTrigger>
            <SelectValue placeholder="Select proposal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">PROP-001 - Cloud Migration Proposal</SelectItem>
            <SelectItem value="2">PROP-002 - CRM Implementation</SelectItem>
            <SelectItem value="3">PROP-003 - ERP Upgrade</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Appointment</Label>
        <Select defaultValue={item?.appointmentId.toString()}>
          <SelectTrigger>
            <SelectValue placeholder="Select appointment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">APT-001 - Initial Discussion (Jan 20, 2024)</SelectItem>
            <SelectItem value="2">APT-002 - Technical Review (Jan 25, 2024)</SelectItem>
            <SelectItem value="3">APT-003 - Demo Session (Jan 22, 2024)</SelectItem>
            <SelectItem value="4">APT-004 - Stakeholder Meeting (Jan 28, 2024)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Link2 className="w-7 h-7 text-primary" />
              Proposal Appointments
            </h1>
            <p className="text-muted-foreground">Link proposals to their related appointments</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Link Proposal to Appointment
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by proposal or appointment..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal</TableHead>
                <TableHead>Proposal Title</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Appointment Title</TableHead>
                <TableHead>Meeting Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="outline">{item.proposalNumber}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.proposalTitle}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.appointmentNumber}</Badge>
                  </TableCell>
                  <TableCell>{item.appointmentTitle}</TableCell>
                  <TableCell>{item.meetingDate}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(item)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <CrudDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Link Proposal to Appointment"
        description="Create a link between a proposal and an appointment"
        saveLabel="Create Link"
        onSave={() => setIsCreateOpen(false)}
      >
        <FormFields />
      </CrudDialog>

      {/* Edit Dialog */}
      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Proposal-Appointment Link"
        description="Update the link details"
        saveLabel="Save Changes"
        mode="edit"
        onSave={() => setIsEditOpen(false)}
      >
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>

      {/* View Dialog */}
      <CrudDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        title="Proposal-Appointment Details"
        mode="view"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Proposal:</strong> {selectedItem.proposalNumber}</div>
              <div><strong>Appointment:</strong> {selectedItem.appointmentNumber}</div>
            </div>
            <div><strong>Proposal Title:</strong> {selectedItem.proposalTitle}</div>
            <div><strong>Appointment Title:</strong> {selectedItem.appointmentTitle}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Meeting Date:</strong> {selectedItem.meetingDate}</div>
              <div><strong>Created At:</strong> {selectedItem.createdAt}</div>
            </div>
          </div>
        )}
      </CrudDialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This will remove the link between the proposal and appointment."
      />
    </AppLayout>
  );
}
