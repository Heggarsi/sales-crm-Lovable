import { useState } from "react";
import { TrendingUp, Plus, Search, Filter, DollarSign, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
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

interface Opportunity {
  id: number;
  opportunityName: string;
  description: string;
  leadId: string;
  estimatedValue: string;
  currency: string;
  probability: number;
  expectedCloseDate: string;
  actualCloseDate: string;
  competitorInfo: string;
  keyDecisionMakers: string;
  stage: string;
  status: string;
  owner: string;
}

const stages = [
  { name: "Identified", count: 12, value: "$240,000", color: "bg-blue-500" },
  { name: "Qualification", count: 8, value: "$180,000", color: "bg-indigo-500" },
  { name: "Proposal", count: 6, value: "$320,000", color: "bg-purple-500" },
  { name: "Negotiation", count: 4, value: "$450,000", color: "bg-amber-500" },
  { name: "Closed-Won", count: 15, value: "$1,200,000", color: "bg-success" },
];

const dummyOpportunities: Opportunity[] = [
  { id: 1, opportunityName: "Enterprise Software Deal", description: "Full suite implementation", leadId: "LD-001", estimatedValue: "150000", currency: "USD", probability: 75, expectedCloseDate: "2024-03-15", actualCloseDate: "", competitorInfo: "Competitor A", keyDecisionMakers: "CTO, VP Engineering", stage: "Proposal", status: "Open", owner: "John Smith" },
  { id: 2, opportunityName: "Cloud Migration Project", description: "AWS migration", leadId: "LD-002", estimatedValue: "85000", currency: "USD", probability: 50, expectedCloseDate: "2024-04-01", actualCloseDate: "", competitorInfo: "", keyDecisionMakers: "CIO", stage: "Qualification", status: "Open", owner: "Sarah Johnson" },
  { id: 3, opportunityName: "Digital Transformation", description: "End-to-end digital overhaul", leadId: "LD-003", estimatedValue: "250000", currency: "USD", probability: 85, expectedCloseDate: "2024-02-28", actualCloseDate: "", competitorInfo: "Competitor B, C", keyDecisionMakers: "CEO, CFO", stage: "Negotiation", status: "Open", owner: "Mike Wilson" },
  { id: 4, opportunityName: "Security Upgrade", description: "SOC2 compliance project", leadId: "LD-004", estimatedValue: "120000", currency: "USD", probability: 30, expectedCloseDate: "2024-05-01", actualCloseDate: "", competitorInfo: "", keyDecisionMakers: "CISO", stage: "Identified", status: "Open", owner: "John Smith" },
];

const opportunityStages = ["Identified", "Qualification", "Proposal", "Negotiation", "Closed-Won", "Closed-Lost"];
const opportunityStatuses = ["Open", "Won", "Lost", "On Hold"];

export default function Opportunities() {
  const [data, setData] = useState<Opportunity[]>(dummyOpportunities);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.opportunityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (item: Opportunity) => { setSelectedItem(item); setIsViewOpen(true); };
  const handleEdit = (item: Opportunity) => { setSelectedItem(item); setIsEditOpen(true); };
  const handleDelete = (item: Opportunity) => { setSelectedItem(item); setIsDeleteOpen(true); };
  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item, readOnly = false }: { item?: Opportunity; readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Opportunity Name</Label>
          <Input defaultValue={item?.opportunityName} placeholder="Enter opportunity name" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Lead ID</Label>
          <Input defaultValue={item?.leadId} placeholder="Enter lead ID" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea defaultValue={item?.description} placeholder="Enter description" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Estimated Value</Label>
          <Input type="number" defaultValue={item?.estimatedValue} placeholder="0" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
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
          <Label>Probability (%)</Label>
          <Input type="number" defaultValue={item?.probability} placeholder="0" min={0} max={100} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Expected Close Date</Label>
          <Input type="date" defaultValue={item?.expectedCloseDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Actual Close Date</Label>
          <Input type="date" defaultValue={item?.actualCloseDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Opportunity Stage</Label>
          {readOnly ? (
            <Input defaultValue={item?.stage} readOnly className="bg-muted" />
          ) : (
            <Select defaultValue={item?.stage}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {opportunityStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>Opportunity Status</Label>
          {readOnly ? (
            <Input defaultValue={item?.status} readOnly className="bg-muted" />
          ) : (
            <Select defaultValue={item?.status}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {opportunityStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Competitor Info</Label>
        <Textarea defaultValue={item?.competitorInfo} placeholder="Enter competitor information" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
      <div className="space-y-2">
        <Label>Key Decision Makers</Label>
        <Textarea defaultValue={item?.keyDecisionMakers} placeholder="Enter key decision makers" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-primary" />
              Opportunities
            </h1>
            <p className="text-muted-foreground">Track and manage your sales pipeline</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Opportunity
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {stages.map((stage) => (
            <Card key={stage.name} className="card-elevated">
              <CardHeader className="pb-2">
                <div className={`w-full h-1 ${stage.color} rounded-full mb-2`} />
                <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stage.count}</div>
                <div className="text-sm text-muted-foreground">{stage.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search opportunities..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredData.map((opp) => (
            <Card key={opp.id} className="card-elevated hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{opp.opportunityName}</h3>
                    <p className="text-sm text-muted-foreground">{opp.description}</p>
                    <p className="text-sm">Owner: {opp.owner}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xl font-bold text-success flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {Number(opp.estimatedValue).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Deal Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{opp.probability}%</div>
                      <div className="text-xs text-muted-foreground">Probability</div>
                    </div>
                    <Badge variant="secondary">{opp.stage}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(opp)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(opp)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(opp)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create Opportunity" saveLabel="Create" onSave={() => setIsCreateOpen(false)}>
        <FormFields />
      </CrudDialog>
      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Opportunity" mode="view">
        <FormFields item={selectedItem || undefined} readOnly />
      </CrudDialog>
      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Opportunity" saveLabel="Save Changes" mode="edit" onSave={() => setIsEditOpen(false)}>
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>
      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
    </AppLayout>
  );
}
