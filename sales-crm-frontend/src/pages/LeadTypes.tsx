import { useState } from "react";
import { Target, Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface LeadType {
  id: number;
  typeName: string;
  description: string;
  priority: string;
  isActive: boolean;
}

const dummyTypes: LeadType[] = [
  { id: 1, typeName: "Enterprise", description: "Large corporations with 500+ employees", priority: "High", isActive: true },
  { id: 2, typeName: "SMB", description: "Small to medium businesses", priority: "Medium", isActive: true },
  { id: 3, typeName: "Startup", description: "Early-stage companies", priority: "Medium", isActive: true },
  { id: 4, typeName: "Government", description: "Government and public sector", priority: "High", isActive: true },
  { id: 5, typeName: "Non-Profit", description: "Non-profit organizations", priority: "Low", isActive: false },
];

export default function LeadTypes() {
  const [data, setData] = useState<LeadType[]>(dummyTypes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.typeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (item: LeadType) => { setSelectedItem(item); setIsViewOpen(true); };
  const handleEdit = (item: LeadType) => { setSelectedItem(item); setIsEditOpen(true); };
  const handleDelete = (item: LeadType) => { setSelectedItem(item); setIsDeleteOpen(true); };
  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item, readOnly = false }: { item?: LeadType; readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type Name</Label>
        <Input defaultValue={item?.typeName} placeholder="Enter type name" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea defaultValue={item?.description} placeholder="Enter description" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        {readOnly ? (
          <Input defaultValue={item?.priority} readOnly className="bg-muted" />
        ) : (
          <Select defaultValue={item?.priority}>
            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Label>Is Active</Label>
        <Switch defaultChecked={item?.isActive ?? true} disabled={readOnly} />
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Target className="w-7 h-7 text-primary" />
              Lead Types
            </h1>
            <p className="text-muted-foreground">Categorize your leads by type</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search types..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.typeName}</TableCell>
                  <TableCell className="text-muted-foreground">{type.description}</TableCell>
                  <TableCell>
                    <Badge variant={type.priority === "High" ? "default" : type.priority === "Medium" ? "secondary" : "outline"}>
                      {type.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? "default" : "outline"} className={type.isActive ? "bg-success text-success-foreground" : ""}>
                      {type.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(type)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(type)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(type)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Add Lead Type" saveLabel="Create" onSave={() => setIsCreateOpen(false)}>
        <FormFields />
      </CrudDialog>
      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Lead Type" mode="view">
        <FormFields item={selectedItem || undefined} readOnly />
      </CrudDialog>
      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Lead Type" saveLabel="Save Changes" mode="edit" onSave={() => setIsEditOpen(false)}>
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>
      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
    </AppLayout>
  );
}
