import { XCircle, Search, Filter, TrendingDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const lostOpportunities = [
  { id: 1, name: "CRM Implementation", company: "Old Corp", value: "$75,000", reason: "Budget Constraints", competitor: "Salesforce", date: "2024-01-10" },
  { id: 2, name: "ERP Upgrade", company: "Legacy Inc", value: "$120,000", reason: "Chose Competitor", competitor: "SAP", date: "2024-01-08" },
  { id: 3, name: "Data Analytics", company: "Small Biz", value: "$45,000", reason: "Project Cancelled", competitor: "-", date: "2024-01-05" },
  { id: 4, name: "Cloud Services", company: "Traditional Ltd", value: "$95,000", reason: "Timeline Mismatch", competitor: "AWS", date: "2024-01-02" },
];

const lossReasons = [
  { reason: "Budget Constraints", count: 12, percentage: "35%" },
  { reason: "Chose Competitor", count: 8, percentage: "24%" },
  { reason: "Project Cancelled", count: 6, percentage: "18%" },
  { reason: "Timeline Mismatch", count: 5, percentage: "15%" },
  { reason: "Other", count: 3, percentage: "8%" },
];

export default function LostOpportunities() {
  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <XCircle className="w-7 h-7 text-destructive" />
              Lost Opportunities
            </h1>
            <p className="text-muted-foreground">Analyze and learn from lost deals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Lost</CardTitle>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34</div>
              <p className="text-xs text-muted-foreground">This quarter</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lost Value</CardTitle>
              <XCircle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1.2M</div>
              <p className="text-xs text-muted-foreground">Total pipeline lost</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Top Competitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Salesforce</div>
              <p className="text-xs text-muted-foreground">8 deals lost</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Recent Lost Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opportunity</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Competitor</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lostOpportunities.map((opp) => (
                      <TableRow key={opp.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{opp.name}</div>
                            <div className="text-sm text-muted-foreground">{opp.company}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-destructive font-medium">{opp.value}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{opp.reason}</Badge>
                        </TableCell>
                        <TableCell>{opp.competitor}</TableCell>
                        <TableCell>{opp.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Loss Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lossReasons.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">{item.count} deals</p>
                    </div>
                    <span className="text-sm font-bold">{item.percentage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
