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

<img width="344" height="1066" alt="14Backendfolder 2026-03-07 151742" src="https://github.com/user-attachments/assets/53bbaf1d-de9e-4dbc-8189-f5b9f7aea3b2" />

## Dashboard

<img width="2140" height="1239" alt="2Dashboard 2026-03-07 145053" src="https://github.com/user-attachments/assets/ab4ea7b4-4903-47e9-a801-f827b6a664cc" />


## Leads Module

<img width="2140" height="1244" alt="3Leads 2026-03-07 145752" src="https://github.com/user-attachments/assets/333333db-c7b6-48f4-9dd3-e1284d7522f0" />
<img width="2141" height="1243" alt="4Leadbusinessinfo2026-03-07 145826" src="https://github.com/user-attachments/assets/5a035e4d-f927-49bb-9255-2a4aa186ae33" />
<img width="2141" height="1244" alt="5Leadqualification2026-03-07 145900" src="https://github.com/user-attachments/assets/2a611155-00fe-4daa-87ca-29e8289e9fa2" />

## Opportunities

<img width="2140" height="1242" alt="6Opportunity 2026-03-07 145934" src="https://github.com/user-attachments/assets/f3972452-6ffb-4791-a992-bbca4d8c0d65" />
<img width="2139" height="1239" alt="7Lostapportunity2026-03-07 145950" src="https://github.com/user-attachments/assets/0b7d816e-10b1-4674-b5fa-7f1094009570" />

## Proposals
<img width="2137" height="1240" alt="8Appointment 2026-03-07 150009" src="https://github.com/user-attachments/assets/a45bb6c2-4af8-4784-9b0d-a79820adedc2" />
<img width="2137" height="1245" alt="9Proposal 2026-03-07 151344" src="https://github.com/user-attachments/assets/82dee5c5-d01e-40d5-a1bc-19696e5fc83e" />

## Sales Orders

<img width="2140" height="1246" alt="10Salesorder 2026-03-07 151414" src="https://github.com/user-attachments/assets/32002d70-e310-4479-a270-202ef7208bba" />
<img width="2136" height="1243" alt="11Lostorder 2026-03-07 151451" src="https://github.com/user-attachments/assets/5690061a-bb75-47b1-8de2-ad68b5022f9c" />


## Activity

<img width="2136" height="1243" alt="12Activity 2026-03-07 151519" src="https://github.com/user-attachments/assets/e05a2f0c-0ae0-41ea-8963-d4042ca7a623" />

## Users

<img width="2140" height="1243" alt="13Users 2026-03-07 145720" src="https://github.com/user-attachments/assets/658001fd-bc11-4ec5-b8a4-708f4dc22147" />


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

## 🚧 Project Status

The backend API for the CRM system has been fully implemented.

Frontend development is currently in progress.  
At the moment, **backend API integration has been completed for the Users page**, and the remaining pages will be integrated with the backend APIs in upcoming updates.

This repository currently focuses on demonstrating the **complete backend architecture and API design**, along with the frontend structure for the CRM dashboard.


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
