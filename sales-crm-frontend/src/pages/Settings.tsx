import { 
  Shield, 
  Activity, 
  UserCheck, 
  ListFilter, 
  Tag, 
  CheckSquare, 
  Layers, 
  Calendar, 
  FileText, 
  CreditCard, 
  Truck,
  Wrench,
  PhoneCall,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface SettingItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

function SettingItem({ title, description, icon, path }: SettingItemProps) {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(path)}
      className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all self-center" />
      
      {/* Subtle hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "general";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <SettingsIcon className="w-8 h-8 text-primary" />
              </div>
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your CRM configurations, audit logs, and module lookups.
            </p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">

          <TabsContent value="general" className="space-y-4 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingItem 
                title="Audit Log" 
                description="View system-wide audit trails and track all data changes." 
                icon={<Shield className="w-5 h-5" />} 
                path="/audit-log"
              />
              <SettingItem 
                title="Activity Log" 
                description="Monitor user activities and system interactions." 
                icon={<Activity className="w-5 h-5" />} 
                path="/activity-log"
              />
            </div>
            
            <Card className="mt-8 border-none shadow-premium bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg">System Information</CardTitle>
                <CardDescription>Advanced system configurations and monitoring tools.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                These settings allow you to monitor the health and security of your CRM system. 
                Only administrators have access to these logs.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="module" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SettingItem 
                title="User Roles" 
                description="Define and manage system access levels." 
                icon={<UserCheck className="w-5 h-5" />} 
                path="/user-roles"
              />
              <SettingItem 
                title="Lead Sources" 
                description="Configure where your leads are coming from." 
                icon={<ListFilter className="w-5 h-5" />} 
                path="/lead-sources"
              />
              <SettingItem 
                title="Source Types" 
                description="Categorize different types of lead sources." 
                icon={<Tag className="w-5 h-5" />} 
                path="/source-types"
              />
              <SettingItem 
                title="Lead Types" 
                description="Manage different categories of leads." 
                icon={<Tag className="w-5 h-5" />} 
                path="/lead-types"
              />
              <SettingItem 
                title="Lead Statuses" 
                description="Define the lifecycle stages of a lead." 
                icon={<CheckSquare className="w-5 h-5" />} 
                path="/lead-statuses"
              />
              <SettingItem 
                title="Services Required" 
                description="Manage the services a lead may require." 
                icon={<Wrench className="w-5 h-5" />} 
                path="/lead-services-required"
              />
              <SettingItem 
                title="Follow-Up Types" 
                description="Configure lead follow-up types." 
                icon={<PhoneCall className="w-5 h-5" />} 
                path="/lead-followup-types"
              />
              <SettingItem 
                title="Deal Stages" 
                description="Customize your sales pipeline stages." 
                icon={<Layers className="w-5 h-5" />} 
                path="/deal-stages"
              />
              <SettingItem 
                title="Activity Types" 
                description="Define types of interactions (Call, Email, etc.)." 
                icon={<Activity className="w-5 h-5" />} 
                path="/activity-types"
              />
              <SettingItem 
                title="Appointment Statuses" 
                description="Manage statuses for scheduled meetings." 
                icon={<Calendar className="w-5 h-5" />} 
                path="/appointment-statuses"
              />
              <SettingItem 
                title="Proposal Statuses" 
                description="Track the progress of your business proposals." 
                icon={<FileText className="w-5 h-5" />} 
                path="/proposal-statuses"
              />
              <SettingItem 
                title="Payment Statuses" 
                description="Configure payment tracking statuses." 
                icon={<CreditCard className="w-5 h-5" />} 
                path="/payment-statuses"
              />
              <SettingItem 
                title="Delivery Statuses" 
                description="Manage product or service delivery stages." 
                icon={<Truck className="w-5 h-5" />} 
                path="/delivery-statuses"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
}
