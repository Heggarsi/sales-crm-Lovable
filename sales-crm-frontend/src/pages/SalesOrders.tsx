import { useState } from "react";
import { Package, Plus, Search, Filter, Download, Eye, MoreHorizontal, DollarSign, Edit, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

interface SalesOrder {
  id: string;
  proposalId: string;
  orderDate: string;
  orderValue: string;
  currency: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  poNumber: string;
  invoiceGenerated: boolean;
  paymentStatus: string;
  deliveryStatus: string;
  client: string;
  status: string;
  salesperson: string;
}

const dummyOrders: SalesOrder[] = [
  { id: "SO-2024-001", proposalId: "PROP-001", orderDate: "2024-01-15", orderValue: "150000", currency: "USD", expectedDeliveryDate: "2024-03-15", actualDeliveryDate: "2024-03-10", poNumber: "PO-ACM-2024-001", invoiceGenerated: true, paymentStatus: "Paid", deliveryStatus: "Completed", client: "Acme Corp", status: "Completed", salesperson: "John Smith" },
  { id: "SO-2024-002", proposalId: "PROP-002", orderDate: "2024-01-14", orderValue: "85000", currency: "USD", expectedDeliveryDate: "2024-04-01", actualDeliveryDate: "", poNumber: "PO-TS-2024-001", invoiceGenerated: false, paymentStatus: "Partial", deliveryStatus: "In Progress", client: "TechStart", status: "In Progress", salesperson: "Sarah Johnson" },
  { id: "SO-2024-003", proposalId: "PROP-003", orderDate: "2024-01-12", orderValue: "250000", currency: "USD", expectedDeliveryDate: "2024-05-01", actualDeliveryDate: "2024-04-28", poNumber: "PO-GR-2024-001", invoiceGenerated: true, paymentStatus: "Paid", deliveryStatus: "Completed", client: "Global Retail", status: "Completed", salesperson: "Mike Wilson" },
  { id: "SO-2024-004", proposalId: "PROP-004", orderDate: "2024-01-10", orderValue: "120000", currency: "USD", expectedDeliveryDate: "2024-03-01", actualDeliveryDate: "", poNumber: "", invoiceGenerated: false, paymentStatus: "Unpaid", deliveryStatus: "Pending", client: "Healthcare Plus", status: "Pending", salesperson: "John Smith" },
  { id: "SO-2024-005", proposalId: "PROP-005", orderDate: "2024-01-08", orderValue: "95000", currency: "USD", expectedDeliveryDate: "2024-02-28", actualDeliveryDate: "2024-02-25", poNumber: "PO-FC-2024-001", invoiceGenerated: true, paymentStatus: "Paid", deliveryStatus: "Completed", client: "Finance Corp", status: "Completed", salesperson: "Emily Davis" },
];

const paymentStatuses = ["Unpaid", "Partial", "Paid", "Overdue"];
const deliveryStatuses = ["Pending", "In Progress", "Shipped", "Completed", "Delayed"];

export default function SalesOrders() {
  const [data, setData] = useState<SalesOrder[]>(dummyOrders);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SalesOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (item: SalesOrder) => { setSelectedItem(item); setIsViewOpen(true); };
  const handleEdit = (item: SalesOrder) => { setSelectedItem(item); setIsEditOpen(true); };
  const handleDelete = (item: SalesOrder) => { setSelectedItem(item); setIsDeleteOpen(true); };
  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item, readOnly = false }: { item?: SalesOrder; readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Proposal ID</Label>
          <Input defaultValue={item?.proposalId} placeholder="Enter proposal ID" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Order Date</Label>
          <Input type="date" defaultValue={item?.orderDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Order Value</Label>
          <Input type="number" defaultValue={item?.orderValue} placeholder="0" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Expected Delivery Date</Label>
          <Input type="date" defaultValue={item?.expectedDeliveryDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Actual Delivery Date</Label>
          <Input type="date" defaultValue={item?.actualDeliveryDate} readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>PO Number</Label>
          <Input defaultValue={item?.poNumber} placeholder="Enter PO number" readOnly={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
        <div className="space-y-2">
          <Label>PO Document</Label>
          <Input type="file" disabled={readOnly} className={readOnly ? "bg-muted" : ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Status</Label>
          {readOnly ? (
            <Input defaultValue={item?.paymentStatus} readOnly className="bg-muted" />
          ) : (
            <Select defaultValue={item?.paymentStatus}>
              <SelectTrigger><SelectValue placeholder="Select payment status" /></SelectTrigger>
              <SelectContent>
                {paymentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>Delivery Status</Label>
          {readOnly ? (
            <Input defaultValue={item?.deliveryStatus} readOnly className="bg-muted" />
          ) : (
            <Select defaultValue={item?.deliveryStatus}>
              <SelectTrigger><SelectValue placeholder="Select delivery status" /></SelectTrigger>
              <SelectContent>
                {deliveryStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Label>Invoice Generated</Label>
        <Switch defaultChecked={item?.invoiceGenerated ?? false} disabled={readOnly} />
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Sales Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">This quarter</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">$1.2M</div>
              <p className="text-xs text-muted-foreground">+22% from last quarter</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">14</div>
              <p className="text-xs text-muted-foreground">Awaiting completion</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search orders..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id}</TableCell>
                  <TableCell className="font-medium">{order.client}</TableCell>
                  <TableCell className="font-semibold text-success">${Number(order.orderValue).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "Completed" ? "default" : order.status === "In Progress" ? "secondary" : "outline"}
                           className={order.status === "Completed" ? "bg-success text-success-foreground" : ""}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === "Paid" ? "default" : order.paymentStatus === "Partial" ? "secondary" : "outline"}
                           className={order.paymentStatus === "Paid" ? "bg-success text-success-foreground" : order.paymentStatus === "Unpaid" ? "bg-destructive text-destructive-foreground" : ""}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.salesperson}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(order)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(order)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(order)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create Sales Order" saveLabel="Create" onSave={() => setIsCreateOpen(false)}>
        <FormFields />
      </CrudDialog>
      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Sales Order" mode="view">
        <FormFields item={selectedItem || undefined} readOnly />
      </CrudDialog>
      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Sales Order" saveLabel="Save Changes" mode="edit" onSave={() => setIsEditOpen(false)}>
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>
      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
    </AppLayout>
  );
}
