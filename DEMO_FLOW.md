# Le'Kiray ERP — Demo Flow

> Step-by-step walkthrough for demo and internal testing

---

## Demo Login Credentials

All passwords: **`Password123!`**

| Role | Email |
|------|-------|
| CEO / Owner | `ceo@abcconstruction.com` |
| Project Manager | `pm@abcconstruction.com` |
| Fleet Manager | `fleet@abcconstruction.com` |
| Inventory Manager | `inventory@abcconstruction.com` |
| HR Manager | `hr@abcconstruction.com` |
| Finance Officer | `finance@abcconstruction.com` |
| Site Manager | `site@abcconstruction.com` |

---

## Demo Company

**ABC Construction PLC**  
Country: Ethiopia | Currency: ETB

### Active Projects
| Project | Client | Budget | Status |
|---------|--------|--------|--------|
| Bole Road Expansion | AACRA | ETB 85,000,000 | Active |
| Hawassa Housing Project | ECWC | ETB 120,000,000 | Active |
| Dire Dawa Water Pipeline | DDWSA | ETB 45,000,000 | On Hold |

---

## Flow 1: CEO Visibility Demo

> Login as CEO: `ceo@abcconstruction.com` / `Password123!`

### Step 1 — Open CEO Dashboard
- Navigate to `/dashboard`
- See KPIs: active projects, fleet status, today's fuel cost, inventory value, attendance, pending reports
- Check alert panels: low stock items, pending fuel approvals, maintenance issues

### Step 2 — View Active Projects
- Click **Projects & Sites** in sidebar
- See 3 projects (Bole Road, Hawassa Housing, Dire Dawa Pipeline)
- Click **Bole Road Expansion** → view project detail

### Step 3 — Open Project Detail
- See project metadata: client, budget, status, manager
- See assigned machines section
- See sites: Olympia Junction Site, Rwanda Traffic Circle Site

### Step 4 — Check Machinery Fleet
- Navigate to `/dashboard/machinery`
- See 5 machines: CAT 320D Excavator (Active), Volvo L90 Loader (Active), Sinotruk Dump Truck (Active), CAT 140H Grader (Under Maintenance), Sany Concrete Mixer (Idle)
- Click **CAT 320D Excavator** → see fuel history, maintenance history, current assignment

### Step 5 — View Fuel Usage
- Navigate to `/dashboard/fuel`
- See issued fuel requests and fuel logs
- One request Pending approval from Sinotruk Dump Truck

### Step 6 — Check Inventory
- Navigate to `/dashboard/inventory`
- See items with Low Stock alert (Electric Cable 4mm) and Out of Stock (Waterproofing Chemical)
- See pending material requests

### Step 7 — Check HR Attendance
- Navigate to `/dashboard/hr`
- See today's attendance register: 14 present, 1 absent, 1 on leave
- See leave requests: Tigist Worku (Approved Sick Leave)

### Step 8 — Review Daily Site Reports
- Navigate to `/dashboard/reports`
- See 4 reports: 1 Approved, 1 Submitted, 1 Draft, 1 Rejected
- Click the Approved report (Bole Road / Olympia Junction)

### Step 9 — Open Maintenance Management
- Navigate to `/dashboard/maintenance`
- See active CAT 320D hydraulic hose repair (Urgent / In Progress)
- See CAT 140H grader engine overhaul (Critical / In Progress)
- See Volvo L90 500-hour service (Scheduled)

### Step 10 — Finance Overview
- Navigate to `/dashboard/finance`
- See expense summary across projects
- Navigate to `/dashboard/finance/projects` → see budget utilization per project
- Navigate to `/dashboard/finance/profitability` → see gross margin estimates

---

## Flow 2: Operational Workflow Demo

> Shows a full end-to-end operational day for a contractor

### Step 1 — Create New Project
- Go to `/dashboard/projects`
- Click **+ New Project**
- Fill: Project Name, Client, Budget, Start Date, Location
- Save project

### Step 2 — Add Site to Project
- Open the new project
- Click **Add Site**
- Fill: Site Name, Location, Site Manager
- Save site

### Step 3 — Register Machine
- Go to `/dashboard/machinery`
- Click **+ Add Machine**
- Fill: Machine Type, Brand, Model, Plate Number, Ownership Type
- Save machine

### Step 4 — Assign Machine to Site
- Open the machine
- Click **Assign to Site**
- Select project and site
- Set start date and operator
- Save assignment

### Step 5 — Submit Fuel Request
> Login as Site Manager: `site@abcconstruction.com`

- Go to `/dashboard/fuel`
- Click **+ New Request**
- Select machine, project, site
- Enter liters and purpose
- Submit request

### Step 6 — Approve Fuel Request
> Login as Fleet Manager: `fleet@abcconstruction.com`

- Go to `/dashboard/fuel` → Pending Requests tab
- Find the new request
- Click **Approve**
- Enter approved liters

### Step 7 — Issue Fuel
- On the approved request
- Click **Issue Fuel**
- Fill dispenser info and confirm

### Step 8 — Record Attendance
> Login as HR Manager: `hr@abcconstruction.com`

- Go to `/dashboard/hr/attendance`
- Click **+ Record Attendance**
- Select site and date
- Mark each employee as Present/Late/Absent/On Leave

### Step 9 — Create Daily Site Report
> Login as Site Manager

- Go to `/dashboard/reports`
- Click **+ New Report**
- Select project and site
- Fill: work completed, workers present, machinery used, fuel used, issues
- Submit report

### Step 10 — Create Maintenance Record
> Login as Fleet Manager

- Go to `/dashboard/maintenance`
- Click **+ New Record**
- Select machine and issue type
- Fill: issue title, description, priority
- Save and assign mechanic

### Step 11 — Record Expense
> Login as Finance Officer: `finance@abcconstruction.com`

- Go to `/dashboard/finance/expenses`
- Click **+ New Expense**
- Fill: category, amount, vendor, project, date
- Submit for approval

### Step 12 — Approve Expense
> Login as CEO

- Go to `/dashboard/finance/expenses`
- Find the pending expense
- Click **Approve**

### Step 13 — Verify CEO Dashboard Updates
- Navigate to `/dashboard`
- Confirm KPI cards have updated values
- Check that the new project, machines, fuel cost, and expense appear

---

## Flow 3: Role Permission Test

> Verify each role only sees what they should

| Action | CEO | PM | Fleet | Inventory | HR | Finance | Site |
|--------|-----|----|----|-----------|----|---------|----|
| View all projects | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve fuel | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Stock out inventory | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Record attendance | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Approve expenses | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View profitability | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Submit daily report | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Known Demo Limitations (MVP)

- No real-time notifications (polling only via page reload)
- Finance Lite does not include payroll or VAT
- No file upload for receipts or report photos (UI shows placeholder)
- Settings page is read-only (no password change UI)
- No email notifications for approvals
- Audit log viewer is in v2.0 roadmap
