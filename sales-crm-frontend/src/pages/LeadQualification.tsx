import { FileCheck, Search, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pendingQualifications = [
  { id: 1, leadName: "Acme Corporation", company: "Acme Corp", budget: "$50,000", timeline: "Q1 2024", score: 85, assignedTo: "John Smith" },
  { id: 2, leadName: "TechStart Inc", company: "TechStart", budget: "$25,000", timeline: "Q2 2024", score: 72, assignedTo: "Sarah Johnson" },
  { id: 3, leadName: "Global Retail", company: "Global Retail Ltd", budget: "$100,000", timeline: "Q1 2024", score: 91, assignedTo: "Mike Wilson" },
  { id: 4, leadName: "Healthcare Plus", company: "HC Plus", budget: "$75,000", timeline: "Q2 2024", score: 68, assignedTo: "John Smith" },
];

export default function LeadQualification() {
  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <FileCheck className="w-7 h-7 text-primary" />
              Lead Qualification
            </h1>
            <p className="text-muted-foreground">Review and qualify leads for opportunities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Qualified Today</CardTitle>
              <CheckCircle className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
              <XCircle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search leads..." className="pl-10" />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid gap-4">
          {pendingQualifications.map((lead) => (
            <Card key={lead.id} className="card-elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{lead.leadName}</h3>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm"><strong>Budget:</strong> {lead.budget}</span>
                      <span className="text-sm"><strong>Timeline:</strong> {lead.timeline}</span>
                      <span className="text-sm"><strong>Assigned:</strong> {lead.assignedTo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{lead.score}</div>
                      <div className="text-xs text-muted-foreground">Lead Score</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button className="bg-success hover:bg-success/90 text-success-foreground">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Qualify
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
