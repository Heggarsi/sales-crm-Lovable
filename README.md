# Sales CRM System

A **full-stack Sales CRM (Customer Relationship Management) application** designed to manage the entire sales lifecycle — from **lead generation to sales order completion**.

This project demonstrates a **real-world CRM workflow used by sales teams**, including lead management, opportunity tracking, proposal handling, meeting records, and sales order processing.

The system is built with a **scalable backend architecture** and a **modern frontend interface**, focusing on **security, modular design, and maintainability**.

---

# 📌 Project Overview

The CRM allows sales teams to **manage and track their sales pipeline efficiently**.

### Key capabilities include:

- Lead management  
- Opportunity tracking  
- Proposal management with file uploads  
- Meeting tracking (MOM)  
- Sales order processing  
- Lost opportunity tracking  
- Activity logging  
- Dashboard analytics  
- Role-based access control  

### User Roles

The application supports different roles:

- **Admin**
- **Sales Manager**
- **Sales Person**

Each role has different **access levels and permissions** within the system.

---

# 🚀 How This Project Started

This project was inspired by a **DBMS learning activity** from a business course on **trueconfluencehub.com**.

During the course, there was a small exercise to **design an Entity Relationship Diagram (ERD) for a sales process**.

That simple ERD exercise inspired the idea to convert the model into a **fully functional Sales CRM system**.

From that point, the project gradually evolved into a **complete backend API and frontend CRM dashboard**.

Special thanks to **trueconfluencehub.com** for providing such a **practical and detailed business course** that encourages applying concepts to real-world software systems.

If you're interested in **business systems, data modeling, or CRM workflows**, their courses are highly recommended.

---

# 🏗 System Architecture

The backend follows a **clean layered architecture**:

Controllers → Services → Models → Database

### Benefits of this architecture

- Separation of concerns  
- Maintainable codebase  
- Scalable structure for future modules  

---

# ⚙️ Backend

The backend provides a **REST API** that powers the CRM system.

## Tech Stack

- Node.js  
- Express 5  
- MySQL2  
- JWT Authentication  
- bcrypt  
- Morgan logging  

---

## 🔐 Security

- Helmet for secure HTTP headers  
- CORS configuration  
- Rate limiting  
- Password hashing using bcrypt  
- JWT **Access + Refresh Tokens**  
- **Role-Based Access Control (RBAC)**  

### Roles supported

- Admin  
- Sales Manager  
- Sales Person  

---

## 📦 Backend Modules

### Authentication

- Login  
- Refresh token  
- Change password  
- Forgot password  

### Lead Management

- Leads  
- Lead Business Information  
- Lead Qualification  

### Sales Pipeline

- Opportunities  
- Lost Opportunities  

### Meetings

- Appointments  
- MOM (Minutes of Meeting)

### Sales Process

- Proposals *(with file upload support)*  
- Sales Orders  
- Lost Orders  

### System Monitoring

- Activity Log  
- Audit Log  

### Analytics

- Dashboard endpoints  
- Sales metrics  
- Pipeline tracking  

---

## Backend Features

- Express async error handling using **express-async-handler**  
- Centralized error handling middleware  
- Morgan request logging  
- Custom logger implementation  
- Modular folder structure  

---

# 🎨 Frontend

The frontend provides a **modern CRM dashboard interface** for interacting with the backend APIs.

The UI was developed using **vibe coding with the Lovable tool**, enabling rapid prototyping and UI generation.

---

## Tech Stack

- React 18  
- TypeScript  
- Vite  

---

## UI Framework

- shadcn/ui  
- Radix UI  
- Tailwind CSS  

---

## Data Handling

- TanStack Query (React Query)  
- React Hook Form  
- Zod validation  

---

## Data Visualization

**Recharts** is used for:

- KPI dashboards  
- Lead analytics  
- Sales pipeline charts  

---

## Frontend Features

- 30+ application pages  
- Role-based navigation  
- Breadcrumb navigation  
- Dashboard analytics  
- Dark mode support *(next-themes)*  
- Responsive UI design  
- Accessible UI components  

---

# 📸 Screenshots

## Backend Architecture


## Dashboard



## Leads Module


## Opportunities


## Proposals


## Sales Orders


## Analytics Dashboard


---

# 🧰 Tech Stack Summary

## Backend

- Node.js  
- Express 5  
- MySQL2  
- JWT Authentication  
- bcrypt  
- Morgan  

## Frontend

- React 18  
- TypeScript  
- Vite  
- Tailwind CSS  
- shadcn/ui  
- Radix UI  

## Libraries

- TanStack Query  
- React Hook Form  
- Zod  
- Recharts  

---

# 📚 Learning Outcomes

Through this project, I explored:

- Designing a scalable backend architecture  
- Implementing role-based authentication systems  
- Managing a complex relational database  
- Building a multi-module CRM workflow  
- Creating modern React dashboards  
- Integrating analytics and charts  
- Structuring large full-stack applications  

---

# 🔮 Future Improvements

Possible improvements include:

- Email notification system  
- Sales forecasting analytics  
- Advanced reporting system  
- CRM workflow automation  
- Multi-tenant support  
- Deployment with Docker and CI/CD  

---

# 🙏 Acknowledgements

This project was inspired by a **DBMS for Business course from**

**trueconfluencehub.com**

The course provided valuable insights into **business data modeling and real-world system design**, which helped inspire the foundation of this CRM system.

---

# 📄 License

This project is for **educational and portfolio purposes**.
