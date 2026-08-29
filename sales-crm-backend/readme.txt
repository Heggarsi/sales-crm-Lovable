===========================================================================
README — SALES CRM : LEADS MODULE
===========================================================================

NOTE: This documentation covers ONLY the Leads module. It does not cover
any other module (accounts, contacts, deals, appointments, proposals,
sales orders, users, settings, dashboard, etc.).

---------------------------------------------------------------------------
1. OVERVIEW
---------------------------------------------------------------------------
The Leads module lets team members create, view, update, delete, search,
filter, sort, assign, follow up on, and convert sales leads. It is built
as a full-stack feature:

  - Backend : REST API (Node.js + Express + MySQL) under /api/leads
  - Frontend: A responsive React (Vite + TypeScript + Tailwind + shadcn)
              page at /leads

---------------------------------------------------------------------------
2. TECHNOLOGY STACK (used by the Leads module)
---------------------------------------------------------------------------
BACKEND
  - Node.js + Express 5
  - MySQL (mysql2, promise-based connection pool)
  - express-validator  (request validation)
  - jsonwebtoken       (JWT authentication)
  - morgan / custom logger (request + error logging)

FRONTEND
  - React 18 + TypeScript
  - Vite 5
  - Tailwind CSS (with shadcn/ui-style components: Button, Input,
    Select, Badge, Dialog, DropdownMenu, Avatar, Popover)
  - lucide-react (icons)
  - react-router-dom
  - Native fetch for all API calls (no axios)

---------------------------------------------------------------------------
3. KEY FILES (Leads module only)
---------------------------------------------------------------------------
BACKEND  (sales-crm-backend/)
  src/routes/lead.routes.js          - all /api/leads routes + middleware
  src/controllers/lead.controller.js - HTTP handlers (thin, delegate to service)
  src/services/leadService.js        - business logic (the core of the module)
  src/models/LeadsModel.js           - raw SQL for the leads table
  src/models/LeadSourceModel.js
  src/models/LeadTypeModel.js
  src/models/LeadStatusModel.js
  src/models/LeadServiceRequiredModel.js
  src/models/LeadFollowUpTypeModel.js
  src/models/LeadFollowupModel.js
  src/validations/leadValidation.js  - express-validator rules
  schema.sql                         - leads table schema & constraints

FRONTEND (sales-crm-frontend/)
  src/pages/Leads.tsx                - the entire Leads UI (list + forms +
                                       follow-ups + conversion + actions)
  src/config.ts                      - BACKEND_BASE_URL

---------------------------------------------------------------------------
4. SETUP / INSTALLATION
---------------------------------------------------------------------------
Prerequisites:
  - Node.js (v18+ recommended) and npm
  - MySQL server (default credentials root / empty password, or override)
  - A terminal (commands below use Bash; adapt for Windows PowerShell)

Step 1 — Database
  1) Start your MySQL server.
  2) Create the database (default name: SalesCRMV1):
       CREATE DATABASE IF NOT EXISTS SalesCRMV1;
  3) Import the schema (creates the `leads` table and its lookup tables):
       mysql -u root -p SalesCRMV1 < sales-crm-backend/schema.sql
     On Windows PowerShell, use:
       Get-Content sales-crm-backend/schema.sql | mysql -u root -p SalesCRMV1
  4) (Optional) Run any pending migrations under sales-crm-backend/migrations/
     related to leads, e.g. 002_lead_services_followups.

Step 2 — Backend
  cd sales-crm-backend
  npm install
  cp .env .env.local          (create an env file; see variables below)
  npm run dev                 (nodemon)  or  npm start (node src/server.js)

  Default backend URL: http://localhost:5000

Step 3 — Frontend
  cd sales-crm-frontend
  npm install
  npm run dev                 (Vite dev server)

  Default frontend URL: http://localhost:5173 (or as printed by Vite)

Step 4 — Configure the backend URL (frontend)
  In sales-crm-frontend/src/config.ts set:
      export const BACKEND_BASE_URL = "http://localhost:5000";

---------------------------------------------------------------------------
5. ENVIRONMENT VARIABLES (backend .env)
---------------------------------------------------------------------------
  PORT=5000
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=SalesCRMV1
  DB_PORT=3306
  JWT_SECRET=<your-secret>
  NODE_ENV=development

(Values shown are the defaults already used by the code.)

---------------------------------------------------------------------------
6. LEAD STATUS IDs
---------------------------------------------------------------------------
  NEW              -> 1
  ATTEMPTED_TO_CONTACT -> 2
  CONTACTED        -> 3
  QUALIFIED        -> 4
  UNQUALIFIED      -> 5
  JUNK_LEAD        -> 6

The "Convert Lead" action is only allowed when a lead's status is
QUALIFIED (4).

---------------------------------------------------------------------------
7. ROLES & PERMISSIONS (relevant to leads)
---------------------------------------------------------------------------
ROLES
  1 = Admin
  2 = Sales Manager
  3 = Sales Person

LEAD PERMISSIONS (checked via checkPermission in rbac.middleware)
  create_lead, read_lead, update_lead, delete_lead,
  assign_lead, convert_lead

ACCESS CONTROL RULES
  - Admin / Sales Manager : full access to all leads.
  - Sales Person          : can only access / update / delete / convert
                            leads ASSIGNED to them (ownership enforced in
                            leadService). The list endpoint auto-filters to
                            the sales person's assigned leads.
  - Assignment (POST /api/leads/:id/assign) additionally checks that the
    target user has the Sales Person role.

---------------------------------------------------------------------------
8. RESPONSIVE UI
---------------------------------------------------------------------------
The Leads page is responsive across mobile, tablet, and desktop:
  - < 1024px (lg): leads render as stacked CARDS (no horizontal scroll).
  - >= 1024px (lg): leads render in a data TABLE.
  - All lead actions (view/edit/delete/convert/follow-up/schedule
    appointment) are available on both layouts via the actions menu.
  - The main layout keeps the sidebar always visible (auto-collapsed on
    smaller screens) and hides page-level scrollbars.

===========================================================================
