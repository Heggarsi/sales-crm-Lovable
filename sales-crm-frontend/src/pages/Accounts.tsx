import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Loader2, Building2, Globe, Phone as PhoneIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  phone: string;
  website: string;
  industry: string;
  annualRevenue: string;
  numberOfEmployees: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingZip: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  shippingZip: string;
  description: string;
  creatorName: string;
  createdAt: string;
}

interface AccountFormData {
  accountName: string;
  phone: string;
  website: string;
  industry: string;
  annualRevenue: string;
  numberOfEmployees: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingZip: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  shippingZip: string;
  description: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (a: any): Account => ({
  id: String(a.AccountId),
  accountNumber: a.AccountNumber || "",
  accountName: a.AccountName || "",
  phone: a.Phone || "",
  website: a.Website || "",
  industry: a.Industry || "",
  annualRevenue: a.AnnualRevenue || "",
  numberOfEmployees: a.NumberOfEmployees || "",
  billingStreet: a.BillingStreet || "",
  billingCity: a.BillingCity || "",
  billingState: a.BillingState || "",
  billingCountry: a.BillingCountry || "",
  billingZip: a.BillingZip || "",
  shippingStreet: a.ShippingStreet || "",
  shippingCity: a.ShippingCity || "",
  shippingState: a.ShippingState || "",
  shippingCountry: a.ShippingCountry || "",
  shippingZip: a.ShippingZip || "",
  description: a.Description || "",
  creatorName: a.CreatorName || "",
  createdAt: a.CreatedAt || "",
});

const emptyForm: AccountFormData = {
  accountName: "", phone: "", website: "", industry: "", annualRevenue: "",
  numberOfEmployees: "", billingStreet: "", billingCity: "", billingState: "",
  billingCountry: "", billingZip: "", shippingStreet: "", shippingCity: "",
  shippingState: "", shippingCountry: "", shippingZip: "", description: "",
};



const FormFields = ({
  data,
  onChange,
  readOnly = false,
  isFetching = false,
}: {
  data: AccountFormData;
  onChange: (data: AccountFormData) => void;
  readOnly?: boolean;
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching account details...</p>
      </div>
    );
  }

  const copyBillingToShipping = () => {
    onChange({
      ...data,
      shippingStreet: data.billingStreet,
      shippingCity: data.billingCity,
      shippingState: data.billingState,
      shippingCountry: data.billingCountry,
      shippingZip: data.billingZip,
    });
  };

  return (
    <div className="grid gap-6 py-2">
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Account Name *</Label>
            <Input value={data.accountName} onChange={(e) => onChange({ ...data, accountName: e.target.value })} placeholder="Acme Corp" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input 
              value={data.industry} 
              onChange={(e) => onChange({ ...data, industry: e.target.value })} 
              placeholder="e.g. Technology" 
              disabled={readOnly} 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} placeholder="+1 (555) 000-0000" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={data.website} onChange={(e) => onChange({ ...data, website: e.target.value })} placeholder="https://example.com" disabled={readOnly} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Annual Revenue</Label>
            <Input value={data.annualRevenue} onChange={(e) => onChange({ ...data, annualRevenue: e.target.value })} placeholder="e.g. 1000000" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Employees</Label>
            <Input value={data.numberOfEmployees} onChange={(e) => onChange({ ...data, numberOfEmployees: e.target.value })} placeholder="e.g. 50" disabled={readOnly} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-medium">Address Information</h3>
          {!readOnly && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copyBillingToShipping}>
              Copy Billing to Shipping
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Billing Address</Label>
            <div className="space-y-2">
              <Label>Street</Label>
              <Input value={data.billingStreet} onChange={(e) => onChange({ ...data, billingStreet: e.target.value })} disabled={readOnly} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={data.billingCity} onChange={(e) => onChange({ ...data, billingCity: e.target.value })} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={data.billingState} onChange={(e) => onChange({ ...data, billingState: e.target.value })} disabled={readOnly} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={data.billingCountry} onChange={(e) => onChange({ ...data, billingCountry: e.target.value })} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input value={data.billingZip} onChange={(e) => onChange({ ...data, billingZip: e.target.value })} disabled={readOnly} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
            <div className="space-y-2">
              <Label>Street</Label>
              <Input value={data.shippingStreet} onChange={(e) => onChange({ ...data, shippingStreet: e.target.value })} disabled={readOnly} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={data.shippingCity} onChange={(e) => onChange({ ...data, shippingCity: e.target.value })} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={data.shippingState} onChange={(e) => onChange({ ...data, shippingState: e.target.value })} disabled={readOnly} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={data.shippingCountry} onChange={(e) => onChange({ ...data, shippingCountry: e.target.value })} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input value={data.shippingZip} onChange={(e) => onChange({ ...data, shippingZip: e.target.value })} disabled={readOnly} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="Additional information..." disabled={readOnly} />
      </div>
    </div>
  );
};

