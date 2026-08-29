import { useState, useEffect, useCallback, useMemo } from "react";
import { Package, Plus, Search, Filter, Download, Eye, MoreHorizontal, DollarSign, Edit, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface SalesOrder {
  OrderId: number;
  OrderNumber: string;
  OrderTitle: string;
  ProposalId?: number;
  OrderDate: string;
  OrderAmount: number | string;
  OrderValue?: number | string;
  Currency: string;
  ExpectedDeliveryDate?: string;
  ActualDeliveryDate?: string;
  PONumber?: string;
  PODocument?: string;
  InvoiceGenerated: boolean | number;
  PaymentStatusId: number;
  PaymentStatusName?: string;
  DeliveryStatusId: number;
  DeliveryStatusName?: string;
  FirstName?: string;
  LastName?: string;
  CompanyName?: string;
}

interface FormFieldsProps {
  formData: Partial<SalesOrder>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<SalesOrder>>>;
  proposals: any[];
  paymentStatuses: any[];
  deliveryStatuses: any[];
  readOnly?: boolean;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Move FormFields outside the main component to prevent re-creation
const FormFields = ({ formData, setFormData, proposals, paymentStatuses, deliveryStatuses, readOnly = false }: FormFieldsProps) => (
  <div className="space-y-4 py-2">
    <div className="space-y-2">
      <Label>Proposal *</Label>
      <Select
        value={formData.ProposalId?.toString()}
        onValueChange={(val) => {
          const prop = proposals.find(p => p.ProposalId.toString() === val);
          setFormData({
            ...formData,
            ProposalId: parseInt(val),
            OrderValue: prop?.ProposalAmount || formData.OrderValue,
            Currency: prop?.Currency || formData.Currency
          });
        }}
        disabled={readOnly}
      >
        <SelectTrigger><SelectValue placeholder="Select approved proposal" /></SelectTrigger>
        <SelectContent>
          {proposals.map(p => (
            <SelectItem key={p.ProposalId} value={p.ProposalId.toString()}>
              {p.ProposalNumber} - {p.ProposalTitle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Order Value *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            value={formData.OrderValue || ""}
            onChange={(e) => setFormData({ ...formData, OrderValue: e.target.value })}
            placeholder="0.00"
            className={`pl-7 ${readOnly ? "bg-muted" : ""}`}
            readOnly={readOnly}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Select
          value={formData.Currency}
          onValueChange={(val) => setFormData({ ...formData, Currency: val })}
          disabled={readOnly}
        >
          <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
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
        <Label>Order Date *</Label>
        <Input
          type="date"
          value={formData.OrderDate || ""}
          onChange={(e) => setFormData({ ...formData, OrderDate: e.target.value })}
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Expected Delivery</Label>
        <Input
          type="date"
          value={formData.ExpectedDeliveryDate || ""}
          onChange={(e) => setFormData({ ...formData, ExpectedDeliveryDate: e.target.value })}
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>PO Number</Label>
        <Input
          value={formData.PONumber || ""}
          onChange={(e) => setFormData({ ...formData, PONumber: e.target.value })}
          placeholder="PO-XXXX"
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      <div className="space-y-2">
        <Label>PO Document</Label>
        <Input
          value={formData.PODocument || ""}
          onChange={(e) => setFormData({ ...formData, PODocument: e.target.value })}
          placeholder="Document path or reference"
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Actual Delivery</Label>
        <Input
          type="date"
          value={formData.ActualDeliveryDate || ""}
          onChange={(e) => setFormData({ ...formData, ActualDeliveryDate: e.target.value })}
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Payment Status</Label>
        <Select
          value={formData.PaymentStatusId?.toString()}
          onValueChange={(val) => setFormData({ ...formData, PaymentStatusId: parseInt(val) })}
          disabled={readOnly}
        >
          <SelectTrigger><SelectValue placeholder="Payment status" /></SelectTrigger>
          <SelectContent>
            {paymentStatuses.map(s => (
              <SelectItem key={s.PaymentStatusId} value={s.PaymentStatusId.toString()}>
                {s.StatusName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Delivery Status</Label>
        <Select
          value={formData.DeliveryStatusId?.toString()}
          onValueChange={(val) => setFormData({ ...formData, DeliveryStatusId: parseInt(val) })}
          disabled={readOnly}
        >
          <SelectTrigger><SelectValue placeholder="Delivery status" /></SelectTrigger>
          <SelectContent>
            {deliveryStatuses.map(s => (
              <SelectItem key={s.DeliveryStatusId} value={s.DeliveryStatusId.toString()}>
                {s.StatusName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3 py-6">
        <Label>Invoice Generated</Label>
        <Switch
          checked={!!formData.InvoiceGenerated}
          onCheckedChange={(val) => setFormData({ ...formData, InvoiceGenerated: val })}
          disabled={readOnly}
        />
      </div>
    </div>
  </div>
);

export default function SalesOrders() {
  const [data, setData] = useState<SalesOrder[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<any[]>([]);
  const [deliveryStatuses, setDeliveryStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SalesOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<SalesOrder>>({
    ProposalId: undefined,
    OrderValue: "",
    Currency: "USD",
    OrderDate: new Date().toISOString().split('T')[0],
    ExpectedDeliveryDate: "",
    ActualDeliveryDate: "",
    PONumber: "",
    PODocument: "",
    InvoiceGenerated: false,
    PaymentStatusId: 1,
    DeliveryStatusId: 1
  });

  const [globalDealSelection, setGlobalDealSelection] = useState<string[]>([]);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
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

      const [ordersRes, lookupsRes, propsRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/salesorders?${params}`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/salesorders/lookups`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/proposals?proposalStatusId=4&excludeConverted=true`, { headers: getAuthHeaders() })
      ]);

      if (!ordersRes.ok) throw new Error("Failed to fetch sales orders");

      const ordersData = await ordersRes.json();
      const lookupsData = await lookupsRes.json();
      const propsData = await propsRes.json();
      setData(ordersData.orders || []);
      setPaymentStatuses(lookupsData.data.paymentStatuses || []);
      setDeliveryStatuses(lookupsData.data.deliveryStatuses || []);
      setProposals(propsData.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      item.OrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.OrderTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.CompanyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.FirstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.LastName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreate = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/salesorders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          OrderValue: formData.OrderValue ? parseFloat(formData.OrderValue as string) : 0,
          InvoiceGenerated: formData.InvoiceGenerated ? 1 : 0
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create sales order");
      }
      toast({ title: "Success", description: "Sales order created successfully" });
      fetchData(false);
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/salesorders/${selectedItem.OrderId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          OrderValue: formData.OrderValue ? parseFloat(formData.OrderValue as string) : 0,
          InvoiceGenerated: formData.InvoiceGenerated ? 1 : 0
        }),
      });
      if (!res.ok) throw new Error("Failed to update sales order");
      toast({ title: "Success", description: "Sales order updated successfully" });
      fetchData(false);
      setIsEditOpen(false);
      setSelectedItem(null);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/salesorders/${selectedItem.OrderId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete sales order");
      toast({ title: "Success", description: "Sales order deleted successfully" });
      fetchData(false);
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      ProposalId: undefined,
      OrderValue: "",
      Currency: "USD",
      OrderDate: new Date().toISOString().split('T')[0],
      ExpectedDeliveryDate: "",
      ActualDeliveryDate: "",
      PONumber: "",
      PODocument: "",
      InvoiceGenerated: false,
      PaymentStatusId: 1,
      DeliveryStatusId: 1
    });
  };

  const prepareFormData = (item: SalesOrder) => {
    setSelectedItem(item);
    setFormData({
      ProposalId: item.ProposalId,
      OrderValue: item.OrderValue?.toString() || item.OrderAmount?.toString() || "",
      Currency: item.Currency,
      OrderDate: item.OrderDate ? item.OrderDate.split('T')[0] : "",
      ExpectedDeliveryDate: item.ExpectedDeliveryDate ? item.ExpectedDeliveryDate.split('T')[0] : "",
      ActualDeliveryDate: item.ActualDeliveryDate ? item.ActualDeliveryDate.split('T')[0] : "",
      PONumber: item.PONumber || "",
      PODocument: item.PODocument || "",
      InvoiceGenerated: !!item.InvoiceGenerated,
      PaymentStatusId: item.PaymentStatusId,
      DeliveryStatusId: item.DeliveryStatusId
    });
  };

  const handleView = (item: SalesOrder) => {
    prepareFormData(item);
    setIsViewOpen(true);
  };

  const openEdit = (item: SalesOrder) => {
    prepareFormData(item);
    setIsEditOpen(true);
  };

  // Memoize the form data to prevent unnecessary re-renders
  const memoizedFormData = useMemo(() => formData, [formData]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Package className="w-7 h-7 text-primary" />
              Sales Orders
            </h1>
            <p className="text-muted-foreground">Track and manage accepted sales orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-10">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="gradient-primary h-10" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Sales Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated border-none bg-primary/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Total Orders</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{data.length}</div></CardContent>
          </Card>
          <Card className="card-elevated border-none bg-emerald-500/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-500">Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                ₹{data.reduce((sum, item) => sum + Number(item.OrderAmount), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-blue-500/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-500">Completed</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-blue-500">{data.filter(o => o.DeliveryStatusName === "Completed").length}</div></CardContent>
          </Card>
          <Card className="card-elevated border-none bg-amber-500/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-500">Pending</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-amber-500">{data.filter(o => o.DeliveryStatusName !== "Completed").length}</div></CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by title or company..."
              className="pl-10 h-11"
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
              <p className="text-muted-foreground font-medium">Loading orders...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">No sales orders found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6 font-bold text-[11px] uppercase tracking-wider">Order</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Client</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Value</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-center">Payment</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-center">Delivery</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Date</TableHead>
                  <TableHead className="w-12 pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((order) => (
                  <TableRow key={order.OrderId} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{order.OrderTitle}</span>
                        <Badge variant="outline" className="w-fit text-[9px] h-4 px-1 font-mono uppercase text-muted-foreground border-muted/50 mt-1">{order.OrderNumber}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{order.CompanyName}</span>
                        <span className="text-[10px] text-muted-foreground">{order.FirstName} {order.LastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-sm text-emerald-600">
                        {order.Currency} {Number(order.OrderAmount).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase ${order.PaymentStatusName === "Paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                        order.PaymentStatusName === "Partial" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                          "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        }`}>
                        {order.PaymentStatusName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase ${order.DeliveryStatusName === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                        order.DeliveryStatusName === "Delayed" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                          "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                        {order.DeliveryStatusName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(order.OrderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-premium border-muted/50">
                          <DropdownMenuItem onClick={() => handleView(order)} className="gap-2">
                            <Eye className="w-4 h-4 text-muted-foreground" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(order)} className="gap-2">
                            <Edit className="w-4 h-4 text-primary/70" /> Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.InvoiceGenerated ? (
                            <DropdownMenuItem className="gap-2 text-emerald-500">
                              <CheckCircle2 className="w-4 h-4" /> Invoice Sent
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="gap-2">
                              <Package className="w-4 h-4 text-blue-500" /> Generate Invoice
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-500 gap-2" onClick={() => { setSelectedItem(order); setIsDeleteOpen(true); }}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create Sales Order" saveLabel="Create Order" onSave={handleCreate}>
        <FormFields
          formData={formData}
          setFormData={setFormData}
          proposals={proposals}
          paymentStatuses={paymentStatuses}
          deliveryStatuses={deliveryStatuses}
          readOnly={false}
        />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="Order Details" mode="view">
        <FormFields
          formData={formData}
          setFormData={setFormData}
          proposals={proposals}
          paymentStatuses={paymentStatuses}
          deliveryStatuses={deliveryStatuses}
          readOnly={true}
        />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Sales Order" saveLabel="Update Order" mode="edit" onSave={handleUpdate}>
        <FormFields
          formData={formData}
          setFormData={setFormData}
          proposals={proposals}
          paymentStatuses={paymentStatuses}
          deliveryStatuses={deliveryStatuses}
          readOnly={false}
        />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        title="Delete order"
        description={`Are you sure you want to delete sales order "${selectedItem?.OrderNumber}"? This cannot be undone.`}
      />
    </AppLayout>
  );
}
