import { useState } from "react";
import { Briefcase, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface LeadBusinessInfo {
  id: number;
  leadId: number;
  leadName: string;
  budget: number;
  budgetCurrency: string;
  budgetRange: string;
  timeline: string;
  authority: string;
  needSummary: string;
  competition: string;
  currentSolution: string;
  keyStakeholders: string;
  capturedBy: string;
  capturedAt: string;
}

const dummyData: LeadBusinessInfo[] = [
  { id: 1, leadId: 1, leadName: "Acme Corp", budget: 50000, budgetCurrency: "USD", budgetRange: "50k-100k", timeline: "Q1 2024", authority: "CTO", needSummary: "Cloud migration solution", competition: "AWS, Azure", currentSolution: "On-premise servers", keyStakeholders: "CTO, CFO, IT Manager", capturedBy: "John Smith", capturedAt: "2024-01-15" },
  { id: 2, leadId: 2, leadName: "TechStart Inc", budget: 25000, budgetCurrency: "USD", budgetRange: "25k-50k", timeline: "Q2 2024", authority: "CEO", needSummary: "CRM implementation", competition: "Salesforce, HubSpot", currentSolution: "Excel spreadsheets", keyStakeholders: "CEO, Sales Head", capturedBy: "Sarah Johnson", capturedAt: "2024-01-14" },
  { id: 3, leadId: 3, leadName: "Global Retail", budget: 100000, budgetCurrency: "USD", budgetRange: "100k+", timeline: "Q1 2024", authority: "VP IT", needSummary: "ERP system upgrade", competition: "SAP, Oracle", currentSolution: "Legacy ERP", keyStakeholders: "VP IT, CFO, COO", capturedBy: "Mike Wilson", capturedAt: "2024-01-13" },
];

export default function LeadBusinessInfo() {
  const [data, setData] = useState<LeadBusinessInfo[]>(dummyData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadBusinessInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.needSummary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item: LeadBusinessInfo) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = (item: LeadBusinessInfo) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleView = (item: LeadBusinessInfo) => {
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

  const FormFields = ({ item }: { item?: LeadBusinessInfo }) => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lead</Label>
          <Select defaultValue={item?.leadId.toString()}>
            <SelectTrigger>
              <SelectValue placeholder="Select lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Acme Corp</SelectItem>
              <SelectItem value="2">TechStart Inc</SelectItem>
              <SelectItem value="3">Global Retail</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Budget Range</Label>
          <Select defaultValue={item?.budgetRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-25k">$0 - $25k</SelectItem>
              <SelectItem value="25k-50k">$25k - $50k</SelectItem>
              <SelectItem value="50k-100k">$50k - $100k</SelectItem>
              <SelectItem value="100k+">$100k+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Budget Amount</Label>
          <Input type="number" defaultValue={item?.budget} placeholder="50000" />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select defaultValue={item?.budgetCurrency || "USD"}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="INR">INR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Timeline</Label>
          <Input defaultValue={item?.timeline} placeholder="Q1 2024" />
        </div>
        <div className="space-y-2">
          <Label>Authority / Decision Maker</Label>
          <Input defaultValue={item?.authority} placeholder="CTO" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Need Summary</Label>
        <Textarea defaultValue={item?.needSummary} placeholder="Describe the customer's needs..." />
      </div>
      <div className="space-y-2">
        <Label>Competition</Label>
        <Input defaultValue={item?.competition} placeholder="Competitors in consideration" />
      </div>
      <div className="space-y-2">
        <Label>Current Solution</Label>
        <Input defaultValue={item?.currentSolution} placeholder="What are they using now?" />
      </div>
      <div className="space-y-2">
        <Label>Key Stakeholders</Label>
        <Input defaultValue={item?.keyStakeholders} placeholder="CTO, CFO, IT Manager" />
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-primary" />
              Lead Business Info
            </h1>
            <p className="text-muted-foreground">Capture detailed business information for leads</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Business Info
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by lead or need..." 
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
                <TableHead>Lead</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Need Summary</TableHead>
                <TableHead>Captured By</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.leadName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {item.budgetCurrency} {item.budget.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.timeline}</TableCell>
                  <TableCell>{item.authority}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.needSummary}</TableCell>
                  <TableCell>{item.capturedBy}</TableCell>
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
        title="Add Lead Business Info"
        description="Capture business details for a lead"
        saveLabel="Create"
        onSave={() => setIsCreateOpen(false)}
      >
        <FormFields />
      </CrudDialog>

      {/* Edit Dialog */}
      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Lead Business Info"
        description="Update business details"
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
        title="Lead Business Info Details"
        mode="view"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Lead:</strong> {selectedItem.leadName}</div>
              <div><strong>Budget:</strong> {selectedItem.budgetCurrency} {selectedItem.budget.toLocaleString()}</div>
              <div><strong>Range:</strong> {selectedItem.budgetRange}</div>
              <div><strong>Timeline:</strong> {selectedItem.timeline}</div>
              <div><strong>Authority:</strong> {selectedItem.authority}</div>
              <div><strong>Captured By:</strong> {selectedItem.capturedBy}</div>
            </div>
            <div><strong>Need Summary:</strong> {selectedItem.needSummary}</div>
            <div><strong>Competition:</strong> {selectedItem.competition}</div>
            <div><strong>Current Solution:</strong> {selectedItem.currentSolution}</div>
            <div><strong>Key Stakeholders:</strong> {selectedItem.keyStakeholders}</div>
          </div>
        )}
      </CrudDialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        description="This will permanently delete the business info record for this lead."
      />
    </AppLayout>
  );
}
