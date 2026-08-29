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
import LeadServicesRequired from "./pages/LeadServicesRequired";
import LeadFollowUpTypes from "./pages/LeadFollowUpTypes";
import Leads from "./pages/Leads";
import Accounts from "./pages/Accounts";
import Contacts from "./pages/Contacts";
import Deals from "./pages/Deals";
import DealStages from "./pages/DealStages";
import Appointments from "./pages/Appointments";
import LeadAppointments from "./pages/LeadAppointments";
import ContactAppointments from "./pages/ContactAppointments";
import Proposals from "./pages/Proposals";
import SalesOrders from "./pages/SalesOrders";
import LostOrders from "./pages/LostOrders";
import ActivityLog from "./pages/ActivityLog";
import AuditLog from "./pages/AuditLog";
import ActivityTypes from "./pages/ActivityTypes";
import AppointmentStatuses from "./pages/AppointmentStatuses";
import ProposalStatuses from "./pages/ProposalStatuses";
import PaymentStatuses from "./pages/PaymentStatuses";
import DeliveryStatuses from "./pages/DeliveryStatuses";
import Settings from "./pages/Settings";
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
          <Route path="/lead-services-required" element={<LeadServicesRequired />} />
          <Route path="/lead-followup-types" element={<LeadFollowUpTypes />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/deal-stages" element={<DealStages />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/lead-appointments" element={<LeadAppointments />} />
          <Route path="/contact-appointments" element={<ContactAppointments />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/lost-orders" element={<LostOrders />} />
          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/activity-types" element={<ActivityTypes />} />
          <Route path="/appointment-statuses" element={<AppointmentStatuses />} />
          <Route path="/proposal-statuses" element={<ProposalStatuses />} />
          <Route path="/payment-statuses" element={<PaymentStatuses />} />
          <Route path="/delivery-statuses" element={<DeliveryStatuses />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
