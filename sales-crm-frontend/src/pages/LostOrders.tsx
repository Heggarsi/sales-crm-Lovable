import { useState, useEffect, useCallback } from "react";
import { XCircle, Search, Filter, TrendingDown, DollarSign, Loader2, PieChart } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface LostOrder {
  LostOrderId: number;
  Reason: string;
  CompetitorWon: string;
  LostDate: string;
  ProposalNumber: string;
  ProposalTitle: string;
  ProposalAmount: number | string;
  Currency: string;
  FirstName: string;
  LastName: string;
  CompanyName: string;
  AssignedToUserId: number;
}

interface LossAnalysis {
  rejectionReasons: { Reason: string; Count: number; TotalValue: number }[];
  topCompetitors: { CompetitorWon: string; Count: number; TotalValue: number }[];
  totalLost: number;
  totalLostValue: number;
  lossRate: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function LostOrders() {
  const [data, setData] = useState<LostOrder[]>([]);
  const [analysis, setAnalysis] = useState<LossAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalDealSelection, setGlobalDealSelection] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const isIdList = searchQuery && /^(\d+,\s*)*\d+$/.test(searchQuery.trim());

      if (searchQuery) {
        if (isIdList) {
          params.append("dealId", searchQuery.replace(/\s+/g, ""));
        } else {
          params.append("search", searchQuery);
        }
      }

      const [ordersRes, analysisRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/lostorders?${params}`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/lostorders/analysis`, { headers: getAuthHeaders() })
      ]);

      if (!ordersRes.ok) throw new Error("Failed to fetch lost orders");
      if (!analysisRes.ok) throw new Error("Failed to fetch loss analysis");

      const ordersData = await ordersRes.json();
      const analysisData = await analysisRes.json();
      console.log("Orders Data:", ordersData);
      console.log("Analysis Data:", analysisData);

      // Fix: Access data directly from the response
      setData(ordersData.data || []);
      // Fix: Analysis data structure
      setAnalysis(analysisData.data || null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, searchQuery]);

  useEffect(() => {
    const saved = localStorage.getItem("globalDealSelection");
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setGlobalDealSelection(ids);
        if (ids.length > 0) setSearchQuery(ids.join(", "));
      } catch (e) { console.error(e); }
    }
  }, []); // Run only once on mount

  useEffect(() => {
    fetchData();
  }, [searchQuery]); // Fetch when search query changes

  const filteredData = data.filter(item => {
    const isIdList = searchQuery && /^(\d+,\s*)*\d+$/.test(searchQuery.trim());
    return isIdList ||
      item.ProposalNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.CompanyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.FirstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.LastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Reason?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalLostValue = data.reduce((sum, item) => sum + Number(item.ProposalAmount), 0);
  const topCompetitor = analysis?.topCompetitors?.[0]?.CompetitorWon || "None";

  return (
    <AppLayout>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated border-none bg-rose-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-500">Total Lost</CardTitle>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analysis?.totalLost || data.length}</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">All time records</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-600">Lost Value</CardTitle>
              ₹
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600">
                {(analysis?.totalLostValue || totalLostValue).toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Total revenue lost</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-500">Loss Rate</CardTitle>
              <PieChart className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analysis?.lossRate || "0.0%"}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Relative to total deals</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600">Top Competitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 truncate">{topCompetitor}</div>
              <div className="flex flex-col gap-1 mt-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {analysis?.topCompetitors?.[0]?.Count || 0} deals lost to
                </p>
                {/* Add this line to show the lost amount */}
                <p className="text-sm font-semibold text-amber-700">
                  ₹{(Number(analysis?.topCompetitors?.[0]?.TotalValue) || 0).toLocaleString()} lost
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, company or reason..."
                  className="pl-10 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-11 px-6">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="card-elevated rounded-xl overflow-hidden border-none shadow-premium">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-muted-foreground font-medium">Loading lost orders...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-20">
                  <XCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">No lost orders found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-6 font-bold text-[11px] uppercase tracking-wider">ID</TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider">Client</TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Value</TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider">Reason</TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider">Competitor</TableHead>
                      <TableHead className="font-bold text-[11px] uppercase tracking-wider">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((order) => (
                      <TableRow key={order.LostOrderId} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-6">
                          <span className="font-mono text-xs font-bold text-muted-foreground">{order.ProposalNumber}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{order.CompanyName}</span>
                            <span className="text-[10px] text-muted-foreground">{order.FirstName} {order.LastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-rose-600">
                            ₹{Number(order.ProposalAmount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase bg-rose-500/5 text-rose-600 border-rose-500/10">
                            {order.Reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {order.CompetitorWon || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.LostDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="card-elevated border-none shadow-premium">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  Top Loss Reasons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : !analysis?.rejectionReasons || analysis.rejectionReasons.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-10">No analysis data available.</p>
                  ) : (
                    analysis.rejectionReasons.map((item, index) => (
                      <div key={item.Reason} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{item.Reason}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                            {item.Count} orders · {Number(item.TotalValue).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
