import { useState } from "react";
import { CreditCard, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";

interface PaymentStatus {
  id: number;
  statusName: string;
}

const dummyData: PaymentStatus[] = [
  { id: 1, statusName: "Pending" },
  { id: 2, statusName: "Partial" },
  { id: 3, statusName: "Paid" },
  { id: 4, statusName: "Overdue" },
  { id: 5, statusName: "Refunded" },
];

export default function PaymentStatuses() {
  const [data, setData] = useState<PaymentStatus[]>(dummyData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PaymentStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.statusName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item: PaymentStatus) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = (item: PaymentStatus) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      setData(data.filter(item => item.id !== selectedItem.id));
      setIsDeleteOpen(false);
      setSelectedItem(null);
    }
  };

  const FormFields = ({ item }: { item?: PaymentStatus }) => (
    <div className="space-y-2">
      <Label>Status Name</Label>
      <Input defaultValue={item?.statusName} placeholder="Enter status name" />
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-primary" />
              Payment Statuses
            </h1>
            <p className="text-muted-foreground">Manage payment status options</p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search statuses..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status Name</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="secondary">{item.statusName}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CrudDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add Payment Status"
        saveLabel="Create"
        onSave={() => setIsCreateOpen(false)}
      >
        <FormFields />
      </CrudDialog>

      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Payment Status"
        saveLabel="Save Changes"
        mode="edit"
        onSave={() => setIsEditOpen(false)}
      >
        <FormFields item={selectedItem || undefined} />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  );
}
