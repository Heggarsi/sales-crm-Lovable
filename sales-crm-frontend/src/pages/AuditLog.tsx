import { Shield, Search, Filter, Eye, Clock, User, Database } from "lucide-react";
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

const auditLogs = [
  { id: 1, action: "UPDATE", entity: "Lead", entityId: "LEAD-1234", user: "John Smith", oldValue: "Status: New", newValue: "Status: Contacted", timestamp: "2024-01-15 10:30:45", ip: "192.168.1.100" },
  { id: 2, action: "CREATE", entity: "Proposal", entityId: "PROP-005", user: "Sarah Johnson", oldValue: "-", newValue: "Created proposal for TechStart", timestamp: "2024-01-15 10:25:12", ip: "192.168.1.101" },
  { id: 3, action: "DELETE", entity: "Activity", entityId: "ACT-789", user: "Admin", oldValue: "Follow-up call note", newValue: "-", timestamp: "2024-01-15 10:20:00", ip: "192.168.1.1" },
  { id: 4, action: "UPDATE", entity: "Opportunity", entityId: "OPP-456", user: "Mike Wilson", oldValue: "Stage: Qualification", newValue: "Stage: Proposal", timestamp: "2024-01-15 10:15:30", ip: "192.168.1.102" },
  { id: 5, action: "UPDATE", entity: "User", entityId: "USER-003", user: "Admin", oldValue: "Role: Sales", newValue: "Role: Admin", timestamp: "2024-01-15 10:10:00", ip: "192.168.1.1" },
  { id: 6, action: "CREATE", entity: "Lead", entityId: "LEAD-1235", user: "Customer Portal", oldValue: "-", newValue: "New lead from website", timestamp: "2024-01-15 10:05:22", ip: "203.0.113.50" },
];

const getActionColor = (action: string) => {
  switch (action) {
    case "CREATE": return "bg-success text-success-foreground";
    case "UPDATE": return "bg-info text-info-foreground";
    case "DELETE": return "bg-destructive text-destructive-foreground";
    default: return "bg-secondary";
  }
};

export default function AuditLog() {
  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground">System-wide audit trail (Read Only)</p>
          </div>
          <Badge variant="outline" className="text-warning border-warning">
            <Eye className="w-3 h-3 mr-1" />
            Read Only
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Database className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,456</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">248</div>
              <p className="text-xs text-muted-foreground">Changes logged</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">Made changes today</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Deletions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">12</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search audit logs..." className="pl-10" />
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
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.entity}</div>
                      <div className="text-xs text-muted-foreground">{log.entityId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{log.oldValue}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{log.newValue}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
