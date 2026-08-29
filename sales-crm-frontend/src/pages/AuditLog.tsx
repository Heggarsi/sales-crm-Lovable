import { useState, useEffect, useCallback } from "react";
import { Shield, Search, Filter, Eye, Clock, User, Database, Loader2 } from "lucide-react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
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
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";
import { CrudDialog } from "@/components/shared/CrudDialog";

interface AuditLogRecord {
  AuditLogId: number;
  TableName: string;
  RecordId: number | string;
  Action: string;
  OldValues: any;
  NewValues: any;
  ChangedBy: number;
  ChangedByName: string;
  ChangedAt: string;
  IPAddress: string;
  UserAgent: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getActionColor = (action: string) => {
  switch (action.toUpperCase()) {
    case "CREATE": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "UPDATE": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "DELETE": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    case "LOGIN": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }
};

const formatValue = (val: any) => {
  if (val === null || val === undefined) return "None";
  if (typeof val === "object") {
    if (Object.keys(val).length === 0) return "None";
    return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(", ");
  }
  return String(val);
};

export default function AuditLog() {
  const [data, setData] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuditLogRecord | null>(null);
  const { toast } = useToast();

  const openView = (item: AuditLogRecord) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/audit?page=${currentPage}&limit=10`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const result = await res.json();
      setData(result.audits || []);
      if (result.total) setTotalPages(Math.ceil(result.total / 10));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item =>
    item.TableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ChangedByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.Action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.RecordId.toString().includes(searchQuery.toLowerCase())
  );

  const todayLogs = data.filter(log => {
    const today = new Date().toISOString().split('T')[0];
    return log.ChangedAt.split('T')[0] === today;
  });

  const deletions = data.filter(log => log.Action.toUpperCase() === "DELETE");

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground">System-wide audit trail (Read Only)</p>
          </div>
          <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5">
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Admin Read Only
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated border-none bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Total Entries</CardTitle>
              <Database className="w-4 h-4 text-primary opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.length}</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">All time records</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-500">Today</CardTitle>
              <Clock className="w-4 h-4 text-blue-500 opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayLogs.length}</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Changes logged today</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-500">Active Users</CardTitle>
              <User className="w-4 h-4 text-amber-500 opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{new Set(todayLogs.map(l => l.ChangedBy)).size}</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Active users today</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-rose-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-500">Deletions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-500">{deletions.length}</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Deletion events</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search table, user or action..."
              className="pl-10 h-11 border-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 px-6">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {isRefreshing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>

        <div className="card-elevated rounded-xl overflow-hidden border-none shadow-premium">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Loading audit trail...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20">
              <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">No audit entries found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6 font-bold text-[11px] uppercase tracking-wider">Timestamp</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Action</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Entity</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">User</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Changes</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">IP Address</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((log) => (
                  <TableRow key={log.AuditLogId} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          {new Date(log.ChangedAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(log.ChangedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase ${getActionColor(log.Action)}`}>
                        {log.Action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{log.TableName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {log.RecordId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                          {log.ChangedByName?.[0] || "?"}
                        </div>
                        <span className="text-sm font-medium">{log.ChangedByName || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="flex flex-col gap-1 pr-4">
                        {log.Action === "UPDATE" ? (
                          <>
                            <div className="text-[10px] text-muted-foreground strike-through truncate opacity-60">
                              Was: {formatValue(log.OldValues)}
                            </div>
                            <div className="text-xs font-medium text-blue-600 truncate">
                              Now: {formatValue(log.NewValues)}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs italic text-muted-foreground truncate">
                            {log.Action === "CREATE" ? "New record created" : "Record removed"}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {log.IPAddress || "Local"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(log)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center py-4 px-2">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="Audit Record Details" mode="view">
        {selectedItem && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Timestamp</span>
                <p className="text-sm">{new Date(selectedItem.ChangedAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</span>
                <p>
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase ${getActionColor(selectedItem.Action)}`}>
                    {selectedItem.Action}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User</span>
                <p className="text-sm">{selectedItem.ChangedByName || "System"} (ID: {selectedItem.ChangedBy})</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Entity</span>
                <p className="text-sm">{selectedItem.TableName} (ID: {selectedItem.RecordId})</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Changes</span>
              {selectedItem.Action === "UPDATE" ? (
                <div className="space-y-4">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground line-through opacity-60 mb-1">Was:</div>
                    <div className="bg-muted/50 rounded-xl text-sm border border-muted w-full min-w-0 overflow-hidden">
                      <div className="p-4 overflow-x-auto whitespace-nowrap max-h-[300px] space-y-1">
                        {selectedItem.OldValues ? Object.entries(selectedItem.OldValues).map(([k, v]) => (
                          <div key={k}><strong className="text-slate-600">{k}:</strong> {String(v)}</div>
                        )) : "None"}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-blue-600 mb-1">Now:</div>
                    <div className="bg-blue-500/5 rounded-xl text-sm border border-blue-500/20 text-blue-700 w-full min-w-0 overflow-hidden">
                      <div className="p-4 overflow-x-auto whitespace-nowrap max-h-[300px] space-y-1">
                        {selectedItem.NewValues ? Object.entries(selectedItem.NewValues).map(([k, v]) => (
                          <div key={k}><strong>{k}:</strong> {String(v)}</div>
                        )) : "None"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedItem.Action === "CREATE" ? (
                <div className="min-w-0">
                  <div className="text-xs italic text-muted-foreground mb-1">New record created:</div>
                  <div className="bg-emerald-500/5 rounded-xl text-sm border border-emerald-500/20 text-emerald-700 w-full min-w-0 overflow-hidden">
                    <div className="p-4 overflow-x-auto whitespace-nowrap max-h-[300px] space-y-1">
                      {selectedItem.NewValues ? Object.entries(selectedItem.NewValues).map(([k, v]) => (
                        <div key={k}><strong>{k}:</strong> {String(v)}</div>
                      )) : "None"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="text-xs italic text-muted-foreground mb-1">Record removed:</div>
                  <div className="bg-rose-500/5 rounded-xl text-sm border border-rose-500/20 text-rose-700 w-full min-w-0 overflow-hidden">
                    <div className="p-4 overflow-x-auto whitespace-nowrap max-h-[300px] space-y-1">
                      {selectedItem.OldValues ? Object.entries(selectedItem.OldValues).map(([k, v]) => (
                        <div key={k}><strong>{k}:</strong> {String(v)}</div>
                      )) : "None"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">IP Address</span>
                <p className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit">
                  {selectedItem.IPAddress || "Local"}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">User Agent</span>
                <p className="text-xs line-clamp-2" title={selectedItem.UserAgent}>{selectedItem.UserAgent || "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </CrudDialog>
    </SettingsLayout>
  );
}