interface PaginationData {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<AccountFormData>(emptyForm);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const { toast } = useToast();

  const fetchAccounts = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.itemsPerPage)
      });
      if (searchQuery) params.append("AccountName", searchQuery);
      if (industryFilter) params.append("Industry", industryFilter);

      const res = await fetch(`${BACKEND_BASE_URL}/api/accounts?${params}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error("Failed to fetch accounts");
      const result = await res.json();
      setAccounts(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);
      
      if (result.pagination) {
        setPagination({
          currentPage: result.pagination.currentPage || page,
          totalItems: result.pagination.totalItems || 0,
          totalPages: result.pagination.totalPages || 1,
          itemsPerPage: result.pagination.itemsPerPage || pagination.itemsPerPage,
          hasNextPage: result.pagination.hasNextPage || false,
          hasPrevPage: result.pagination.hasPrevPage || false
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, industryFilter, pagination.itemsPerPage, toast]);

  useEffect(() => {
    fetchAccounts(1);
  }, [searchQuery, industryFilter]); // Reset to page 1 on filter change

  useEffect(() => {
    fetchAccounts(pagination.currentPage);
  }, []); // Initial load

  const fetchAccountDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/accounts/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch account details");
      const result = await res.json();
      const a = result.data;

      const mappedFormData: AccountFormData = {
        accountName: a.AccountName || "",
        phone: a.Phone || "",
        website: a.Website || "",
        industry: a.Industry || "",
        annualRevenue: a.AnnualRevenue || "",
        numberOfEmployees: a.NumberOfEmployees || "",
        billingStreet: a.BillingStreet || "",
        billingCity: a.BillingCity || "",
        billingState: a.BillingState || "",
        billingCountry: a.BillingCountry || "",
        billingZip: a.BillingZip || "",
        shippingStreet: a.ShippingStreet || "",
        shippingCity: a.ShippingCity || "",
        shippingState: a.ShippingState || "",
        shippingCountry: a.ShippingCountry || "",
        shippingZip: a.ShippingZip || "",
        description: a.Description || "",
      };
      setFormData(mappedFormData);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.accountName) {
      toast({ title: "Validation Error", description: "Account Name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/accounts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          AccountName: formData.accountName,
          Phone: formData.phone || null,
          Website: formData.website || null,
          Industry: formData.industry || null,
          AnnualRevenue: formData.annualRevenue || null,
          NumberOfEmployees: formData.numberOfEmployees || null,
          BillingStreet: formData.billingStreet || null,
          BillingCity: formData.billingCity || null,
          BillingState: formData.billingState || null,
          BillingCountry: formData.billingCountry || null,
          BillingZip: formData.billingZip || null,
          ShippingStreet: formData.shippingStreet || null,
          ShippingCity: formData.shippingCity || null,
          ShippingState: formData.shippingState || null,
          ShippingCountry: formData.shippingCountry || null,
          ShippingZip: formData.shippingZip || null,
          Description: formData.description || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create account");
      toast({ title: "Success", description: "Account created successfully." });
      fetchAccounts(pagination.currentPage);
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedAccount || !formData.accountName) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/accounts/${selectedAccount.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          AccountName: formData.accountName,
          Phone: formData.phone || null,
          Website: formData.website || null,
          Industry: formData.industry || null,
          AnnualRevenue: formData.annualRevenue || null,
          NumberOfEmployees: formData.numberOfEmployees || null,
          BillingStreet: formData.billingStreet || null,
          BillingCity: formData.billingCity || null,
          BillingState: formData.billingState || null,
          BillingCountry: formData.billingCountry || null,
          BillingZip: formData.billingZip || null,
          ShippingStreet: formData.shippingStreet || null,
          ShippingCity: formData.shippingCity || null,
          ShippingState: formData.shippingState || null,
          ShippingCountry: formData.shippingCountry || null,
          ShippingZip: formData.shippingZip || null,
          Description: formData.description || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update account");
      toast({ title: "Success", description: "Account updated successfully." });
      fetchAccounts(pagination.currentPage);
      setIsEditOpen(false);
      setSelectedAccount(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/accounts/${selectedAccount.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete account");
      toast({ title: "Success", description: "Account deleted successfully." });
      fetchAccounts(pagination.currentPage);
      setIsDeleteOpen(false);
      setSelectedAccount(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openCreate = () => { setFormData(emptyForm); setIsCreateOpen(true); };
  const openView = async (account: Account) => {
    setSelectedAccount(account);
    setIsViewOpen(true);
    await fetchAccountDetail(account.id);
  };
  const openEdit = async (account: Account) => {
    setSelectedAccount(account);
    setIsEditOpen(true);
    await fetchAccountDetail(account.id);
  };
  const openDelete = (account: Account) => { setSelectedAccount(account); setIsDeleteOpen(true); };

  const goToPreviousPage = () => {
    if (pagination.hasPrevPage && pagination.currentPage > 1) {
      fetchAccounts(pagination.currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage && pagination.currentPage < pagination.totalPages) {
      fetchAccounts(pagination.currentPage + 1);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Accounts</h1>
            <p className="text-muted-foreground">Manage your client accounts and organizations</p>
          </div>
          <Button className="gap-2 gradient-primary text-primary-foreground shadow-glow" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>

        <div className="card-elevated p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-[180px]">
                <Input
                  placeholder="Filter by industry..."
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => fetchAccounts(pagination.currentPage)}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="card-elevated overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading accounts...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-border">
                    <th>Account</th>
                    <th>Industry</th>
                    <th>Contact</th>
                    <th>Website</th>
                    <th>Revenue</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">No accounts found.</td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <Building2 className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{account.accountName}</p>
                              <p className="text-xs text-muted-foreground">{account.accountNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          {account.industry ? (
                            <Badge variant="secondary" className="font-normal">{account.industry}</Badge>
                          ) : "—"}
                        </td>
                        <td>
                          {account.phone ? (
                            <div className="flex items-center gap-2 text-sm">
                              <PhoneIcon className="w-3 h-3 text-muted-foreground" />
                              {account.phone}
                            </div>
                          ) : "—"}
                        </td>
                        <td>
                          {account.website ? (
                            <a href={account.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <Globe className="w-3 h-3" />
                              {account.website.replace(/^https?:\/\//, '')}
                            </a>
                          ) : "—"}
                        </td>
                        <td>
                          {account.annualRevenue ? (
                            <span className="text-sm font-medium">
                              ₹{Number(account.annualRevenue).toLocaleString()}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(account)}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(account)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => openDelete(account)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {accounts.length} of {pagination.totalItems} accounts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={goToPreviousPage}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-medium">{pagination.currentPage}</span>
                <span className="text-sm text-muted-foreground">of {pagination.totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={goToNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CrudDialog
        title="Add New Account"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={handleCreate}
      >
        <FormFields data={formData} onChange={setFormData} />
      </CrudDialog>

      <CrudDialog
        title={`Edit: ${selectedAccount?.accountName}`}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        onSave={handleEdit}
      >
        <FormFields data={formData} onChange={setFormData} isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog
        title="Account Details"
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        mode="view"
      >
        <FormFields data={formData} onChange={() => {}} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Account"
        description={`Are you sure you want to delete ${selectedAccount?.accountName}? This action cannot be undone.`}
      />
    </AppLayout>
  );
}
