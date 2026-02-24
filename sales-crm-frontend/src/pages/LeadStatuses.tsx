import { useState } from "react";
import { CheckSquare, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface LeadStatus {
  id: number;
  statusName: string;
  description: string;
}

const dummyData: LeadStatus[] = [
  { id: 1, statusName: "New", description: "Freshly added lead, not yet contacted" },
  { id: 2, statusName: "Contacted", description: "Initial contact has been made" },
  { id: 3, statusName: "Qualified", description: "Lead has been qualified for opportunity" },
  { id: 4, statusName: "Converted", description: "Lead has been converted to customer" },
  { id: 5, statusName: "Lost", description: "Lead has been lost or disqualified" },
];

export default function LeadStatuses() {
  const [data, setData] = useState<LeadStatus[]>(dummyData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.statusName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item: LeadStatus) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = (item: LeadStatus) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item }: { item?: LeadStatus }) => (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Status Name</Label>
        <Input defaultValue={item?.statusName} placeholder="Enter status name" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea defaultValue={item?.description} placeholder="Enter description" />
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <CheckSquare className="w-7 h-7 text-primary" />
              Lead Statuses
            </h1>
            <p className="text-muted-foreground">Manage lead status options</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search statuses..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="secondary">{item.statusName}</Badge>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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

      <CrudDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add Lead Status"
        description="Create a new lead status"
        saveLabel="Create"
        onSave={() => setIsCreateOpen(false)}
      >
        <FormFields />
      </CrudDialog>

      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Lead Status"
        saveLabel="Save Changes"
        mode="edit"
        onSave={() => setIsEditOpen(false)}
      >
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  );
}
