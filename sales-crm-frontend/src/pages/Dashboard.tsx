import {
  Target,
  UserCheck,
  TrendingUp,
  FileText,
  DollarSign,
  XCircle,
  Percent,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { TopPerformers } from "@/components/dashboard/TopPerformers";

export default function Dashboard() {
  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your sales.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Leads"
            value="2,847"
            icon={<Target className="w-6 h-6 text-primary" />}
            change={12.5}
            changeLabel="vs last month"
            variant="primary"
          />
          <KPICard
            title="Qualified Leads"
            value="1,234"
            icon={<UserCheck className="w-6 h-6 text-info" />}
            change={8.2}
            changeLabel="vs last month"
            variant="info"
          />
          <KPICard
            title="Opportunities"
            value="456"
            icon={<TrendingUp className="w-6 h-6 text-success" />}
            change={15.3}
            changeLabel="vs last month"
            variant="success"
          />
          <KPICard
            title="Proposals"
            value="189"
            icon={<FileText className="w-6 h-6 text-warning" />}
            change={-2.4}
            changeLabel="vs last month"
            variant="warning"
          />
        </div>

        {/* Second Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Revenue"
            value="$1.2M"
            icon={<DollarSign className="w-6 h-6 text-success" />}
            change={22.8}
            changeLabel="vs last month"
            variant="success"
          />
          <KPICard
            title="Won Deals"
            value="142"
            icon={<TrendingUp className="w-6 h-6 text-success" />}
            change={18.5}
            changeLabel="vs last month"
            variant="success"
          />
          <KPICard
            title="Lost Deals"
            value="38"
            icon={<XCircle className="w-6 h-6 text-destructive" />}
            change={-5.2}
            changeLabel="vs last month"
          />
          <KPICard
            title="Conversion Rate"
            value="43.2%"
            icon={<Percent className="w-6 h-6 text-primary" />}
            change={3.8}
            changeLabel="vs last month"
            variant="primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadsChart />
          <PipelineChart />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentLeads />
          </div>
          <TopPerformers />
        </div>
      </div>
    </AppLayout>
  );
}
