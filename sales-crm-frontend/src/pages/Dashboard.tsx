import { useState, useEffect } from "react";
import {
  Target,
  UserCheck,
  TrendingUp,
  FileText,
  DollarSign,
  XCircle,
  Percent,
  Calendar,
  Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { RecentClosedDeals } from "@/components/dashboard/RecentClosedDeals";
import { TopPerformers } from "@/components/dashboard/TopPerformers";
import { BACKEND_BASE_URL } from "@/config";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_BASE_URL}/api/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading dashboard statistics...</p>
        </div>
      </AppLayout>
    );
  }

  const kpis = data?.kpis || {};

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${parseFloat((val / 10000000).toFixed(2)).toString()}Cr`;
    if (val >= 100000) return `₹${parseFloat((val / 100000).toFixed(2)).toString()}L`;
    if (val >= 1000) return `₹${parseFloat((val / 1000).toFixed(2)).toString()}K`;
    return `₹${val}`;
  };

  return (
    <AppLayout>
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
            value={kpis.totalLeads?.value.toLocaleString() || "0"}
            icon={<Target className="w-6 h-6 text-primary" />}
            change={kpis.totalLeads?.change || 0}
            changeLabel="vs last month"
            variant="primary"
          />
          <KPICard
            title="Qualified Leads"
            value={kpis.qualifiedLeads?.value.toLocaleString() || "0"}
            icon={<UserCheck className="w-6 h-6 text-info" />}
            change={kpis.qualifiedLeads?.change || 0}
            changeLabel="vs last month"
            variant="info"
          />
          <KPICard
            title="Opportunities"
            value={kpis.opportunities?.value.toLocaleString() || "0"}
            icon={<TrendingUp className="w-6 h-6 text-success" />}
            change={kpis.opportunities?.change || 0}
            changeLabel="vs last month"
            variant="success"
          />
          <KPICard
            title="Proposals"
            value={kpis.proposals?.value.toLocaleString() || "0"}
            icon={<FileText className="w-6 h-6 text-warning" />}
            change={kpis.proposals?.change || 0}
            changeLabel="vs last month"
            variant="warning"
          />
        </div>

        {/* Second Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Revenue"
            value={formatCurrency(kpis.revenue?.value || 0)}
            icon={<div className="text-success text-2xl">₹</div>}
            change={kpis.revenue?.change || 0}
            changeLabel="vs last month"
            variant="success"
          />
          <KPICard
            title="Won Deals"
            value={kpis.wonDeals?.value.toLocaleString() || "0"}
            icon={<TrendingUp className="w-6 h-6 text-success" />}
            change={kpis.wonDeals?.change || 0}
            changeLabel="vs last month"
            variant="success"
          />
          <KPICard
            title="Lost Deals"
            value={kpis.lostDeals?.value.toLocaleString() || "0"}
            icon={<XCircle className="w-6 h-6 text-destructive" />}
            change={kpis.lostDeals?.change || 0}
            changeLabel="vs last month"
          />
          <KPICard
            title="Conversion Rate"
            value={`${kpis.conversionRate?.value || 0}%`}
            icon={<Percent className="w-6 h-6 text-primary" />}
            change={kpis.conversionRate?.change || 0}
            changeLabel="vs last month"
            variant="primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadsChart data={data?.leadPerformance} />
          <PipelineChart data={data?.pipeline} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentClosedDeals data={data?.recentClosedDeals} />
          </div>
          <TopPerformers data={data?.topPerformers} />
        </div>
      </div>
    </AppLayout>
  );
}
