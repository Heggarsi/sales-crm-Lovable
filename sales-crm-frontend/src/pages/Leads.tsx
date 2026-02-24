import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Download } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  leadNumber: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  score: "hot" | "warm" | "cold";
  value: number;
  assignedTo: string;
  createdAt: string;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    leadNumber: "LD-2024-001",
    name: "Sarah Johnson",
    email: "sarah@techstart.com",
    phone: "+1 (555) 123-4567",
    company: "TechStart Inc",
    source: "Website",
    status: "qualified",
    score: "hot",
    value: 25000,
    assignedTo: "Alex Thompson",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    leadNumber: "LD-2024-002",
    name: "Michael Chen",
    email: "m.chen@globaltech.io",
    phone: "+1 (555) 234-5678",
    company: "GlobalTech",
    source: "LinkedIn",
    status: "new",
    score: "warm",
    value: 45000,
    assignedTo: "Maria Garcia",
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    leadNumber: "LD-2024-003",
    name: "Emily Davis",
    email: "emily@innovate.co",
    phone: "+1 (555) 345-6789",
    company: "Innovate Labs",
    source: "Referral",
    status: "contacted",
    score: "warm",
    value: 18500,
    assignedTo: "David Kim",
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    leadNumber: "LD-2024-004",
    name: "James Wilson",
    email: "jwilson@dataflow.com",
    phone: "+1 (555) 456-7890",
    company: "DataFlow Systems",
    source: "Trade Show",
    status: "qualified",
    score: "hot",
    value: 32000,
    assignedTo: "Sophie Turner",
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    leadNumber: "LD-2024-005",
    name: "Lisa Anderson",
    email: "lisa@cloudnine.tech",
    phone: "+1 (555) 567-8901",
    company: "CloudNine",
    source: "Website",
    status: "new",
    score: "cold",
    value: 52000,
    assignedTo: "Alex Thompson",
    createdAt: "2024-01-11",
  },
];

const statusStyles: Record<Lead["status"], string> = {
  new: "status-new",
  contacted: "status-contacted",
  qualified: "status-qualified",
  converted: "status-converted",
  lost: "status-lost",
};

const scoreStyles: Record<Lead["score"], { bg: string; text: string }> = {
  hot: { bg: "bg-red-100", text: "text-red-700" },
  warm: { bg: "bg-amber-100", text: "text-amber-700" },
  cold: { bg: "bg-blue-100", text: "text-blue-700" },
};

export default function Leads() {
  const [leads] = useState<Lead[]>(mockLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Leads</h1>
            <p className="text-muted-foreground">
              Manage and track your sales leads
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-primary-foreground shadow-glow">
                  <Plus className="w-4 h-4" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Lead</DialogTitle>
                  <DialogDescription>
                    Add a new lead to your pipeline. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="Acme Inc" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@acme.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Lead Source</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="tradeshow">Trade Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Expected Value</Label>
                      <Input id="value" type="number" placeholder="10000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Add any additional notes..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="gradient-primary text-primary-foreground">
                    Create Lead
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="card-elevated p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border">
                  <th>Lead</th>
                  <th>Company</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Value</th>
                  <th>Assigned To</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {lead.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.leadNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{lead.company}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </td>
                    <td>
                      <Badge variant="secondary">{lead.source}</Badge>
                    </td>
                    <td>
                      <span className={cn("status-badge capitalize", statusStyles[lead.status])}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "status-badge capitalize",
                          scoreStyles[lead.score].bg,
                          scoreStyles[lead.score].text
                        )}
                      >
                        {lead.score}
                      </span>
                    </td>
                    <td className="font-semibold">
                      ${lead.value.toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {lead.assignedTo
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{lead.assignedTo}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLeads.length} of {leads.length} leads
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
