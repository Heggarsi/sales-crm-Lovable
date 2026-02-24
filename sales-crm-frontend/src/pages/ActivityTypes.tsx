import { useState } from "react";
import { Activity, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ActivityType {
  id: number;
  typeName: string;
}

const dummyData: ActivityType[] = [
  { id: 1, typeName: "Phone Call" },
  { id: 2, typeName: "Email" },
  { id: 3, typeName: "Meeting" },
  { id: 4, typeName: "WhatsApp" },
  { id: 5, typeName: "Video Call" },
  { id: 6, typeName: "Site Visit" },
  { id: 7, typeName: "Note" },
];

export default function ActivityTypes() {
  const [data, setData] = useState<ActivityType[]>(dummyData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ActivityType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.typeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item: ActivityType) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = (item: ActivityType) => {
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

  const FormFields = ({ item }: { item?: ActivityType }) => (
    <div className="space-y-2">
      <Label>Type Name</Label>
      <Input defaultValue={item?.typeName} placeholder="Enter activity type name" />
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary" />
              Activity Types
            </h1>
            <p className="text-muted-foreground">Manage activity type options</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search types..." 
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
                <TableHead>Type Name</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="secondary">{item.typeName}</Badge>
                  </TableCell>
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
        title="Add Activity Type"
        saveLabel="Create"
        onSave={() => setIsCreateOpen(false)}
      >
        <FormFields />
      </CrudDialog>

      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Activity Type"
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
