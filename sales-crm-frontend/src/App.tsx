import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserRoles from "./pages/UserRoles";
import LeadSources from "./pages/LeadSources";
import SourceTypes from "./pages/SourceTypes";
import LeadTypes from "./pages/LeadTypes";
import LeadStatuses from "./pages/LeadStatuses";
import Leads from "./pages/Leads";
import LeadBusinessInfo from "./pages/LeadBusinessInfo";
import LeadQualification from "./pages/LeadQualification";
import Opportunities from "./pages/Opportunities";
import LostOpportunities from "./pages/LostOpportunities";
import Appointments from "./pages/Appointments";
import Proposals from "./pages/Proposals";
import ProposalAppointments from "./pages/ProposalAppointments";
import MOM from "./pages/MOM";
import SalesOrders from "./pages/SalesOrders";
import LostOrders from "./pages/LostOrders";
import ActivityLog from "./pages/ActivityLog";
import AuditLog from "./pages/AuditLog";
import ActivityTypes from "./pages/ActivityTypes";
import AppointmentStatuses from "./pages/AppointmentStatuses";
import OpportunityStages from "./pages/OpportunityStages";
import OpportunityStatuses from "./pages/OpportunityStatuses";
import ProposalStatuses from "./pages/ProposalStatuses";
import PaymentStatuses from "./pages/PaymentStatuses";
import DeliveryStatuses from "./pages/DeliveryStatuses";
import QualificationStatuses from "./pages/QualificationStatuses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/user-roles" element={<UserRoles />} />
          <Route path="/lead-sources" element={<LeadSources />} />
          <Route path="/source-types" element={<SourceTypes />} />
          <Route path="/lead-types" element={<LeadTypes />} />
          <Route path="/lead-statuses" element={<LeadStatuses />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/lead-business-info" element={<LeadBusinessInfo />} />
          <Route path="/lead-qualification" element={<LeadQualification />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/lost-opportunities" element={<LostOpportunities />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/proposal-appointments" element={<ProposalAppointments />} />
          <Route path="/mom" element={<MOM />} />
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/lost-orders" element={<LostOrders />} />
          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/activity-types" element={<ActivityTypes />} />
          <Route path="/appointment-statuses" element={<AppointmentStatuses />} />
          <Route path="/opportunity-stages" element={<OpportunityStages />} />
          <Route path="/opportunity-statuses" element={<OpportunityStatuses />} />
          <Route path="/proposal-statuses" element={<ProposalStatuses />} />
          <Route path="/payment-statuses" element={<PaymentStatuses />} />
          <Route path="/delivery-statuses" element={<DeliveryStatuses />} />
          <Route path="/qualification-statuses" element={<QualificationStatuses />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
