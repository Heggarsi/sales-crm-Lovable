import { useState } from "react";
import { FileText, Plus, Search, Filter, Download, Eye, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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

interface Proposal {
  id: string;
  proposalTitle: string;
  opportunityId: string;
  proposalAmount: string;
  currency: string;
  versionNo: string;
  parentProposalId: string;
  validityDate: string;
  paymentTerms: string;
  deliveryTerms: string;
  internalNotes: string;
  rejectionReason: string;
  status: string;
  client: string;
}

const dummyProposals: Proposal[] = [
  { id: "PROP-001", proposalTitle: "Enterprise CRM Solution", opportunityId: "OPP-001", proposalAmount: "150000", currency: "USD", versionNo: "2.1", parentProposalId: "", validityDate: "2024-01-30", paymentTerms: "Net 30", deliveryTerms: "6 weeks", internalNotes: "Priority client", rejectionReason: "", status: "Under Review", client: "Acme Corp" },
  { id: "PROP-002", proposalTitle: "Cloud Migration Package", opportunityId: "OPP-002", proposalAmount: "85000", currency: "USD", versionNo: "1.0", parentProposalId: "", validityDate: "2024-02-15", paymentTerms: "Net 45", deliveryTerms: "8 weeks", internalNotes: "", rejectionReason: "", status: "Draft", client: "TechStart" },
  { id: "PROP-003", proposalTitle: "Digital Transformation Suite", opportunityId: "OPP-003", proposalAmount: "250000", currency: "USD", versionNo: "3.0", parentProposalId: "PROP-001", validityDate: "2024-01-25", paymentTerms: "Milestone-based", deliveryTerms: "12 weeks", internalNotes: "Final version", rejectionReason: "", status: "Accepted", client: "Global Retail" },
  { id: "PROP-004", proposalTitle: "Security Upgrade Plan", opportunityId: "OPP-004", proposalAmount: "120000", currency: "USD", versionNo: "1.2", parentProposalId: "", validityDate: "2024-02-01", paymentTerms: "Net 30", deliveryTerms: "4 weeks", internalNotes: "", rejectionReason: "", status: "Submitted", client: "Healthcare Plus" },
  { id: "PROP-005", proposalTitle: "Data Analytics Platform", opportunityId: "OPP-005", proposalAmount: "95000", currency: "USD", versionNo: "2.0", parentProposalId: "", validityDate: "2024-01-20", paymentTerms: "Net 60", deliveryTerms: "10 weeks", internalNotes: "", rejectionReason: "Budget constraints", status: "Rejected", client: "Finance Corp" },
];

const proposalStatuses = ["Draft", "Submitted", "Under Review", "Accepted", "Rejected"];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft": return "bg-muted text-muted-foreground";
    case "Submitted": return "bg-info text-info-foreground";
    case "Under Review": return "bg-warning text-warning-foreground";
    case "Accepted": return "bg-success text-success-foreground";
    case "Rejected": return "bg-destructive text-destructive-foreground";
    default: return "bg-secondary";
  }
};

export default function Proposals() {
  const [data, setData] = useState<Proposal[]>(dummyProposals);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Proposal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (item: Proposal) => { setSelectedItem(item); setIsViewOpen(true); };
  const handleEdit = (item: Proposal) => { setSelectedItem(item); setIsEditOpen(true); };
  const handleDelete = (item: Proposal) => { setSelectedItem(item); setIsDeleteOpen(true); };
  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item, readOnly = false }: { item?: Proposal; readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Proposal Title</Label>
          <Input defaultValue={item?.proposalTitle} placeholder="Enter proposal title" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Opportunity ID</Label>
          <Input defaultValue={item?.opportunityId} placeholder="Enter opportunity ID" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Proposal Amount</Label>
          <Input type="number" defaultValue={item?.proposalAmount} placeholder="0" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          {readOnly ? (
            <Input defaultValue={item?.currency} readOnly className="bg-muted" />
          ) : (
            <Select defaultValue={item?.currency || "USD"}>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>Version No</Label>
          <Input defaultValue={item?.versionNo} placeholder="1.0" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Parent Proposal ID</Label>
          <Input defaultValue={item?.parentProposalId} placeholder="Enter parent proposal ID (optional)" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Validity Date</Label>
          <Input type="date" defaultValue={item?.validityDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Proposal Document</Label>
        <Input type="file" disabled={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Terms</Label>
          <Input defaultValue={item?.paymentTerms} placeholder="e.g., Net 30" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Delivery Terms</Label>
          <Input defaultValue={item?.deliveryTerms} placeholder="e.g., 6 weeks" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Proposal Status</Label>
        {readOnly ? (
          <Input defaultValue={item?.status} readOnly className="bg-muted" />
        ) : (
          <Select defaultValue={item?.status}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {proposalStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        <Label>Internal Notes</Label>
        <Textarea defaultValue={item?.internalNotes} placeholder="Enter internal notes" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      {item?.status === "Rejected" && (
        <div className="space-y-2">
          <Label>Rejection Reason</Label>
          <Textarea defaultValue={item?.rejectionReason} placeholder="Enter rejection reason" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      )}
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <FileText className="w-7 h-7 text-primary" />
              Proposals
            </h1>
            <p className="text-muted-foreground">Create and manage sales proposals</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Proposal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {["Draft", "Submitted", "Under Review", "Accepted", "Rejected"].map((status, i) => (
            <Card key={status} className="card-elevated">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{status}</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${status === "Accepted" ? "text-success" : status === "Rejected" ? "text-destructive" : ""}`}>
                  {[8, 12, 5, 23, 7][i]}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search proposals..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                <TableHead>Proposal ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-mono text-sm">{proposal.id}</TableCell>
                  <TableCell className="font-medium">{proposal.proposalTitle}</TableCell>
                  <TableCell>{proposal.client}</TableCell>
                  <TableCell className="font-semibold">${Number(proposal.proposalAmount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                  </TableCell>
                  <TableCell>v{proposal.versionNo}</TableCell>
                  <TableCell>{proposal.validityDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(proposal)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(proposal)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(proposal)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create Proposal" saveLabel="Create" onSave={() => setIsCreateOpen(false)}>
        <FormFields />
      </CrudDialog>
      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Proposal" mode="view">
        <FormFields item={selectedItem || undefined} readOnly />
      </CrudDialog>
      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Proposal" saveLabel="Save Changes" mode="edit" onSave={() => setIsEditOpen(false)}>
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>
      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
    </AppLayout>
  );
}
