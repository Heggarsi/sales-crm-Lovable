import { XCircle, Search, Filter, TrendingDown, DollarSign } from "lucide-react";
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

const lostOrders = [
  { id: "LO-2024-001", client: "Old Corp", value: "$75,000", reason: "Budget Cut", competitor: "-", date: "Jan 12, 2024", salesperson: "John Smith" },
  { id: "LO-2024-002", client: "Legacy Inc", value: "$120,000", reason: "Chose Competitor", competitor: "Salesforce", date: "Jan 10, 2024", salesperson: "Sarah Johnson" },
  { id: "LO-2024-003", client: "Small Biz", value: "$45,000", reason: "Project Cancelled", competitor: "-", date: "Jan 08, 2024", salesperson: "Mike Wilson" },
  { id: "LO-2024-004", client: "Traditional Ltd", value: "$95,000", reason: "Pricing Issue", competitor: "HubSpot", date: "Jan 05, 2024", salesperson: "Emily Davis" },
];

const topReasons = [
  { reason: "Budget Constraints", count: 15, value: "$450K" },
  { reason: "Chose Competitor", count: 12, value: "$380K" },
  { reason: "Project Cancelled", count: 8, value: "$220K" },
  { reason: "Pricing Issue", count: 6, value: "$180K" },
];

export default function LostOrders() {
  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <XCircle className="w-7 h-7 text-destructive" />
              Lost Orders
            </h1>
            <p className="text-muted-foreground">Track and analyze orders that didn't close</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Lost</CardTitle>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">41</div>
              <p className="text-xs text-muted-foreground">This quarter</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lost Value</CardTitle>
              <DollarSign className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">$1.23M</div>
              <p className="text-xs text-muted-foreground">Total revenue lost</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">77.6%</div>
              <p className="text-xs text-muted-foreground">Orders won vs lost</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Top Competitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Salesforce</div>
              <p className="text-xs text-muted-foreground">12 deals lost to</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search lost orders..." className="pl-10" />
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
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lostOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell className="font-medium">{order.client}</TableCell>
                      <TableCell className="text-destructive font-semibold">{order.value}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.reason}</Badge>
                      </TableCell>
                      <TableCell>{order.competitor}</TableCell>
                      <TableCell>{order.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Top Loss Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topReasons.map((item, index) => (
                  <div key={item.reason} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">{item.count} orders · {item.value}</p>
                    </div>
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
