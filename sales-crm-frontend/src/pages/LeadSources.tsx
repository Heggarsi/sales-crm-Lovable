import { useState } from "react";
import { ListFilter, Plus, Search, MoreHorizontal, Globe, Phone, Users, Mail, Edit, Trash2, Eye } from "lucide-react";
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

interface LeadSource {
  id: number;
  sourceName: string;
  description: string;
  isActive: boolean;
  sourceType: string;
  leads: number;
  conversion: string;
}

const dummySources: LeadSource[] = [
  { id: 1, sourceName: "Website", description: "Website inquiries", isActive: true, sourceType: "Online", leads: 456, conversion: "32%" },
  { id: 2, sourceName: "Cold Call", description: "Outbound cold calls", isActive: true, sourceType: "Offline", leads: 234, conversion: "18%" },
  { id: 3, sourceName: "Referral", description: "Customer referrals", isActive: true, sourceType: "Partner", leads: 189, conversion: "45%" },
  { id: 4, sourceName: "Email Campaign", description: "Email marketing campaigns", isActive: true, sourceType: "Online", leads: 312, conversion: "22%" },
  { id: 5, sourceName: "Trade Show", description: "Industry trade shows", isActive: false, sourceType: "Offline", leads: 78, conversion: "28%" },
];

const sourceTypes = ["Online", "Offline", "Partner", "Direct", "Inbound", "Outbound"];

export default function LeadSources() {
  const [data, setData] = useState<LeadSource[]>(dummySources);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadSource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (item: LeadSource) => { setSelectedItem(item); setIsViewOpen(true); };
  const handleEdit = (item: LeadSource) => { setSelectedItem(item); setIsEditOpen(true); };
  const handleDelete = (item: LeadSource) => { setSelectedItem(item); setIsDeleteOpen(true); };
  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item, readOnly = false }: { item?: LeadSource; readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Source Name</Label>
        <Input defaultValue={item?.sourceName} placeholder="Enter source name" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea defaultValue={item?.description} placeholder="Enter description" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Source Type</Label>
        {readOnly ? (
          <Input defaultValue={item?.sourceType} readOnly className="bg-muted" />
        ) : (
          <Select defaultValue={item?.sourceType}>
            <SelectTrigger><SelectValue placeholder="Select source type" /></SelectTrigger>
            <SelectContent>
              {sourceTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
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
              <ListFilter className="w-7 h-7 text-primary" />
              Lead Sources
            </h1>
            <p className="text-muted-foreground">Manage where your leads come from</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search sources..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.sourceName}</TableCell>
                  <TableCell className="text-muted-foreground">{source.description}</TableCell>
                  <TableCell><Badge variant="secondary">{source.sourceType}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={source.isActive ? "default" : "outline"}
                           className={source.isActive ? "bg-success text-success-foreground" : ""}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(source)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(source)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(source)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Add Lead Source" saveLabel="Create" onSave={() => setIsCreateOpen(false)}>
        <FormFields />
      </CrudDialog>
      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Lead Source" mode="view">
        <FormFields item={selectedItem || undefined} readOnly />
      </CrudDialog>
      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Lead Source" saveLabel="Save Changes" mode="edit" onSave={() => setIsEditOpen(false)}>
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>
      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
    </AppLayout>
  );
}
