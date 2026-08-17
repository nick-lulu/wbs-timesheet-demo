"use client";

import { useEffect, useMemo, useState } from "react";

type View = "flow" | "dashboard" | "create" | "allocation" | "timesheet" | "audit";
type Role = "CCB" | "PgM" | "Vendor PM";
type Project = {
  code: string; name: string; track: string; domain: string; owner: string; pm: string;
  vendors: string; initiative: string; goal: string; startDate: string; dueDate: string;
  brdSignoffDate?: string; techReleaseDate?: string;
  stage: string; status: string; pgmComplete: boolean; locked: boolean;
};
type Entry = {
  id: number; code: string; project: string; epic: string; vendor: string;
  person: string; hours: number; week: string; status: string;
};
type AllocationRecord = {
  id: number; code: string; project: string; vendor: string;
  total: number; updated: string; status: string;
};
type AppState = { projects: Project[]; entries: Entry[]; allocations: AllocationRecord[] };

const CURRENT_VENDOR = "VT";
const STORAGE_KEY = "corporate-solution-timesheet-v6";
const DEMO_CCB_EMAIL = "jackyzhong@lululemon.com";
const DEMO_CCB_PASSWORD = "123";

const seed: AppState = {
  projects: [
    { code: "CSCOP-417-2", name: "Service Center", track: "Delivery · CSCOP-2", domain: "Fulfillment", owner: "Alice Lang", pm: "Liz Li", vendors: "VT, Baison", initiative: "Service Center Transformation", goal: "Fulfillment delivery excellence", startDate: "2026-01-15", dueDate: "2026-09-30", brdSignoffDate: "2026-03-24", techReleaseDate: "2026-05-18", stage: "GW3 · Development", status: "In progress", pgmComplete: true, locked: false },
    { code: "CSCOP-418-1", name: "Service Center Discovery", track: "Discovery · CSCOP-1", domain: "Fulfillment", owner: "Alice Lang", pm: "Liz Li", vendors: "VT", initiative: "Service Center Transformation", goal: "Fulfillment delivery excellence", startDate: "2026-01-05", dueDate: "2026-04-30", brdSignoffDate: "2026-02-20", techReleaseDate: "", stage: "GW2 · Feasibility", status: "In progress", pgmComplete: true, locked: false },
    { code: "CSCOP-108-1", name: "Weather Alert", track: "Discovery · CSCOP-1", domain: "Corporate", owner: "Bingbing Zhao", pm: "Iris Jin", vendors: "VT, Baison", initiative: "Weather Resilience", goal: "Improve proactive operational awareness", startDate: "2026-02-01", dueDate: "2026-05-31", brdSignoffDate: "2026-03-12", techReleaseDate: "", stage: "GW2 · Feasibility", status: "BRD Signed & Locked", pgmComplete: true, locked: true },
    { code: "CSCOP-965-2", name: "OTB Report CR", track: "Delivery · CSCOP-2", domain: "MP&A", owner: "Hong Min", pm: "Ada Yu", vendors: "Inspire, EY", initiative: "OTB Planning Modernization", goal: "Increase planning accuracy", startDate: "2026-03-01", dueDate: "2026-10-15", brdSignoffDate: "2026-04-10", techReleaseDate: "2026-09-25", stage: "GW4 · Deploy", status: "In progress", pgmComplete: true, locked: false },
    { code: "CSCOP-1027", name: "Keystone R1 – Regression Testing Support", track: "PgM path required", domain: "Upstream SCM&MDM", owner: "Aki Zhu", pm: "Aki", vendors: "MAI, Hand, Softtek", initiative: "", goal: "", startDate: "", dueDate: "", brdSignoffDate: "", techReleaseDate: "", stage: "GW1 · Intake", status: "PgM setup required", pgmComplete: false, locked: false },
  ],
  allocations: [
    { id: 1, code: "CSCOP-417-2", project: "Service Center", vendor: "VT", total: 121.5, updated: "12 Aug 2026", status: "Submitted" },
    { id: 2, code: "CSCOP-417-2", project: "Service Center", vendor: "Baison", total: 84.25, updated: "11 Aug 2026", status: "Submitted" },
    { id: 3, code: "CSCOP-965-2", project: "OTB Report CR", vendor: "EY", total: 96, updated: "09 Aug 2026", status: "Submitted" },
  ],
  entries: [
    { id: 1, code: "CSCOP-417-2", project: "Service Center", epic: "3.2 · Development by Feature", vendor: "VT", person: "John Lee", hours: 40, week: "10–14 Aug 2026", status: "Submitted" },
    { id: 2, code: "CSCOP-108-1", project: "Weather Alert", epic: "2.2 · Initiative Solution Design", vendor: "VT", person: "Emily Wang", hours: 36, week: "10–14 Aug 2026", status: "Submitted" },
    { id: 3, code: "CSCOP-965-2", project: "OTB Report CR", epic: "4.1 · Cutover Plan", vendor: "EY", person: "Ada Yu", hours: 32, week: "03–07 Aug 2026", status: "Submitted" },
    { id: 4, code: "CSCOP-417-2", project: "Service Center", epic: "6.1 · Cross-team Communication", vendor: "Internal", person: "Iris Jin", hours: 8, week: "10–14 Aug 2026", status: "Submitted" },
  ],
};

const normalizeState = (value: AppState): AppState => ({
  projects: (value.projects || []).map(project => ({
    ...project,
    initiative: project.initiative || "",
    goal: project.goal || "",
    startDate: project.startDate || "",
    dueDate: project.dueDate || "",
    brdSignoffDate: project.brdSignoffDate || "",
    techReleaseDate: project.techReleaseDate || "",
  })),
  entries: value.entries || [],
  allocations: (value.allocations || []).map(record => ({ ...record, total: Number(Number(record.total || 0).toFixed(2)) })),
});

const md = (value: number) => Number(value || 0).toFixed(2);

const nav: { id: View; label: string; icon: string; section: string }[] = [
  { id: "dashboard", label: "Project Dashboard", icon: "▦", section: "Overview" },
  { id: "flow", label: "Closed-loop Flow", icon: "↻", section: "Overview" },
  { id: "create", label: "Create CSCOP Path", icon: "+", section: "Planning" },
  { id: "allocation", label: "Manday Allocation", icon: "▤", section: "Planning" },
  { id: "timesheet", label: "Actual Timesheet", icon: "◷", section: "Execution" },
  { id: "audit", label: "Project Audit & Lock", icon: "▣", section: "Governance" },
];

const roleNames: Record<Role, string> = { CCB: "Jacky — CCB", PgM: "Iris — PgM", "Vendor PM": "John — VT Vendor PM" };
const identities: Record<Role, { name: string; vendor: string }> = {
  CCB: { name: "Jacky Zhong", vendor: "Internal" },
  PgM: { name: "Iris Jin", vendor: "Internal" },
  "Vendor PM": { name: "John Lee", vendor: CURRENT_VENDOR },
};
const domainOwners: Record<string, string> = { Corporate: "Bingbing Zhao", "MP&A": "Hong Min", "Upstream SCM&MDM": "Aki Zhu", Fulfillment: "Alice Lang", Ops: "Ryan Xu" };
const domainAssignedPms: Record<string, string> = { Corporate: "Iris Jin", "MP&A": "Ada Yu", "Upstream SCM&MDM": "Aki", Fulfillment: "Liz Li", Ops: "Nick Han" };
const vendorOptions = ["VT", "Baison", "Inspire", "EY", "MAI", "Hand", "Softtek"];
const epics = [
  ["Pre-GW1", ["1.1 · Intake Assignment", "1.2 · Discovery WBS", "1.3 · BRD – Business Requirement", "1.4 · Hi-Level Solution", "1.5 · Discovery SOW"]],
  ["GW1 → GW2", ["2.1 · PRD – Product Requirement", "2.2 · ISD – Initiative Solution Design", "2.3 · SRE – Reliable Evaluating", "2.4 · CSbD – Cyber Security by Design", "2.7 · FSD – Feature Solution Design"]],
  ["GW2 → GW3", ["3.1 · Environment Setup", "3.2 · Development by Feature", "3.3 · SIT – System Integration Testing", "3.4 · TUAT – Tech User Acceptance Test", "3.5 · Penetration Test", "3.6 · Performance Test", "3.7 · BUAT – Business User Acceptance", "3.8 · FUAT – Final User Acceptance", "3.9 · CSbD Review"]],
  ["GW3 → GW4", ["4.1 · Cutover Plan", "4.2 · CAB Approval", "4.3 · Tech Release"]],
  ["GW4 → GW5", ["5.1 · Hypercare", "5.2 · Dry Run", "5.3 · Business Go-live", "5.4 · System Operation Handover", "5.5 · Project Closure"]],
  ["All Stages", ["6.1 · Cross-team Communication", "0.1 · Program Portfolio Management"]],
] as const;

const projectVendors = (project: Project) => project.vendors.split(",").map(v => v.trim());
const canVendorSee = (project: Project) => projectVendors(project).includes(CURRENT_VENDOR);
const dashboardStatus = (project: Project) => project.locked ? "BRD Signed & Locked" : project.status.toLowerCase() === "done" || project.stage.toLowerCase().includes("closure") ? "Done" : "In Progress";
const tone = (value: string) => value.toLowerCase().includes("lock") ? "purple" : value.toLowerCase().includes("progress") || value.includes("Submitted") ? "blue" : value.includes("Complete") ? "green" : "amber";
const auditPhase = (project: Project) => {
  const stage = project.stage.toUpperCase();
  if (stage.includes("GW5")) return { gateway: "GW5", label: "Handover Phase", tone: "purple" };
  if (stage.includes("GW4")) return { gateway: "GW4", label: "Deploy", tone: "green" };
  if (stage.includes("GW3")) return { gateway: "GW3", label: "Development", tone: "blue" };
  if (stage.includes("GW2")) return { gateway: "GW2", label: "Feasibility", tone: "amber" };
  return { gateway: "GW1", label: "Intake", tone: "gray" };
};

function Pill({ children, tone: pillTone = "gray" }: { children: React.ReactNode; tone?: string }) { return <span className={`pill ${pillTone}`}>{children}</span>; }
function Toast({ text }: { text: string }) { return text ? <div className="toast">✓ {text}</div> : null; }

function RoleLogin({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  return <div className="login-role"><label htmlFor="login-role">Logged in as</label><div className="login-role-select"><select id="login-role" value={role} onChange={event => onChange(event.target.value as Role)}><option value="CCB">Jacky — CCB</option><option value="PgM">Iris — PgM</option><option value="Vendor PM">John — VT Vendor PM</option></select></div><small>Menu and records update by role</small></div>;
}

function SignIn({ onSignIn }: { onSignIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setMessage("Enter your username and password to continue.");
      return;
    }
    if (username.trim().toLowerCase() !== DEMO_CCB_EMAIL.toLowerCase() || password !== DEMO_CCB_PASSWORD) {
      setMessage("Incorrect email or password. Please use the demo CCB account shown below.");
      return;
    }
    onSignIn();
  };
  return <main className="sign-in-page"><section className="sign-in-card"><div className="sign-in-logo-wrap"><img className="sign-in-logo" src="./lululemon-logo.png" alt="lululemon" /></div><h1>Corporate Solution Timesheet</h1><form className="sign-in-form" onSubmit={submit}><label>Username or email address<input autoFocus autoComplete="username" value={username} onChange={event => { setUsername(event.target.value); setMessage(""); }} placeholder={DEMO_CCB_EMAIL} /></label><label><span className="sign-in-password-head"><span>Password</span><button type="button" onClick={() => setMessage("Please contact Corporate Solution support to reset your password.")}>Forgot password?</button></span><input type="password" autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setMessage(""); }} placeholder="Enter password" /></label>{message && <p className="sign-in-message" role="alert">{message}</p>}<button className="sign-in-submit" type="submit">Sign in</button></form></section></main>;
}

function Topbar({ title, role }: { title: string; role: Role }) {
  return <header className="topbar"><div><div className="eyebrow">Corporate Solution Timesheet · FY26</div><h1>{title}</h1></div><div className="top-actions"><div className="role-identity active-role"><span>{roleNames[role]}</span><small>{role === "Vendor PM" ? "VT workspace" : "Role-specific workspace"}</small></div><div className="avatar">{identities[role].name.split(" ").map(part => part[0]).join("")}</div></div></header>;
}

function Flow({ open }: { open: (view: View) => void }) {
  return <div className="page flow-page"><section className="hero-card"><div><Pill tone="blue">FY26 operating model</Pill><h2>One Initiative.<br />Multiple connected projects.</h2><p>Jira CSCOP, CCB project setup, PgM lifecycle governance, Vendor planning and actual effort remain connected.</p></div><div className="hero-stat"><span>Operating roles</span><strong>3</strong><small>CCB · PgM · Vendor PM</small><div className="mini-bars"><i /><i /><i /><i /><i /></div></div></section><section className="flow-fixed-board"><div className="flow-fixed-steps"><div className="fixed-step dark"><small>JIRA</small><b>Parent CSCOP exists</b><p>Example: CSCOP-1028</p></div><button className="fixed-step mint" onClick={() => open("create")}><small>CCB</small><b>Create project master</b><p>Domain · Owner · PM · Vendor List</p></button><div className="fixed-step violet"><small>PgM</small><b>Create -1 or -2 path</b><p>Initiative · Project · Goal · Dates</p></div><div className="fixed-step blue"><small>Vendor PM</small><b>Submit Manday plan</b><p>Two-decimal MD · Assigned projects only</p></div><div className="fixed-step amber"><small>EXECUTION</small><b>Submit Actual Time</b><p>Roll up by Project and Initiative</p></div></div><button className="timesheet-parallel" onClick={() => open("dashboard")}><span>●</span><div><b>Project View manages execution · Initiative View manages portfolio</b><p>One Initiative can contain multiple CSCOP projects.</p></div><strong>Open dashboard →</strong></button></section></div>;
}

function ProjectDetail({ project, role, allocations, back }: { project: Project; role: Role; allocations: AllocationRecord[]; back: () => void }) {
  const phase = auditPhase(project);
  const visibleAllocations = role === "Vendor PM" ? allocations.filter(item => item.vendor === CURRENT_VENDOR) : allocations;
  return <div className="page"><button className="back-link" onClick={back}>← Project Dashboard</button><section className="project-banner"><div><div className="project-title"><Pill tone="blue">{project.code}</Pill><h2>{project.name}</h2></div><div className="banner-pills"><Pill tone="amber">{project.track}</Pill><Pill tone={phase.tone}>{phase.gateway} · {phase.label}</Pill>{project.locked && <Pill tone="purple">Signed & locked</Pill>}</div></div><div className="milestones">{[["GW1", "Intake"], ["GW2", "Feasibility"], ["GW3", "Development"], ["GW4", "Deploy"], ["GW5", "Handover"]].map((item, index) => { const active = Number(phase.gateway.slice(2)) - 1; return <div key={item[0]} className={index === active ? "current" : index < active ? "completed" : ""}><span>{index < active ? "✓" : item[0]}</span><b>{item[1]}</b></div>; })}</div></section><section className="panel"><div className="panel-head"><div><span className="kicker">Section 1 · PgM Project Information</span><h3>Project definition & Gateway dates</h3><p>{role === "Vendor PM" ? "This information is synchronized from the PgM workspace and is read-only for Vendor PM." : "Domain and Domain Owner are maintained only by CCB on Create CSCOP."}</p></div><Pill tone={project.pgmComplete ? "green" : "amber"}>{project.pgmComplete ? "Synced" : "Draft"}</Pill></div><div className="form-grid"><label>Initiative<input value={project.initiative || "Not assigned"} readOnly /></label><label>Project<input value={project.name} readOnly /></label><label>Goal<input value={project.goal || "Not completed"} readOnly /></label><label>Assigned PM<input value={project.pm} readOnly /></label><label>Start Date<input value={project.startDate || "Not set"} readOnly /></label><label>Due Date<input value={project.dueDate || "Not set"} readOnly /></label><label>GW1 BRD Sign-off Date<input value={project.brdSignoffDate || "Not set"} readOnly /></label><label>GW4 Tech Release Date<input value={project.techReleaseDate || "Not set"} readOnly /></label><label className="wide">Participating Vendors<input value={role === "Vendor PM" ? CURRENT_VENDOR : project.vendors} readOnly /></label></div></section><section className="panel"><div className="panel-head"><div><span className="kicker">{role === "Vendor PM" ? "My Vendor Plan" : "Submitted Vendor Plans"}</span><h3>Manday Allocation</h3><p>{role === "Vendor PM" ? "Only VT records are visible." : "Submitted plans linked to this CSCOP."}</p></div></div><AllocationSummary records={visibleAllocations} /></section></div>;
}

function AllocationSummary({ records }: { records: AllocationRecord[] }) {
  return <div className="allocation-summary"><div className="allocation-summary-row allocation-summary-head"><span>Vendor</span><span>Plan</span><span>Updated</span><span>Status</span></div>{records.length ? records.map(record => <div className="allocation-summary-row" key={record.id}><span><Pill tone="blue">{record.vendor}</Pill></span><strong>{md(record.total)} MD</strong><span>{record.updated}</span><span><Pill tone={tone(record.status)}>{record.status}</Pill></span></div>) : <div className="empty-state">No Manday Allocation has been submitted for this CSCOP.</div>}<div className="allocation-grand-total"><span>Total planned Mandays</span><strong>{md(records.reduce((sum, record) => sum + record.total, 0))} MD</strong></div></div>;
}

function InitiativeDashboard({ state, projects }: { state: AppState; projects: Project[] }) {
  const initiatives = Array.from(new Set(projects.map(project => project.initiative || "Unassigned Initiative"))).map(name => {
    const children = projects.filter(project => (project.initiative || "Unassigned Initiative") === name);
    const codes = new Set(children.map(project => project.code));
    const planned = state.allocations.filter(record => codes.has(record.code)).reduce((sum, record) => sum + record.total, 0);
    const actual = state.entries.filter(entry => codes.has(entry.code)).reduce((sum, entry) => sum + entry.hours, 0);
    const starts = children.map(project => project.startDate).filter(Boolean).sort();
    const dues = children.map(project => project.dueDate).filter(Boolean).sort();
    return { name, children, planned, actual, start: starts[0] || "Not set", due: dues.at(-1) || "Not set", goal: children.find(project => project.goal)?.goal || "Goal pending" };
  });
  return <div className="initiative-table"><div className="initiative-row initiative-head"><span>Initiative / Goal</span><span>Projects</span><span>Planned MD</span><span>Actual Hours</span><span>Timeline</span><span>Status</span></div>{initiatives.map(item => <div className="initiative-row" key={item.name}><span><b>{item.name}</b><small>{item.goal}</small></span><span><b>{item.children.length} projects</b><small className="project-code-list">{item.children.map(project => project.code).join(" · ")}</small></span><strong>{md(item.planned)} MD</strong><strong>{item.actual.toFixed(2)} h</strong><span><b>{item.start}</b><small>to {item.due}</small></span><span><Pill tone={item.children.every(project => project.locked) ? "purple" : "blue"}>{item.children.every(project => project.locked) ? "Locked" : "In Progress"}</Pill></span></div>)}</div>;
}

function ProjectDashboard({ state, role, open }: { state: AppState; role: Role; open: (view: View) => void }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [dashboardMode, setDashboardMode] = useState<"project" | "initiative">("project");
  const projects = role === "Vendor PM" ? state.projects.filter(canVendorSee) : state.projects;
  const selected = projects.find(project => project.code === selectedCode);
  const relevantCodes = new Set(projects.map(project => project.code));
  const entries = state.entries.filter(entry => relevantCodes.has(entry.code) && (role !== "Vendor PM" || entry.vendor === CURRENT_VENDOR));
  if (selected) return <ProjectDetail project={selected} role={role} allocations={state.allocations.filter(item => item.code === selected.code)} back={() => setSelectedCode(null)} />;
  return <div className="page"><div className="metrics"><article><span>{role === "Vendor PM" ? "My VT projects" : "Active CSCOPs"}</span><strong>{projects.length}</strong><small className="up">Role-filtered portfolio</small></article><article><span>Active Initiatives</span><strong>{new Set(projects.map(project => project.initiative).filter(Boolean)).size}</strong><small>Portfolio grouping</small></article><article><span>Submitted time</span><strong className="hours-metric"><span>{entries.filter(entry => entry.status === "Submitted").reduce((sum, entry) => sum + entry.hours, 0)}</span><em>hours</em></strong><small>{role === "Vendor PM" ? "VT only" : "Portfolio total"}</small></article><article><span>Records locked</span><strong>{projects.filter(project => project.locked).length}</strong><small>BRD signed</small></article></div><section className="panel"><div className="panel-head dashboard-panel-head"><div><h3>{role === "Vendor PM" ? "VT Project Dashboard" : dashboardMode === "initiative" ? "Initiative Dashboard" : "Project Dashboard"}</h3><p>{role === "Vendor PM" ? "Only CSCOP projects assigned to VT are shown." : dashboardMode === "initiative" ? "Portfolio view: one Initiative can contain multiple CSCOP projects." : role === "PgM" ? "Select a CSCOP to continue in Project Audit & Lock." : "Click a CSCOP to open its operational Project Detail."}</p></div><div className="dashboard-actions">{role !== "Vendor PM" && <div className="segmented"><button className={dashboardMode === "project" ? "active" : ""} onClick={() => setDashboardMode("project")}>Project View</button><button className={dashboardMode === "initiative" ? "active" : ""} onClick={() => setDashboardMode("initiative")}>Initiative View</button></div>}{role === "CCB" && <button className="primary" onClick={() => open("create")}>＋ Create CSCOP</button>}</div></div>{dashboardMode === "initiative" && role !== "Vendor PM" ? <InitiativeDashboard state={state} projects={projects} /> : <div className="table"><div className="tr th"><span>Project</span><span>Lifecycle</span><span>Owner / PM</span><span>Stage</span><span>Status</span><span /></div>{projects.map(project => { const status = dashboardStatus(project); return <button className="tr project-row-button" key={project.code} onClick={() => role === "PgM" ? open("audit") : setSelectedCode(project.code)}><span><b className="link">{project.code}</b><small>{project.name}</small></span><span><Pill tone={project.track.includes("Delivery") ? "green" : project.track.includes("Discovery") ? "blue" : "amber"}>{project.track}</Pill></span><span><b>{project.owner}</b><small>{project.pm} · {role === "Vendor PM" ? CURRENT_VENDOR : project.vendors}</small></span><span>{project.stage}</span><span><Pill tone={status === "BRD Signed & Locked" ? "purple" : status === "Done" ? "green" : "blue"}>{status}</Pill></span><span className="arrow">→</span></button>; })}</div>}</section></div>;
}

function CreateCscop({ addProject }: { addProject: (project: Project) => void }) {
  const [jiraNo, setJiraNo] = useState("CSCOP-1028");
  const [name, setName] = useState("Service Center Enhancement");
  const [intake, setIntake] = useState("RITM1720912");
  const [domain, setDomain] = useState("Fulfillment");
  const [vendors, setVendors] = useState<string[]>(["VT", "Baison"]);
  const code = jiraNo.trim().toUpperCase().replace(/-(1|2)$/, "");
  const valid = /^CSCOP-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code);
  const toggleVendor = (vendor: string) => setVendors(current => current.includes(vendor) ? current.filter(item => item !== vendor) : [...current, vendor]);
  return <div className="page narrow"><section className="jira-source-banner"><div><span>JIRA</span><div><b>CSCOP No. is created in Jira first</b><p>CCB creates the Project master; PgM later creates Discovery -1 or Delivery -2.</p></div></div><strong>{code || "Existing Jira CSCOP"} → PgM path pending</strong></section><section className="panel form-panel"><div className="panel-head"><div><span className="kicker">CCB Project Setup</span><h3>Create CSCOP Project Master</h3><p>Domain, Domain Owner and Vendor List are governed by CCB on this page.</p></div><Pill tone="amber">PgM path required</Pill></div><div className="form-grid"><label>Existing Jira CSCOP No. *<input value={jiraNo} onChange={event => setJiraNo(event.target.value)} /><small className="field-help">{valid ? `Project master: ${code}` : "Enter e.g. CSCOP-1028"}</small></label><label>Intake No. (RITM) *<input value={intake} onChange={event => setIntake(event.target.value)} /></label><label className="wide">Project Name *<input value={name} onChange={event => setName(event.target.value)} /></label><label>Domain *<select value={domain} onChange={event => setDomain(event.target.value)}>{Object.keys(domainOwners).map(item => <option key={item}>{item}</option>)}</select></label><label>Domain Owner · Auto-filled<input value={domainOwners[domain]} readOnly className="readonly" /></label><label>Assigned PM · Initial value<input value={domainAssignedPms[domain]} readOnly className="readonly" /><small className="field-help">PgM can update Assigned PM in Project Audit & Lock.</small></label><label className="wide">Vendor List · CCB managed *<div className="checks vendor-checks">{vendorOptions.map(vendor => <button type="button" key={vendor} className={vendors.includes(vendor) ? "checked" : ""} onClick={() => toggleVendor(vendor)}>{vendors.includes(vendor) ? "✓ " : ""}{vendor}</button>)}</div></label></div><div className="form-actions"><button className="secondary">Save Draft</button><button className="primary" disabled={!valid || !name || !intake || !vendors.length} onClick={() => addProject({ code, name, track: "PgM path required", domain, owner: domainOwners[domain], pm: domainAssignedPms[domain], vendors: vendors.join(", "), initiative: "", goal: "", startDate: "", dueDate: "", stage: "GW1 · Intake", status: "PgM setup required", pgmComplete: false, locked: false })}>Create {code} Project →</button></div></section></div>;
}

function AllocationWorkspace({ state, role, save }: { state: AppState; role: Role; save: (state: AppState, message: string) => void }) {
  const [creating, setCreating] = useState(false);
  const assignedProjects = state.projects.filter(project => role !== "Vendor PM" || canVendorSee(project));
  const [projectCode, setProjectCode] = useState(assignedProjects[0]?.code || "");
  const [vendor, setVendor] = useState(role === "Vendor PM" ? CURRENT_VENDOR : vendorOptions[0]);
  const [values, setValues] = useState<Record<string, number>>({ "1.1-0": 2, "1.1-1": 3, "1.3-1": 3 });
  const records = state.allocations.filter(record => role !== "Vendor PM" || record.vendor === CURRENT_VENDOR);
  if (!creating) return <div className="page"><div className="metrics"><article><span>{role === "Vendor PM" ? "My VT plans" : "Allocation records"}</span><strong>{records.length}</strong><small>Submitted and draft</small></article><article><span>Assigned projects</span><strong>{assignedProjects.length}</strong><small>{role === "Vendor PM" ? "All VT CSCOPs" : "Portfolio scope"}</small></article><article><span>Total planned</span><strong>{md(records.reduce((sum, record) => sum + record.total, 0))}<em> MD</em></strong><small>{role === "Vendor PM" ? "VT only" : "All vendors"}</small></article><article><span>Editable projects</span><strong>{assignedProjects.length}</strong><small>No workflow status restriction</small></article></div><section className="panel"><div className="panel-head"><div><h3>Manday Allocation Dashboard</h3><p>{role === "Vendor PM" ? "Every CSCOP assigned to VT is visible and available for planning." : "Vendor plans by CSCOP."}</p></div><button className="primary" disabled={!assignedProjects.length} onClick={() => { setProjectCode(assignedProjects[0]?.code || ""); setCreating(true); }}>＋ Create Manday Allocation</button></div><div className="entry-table"><div className="allocation-list-row allocation-list-head"><span>CSCOP / Project</span><span>Vendor</span><span>Total MD</span><span>Last updated</span><span>Status</span><span /></div>{records.map(record => <div className="allocation-list-row" key={record.id}><span><b>{record.code}</b><small>{record.project}</small></span><span><Pill tone="blue">{record.vendor}</Pill></span><strong>{md(record.total)} MD</strong><span>{record.updated}</span><span><Pill tone={tone(record.status)}>{record.status}</Pill></span><button className="arrow" onClick={() => { setProjectCode(record.code); setCreating(true); }}>→</button></div>)}</div></section></div>;
  const project = assignedProjects.find(item => item.code === projectCode) || assignedProjects[0];
  if (!project) return <div className="page"><button className="back-link" onClick={() => setCreating(false)}>← Allocation Dashboard</button><section className="panel"><div className="empty-state">No CSCOP project is assigned to VT.</div></section></div>;
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const submit = () => { const next: AllocationRecord = { id: Date.now(), code: project.code, project: project.name, vendor: role === "Vendor PM" ? CURRENT_VENDOR : vendor, total: Number(total.toFixed(2)), updated: "13 Aug 2026", status: "Submitted" }; save({ ...state, allocations: [next, ...state.allocations] }, `${next.vendor} allocation submitted`); setCreating(false); };
  return <div className="page"><button className="back-link" onClick={() => setCreating(false)}>← Allocation Dashboard</button><section className="selection-strip allocation-selection"><label>Project (CSCOP)<select value={project.code} onChange={event => setProjectCode(event.target.value)}>{assignedProjects.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></label><label>Vendor<select value={role === "Vendor PM" ? CURRENT_VENDOR : vendor} disabled={role === "Vendor PM"} onChange={event => setVendor(event.target.value)}>{vendorOptions.map(item => <option key={item}>{item}</option>)}</select></label><div><span>Plan total</span><strong>{md(total)} MD</strong></div><button className="primary" onClick={submit}>Submit allocation</button></section><section className="panel matrix-panel"><div className="panel-head"><div><h3>Create Manday Allocation</h3><p>Enter planned Mandays to two decimal places for {project.code}.</p></div><Pill tone="green">Ready to edit</Pill></div><div className="matrix"><div className="matrix-row matrix-head"><span>Epic / Deliverable</span><span>PM</span><span>BA</span><span>TL</span><span>DEV</span><span>QA</span><span>Total</span></div>{epics.map(([stage, rows]) => <div className="stage-group" key={stage}><div className="stage-title">{stage}</div>{rows.map(row => { const id = row.split(" · ")[0]; const rowTotal = [0, 1, 2, 3, 4].reduce((sum, index) => sum + (values[`${id}-${index}`] || 0), 0); return <div className="matrix-row" key={row}><span><b>{row}</b></span>{[0, 1, 2, 3, 4].map(index => <span key={index}><input aria-label={`${row} role ${index}`} className={`matrix-input c${index}`} type="number" min="0" step="0.01" value={values[`${id}-${index}`] ?? ""} onChange={event => setValues({ ...values, [`${id}-${index}`]: Number(event.target.value) })} /></span>)}<span className="total">{rowTotal ? md(rowTotal) : "—"}</span></div>; })}</div>)}</div><div className="matrix-total"><span>Plan total</span><b /><b /><b /><b /><b /><strong>{md(total)} MD</strong></div></section></div>;
}

function ActualTimesheet({ state, role, save }: { state: AppState; role: Role; save: (state: AppState, message: string) => void }) {
  const identity = identities[role];
  const availableProjects = role === "Vendor PM" ? state.projects.filter(canVendorSee) : state.projects;
  const [creating, setCreating] = useState(false);
  const [projectCode, setProjectCode] = useState(availableProjects[0]?.code || "");
  const [startDate, setStartDate] = useState("2026-08-10");
  const [endDate, setEndDate] = useState("2026-08-14");
  const [supporter, setSupporter] = useState(identity.name);
  const [rows, setRows] = useState([{ epic: "3.2 · Development by Feature", days: [8, 8, 8, 8, 8] }]);
  const visibleEntries = role === "PgM" ? state.entries : state.entries.filter(entry => entry.person === identity.name && entry.vendor === identity.vendor);
  const total = rows.reduce((sum, row) => sum + row.days.reduce((rowSum, value) => rowSum + value, 0), 0);
  if (!creating) return <div className="page"><div className="metrics"><article><span>{role === "PgM" ? "Team submissions" : "My submissions"}</span><strong>{visibleEntries.filter(entry => entry.status === "Submitted").length}</strong><small className="up">{role === "PgM" ? "All participants" : identity.name}</small></article><article><span>Total actual hours</span><strong>{visibleEntries.reduce((sum, entry) => sum + entry.hours, 0)}<em>h</em></strong><small>{role === "PgM" ? "By CSCOP project" : "My actuals only"}</small></article><article><span>Active projects</span><strong>{new Set(visibleEntries.map(entry => entry.code)).size}</strong><small>With submitted time</small></article><article><span>Pending drafts</span><strong>{visibleEntries.filter(entry => entry.status === "Draft").length}</strong><small className="warn">Follow-up required</small></article></div><section className="panel"><div className="panel-head"><div><h3>{role === "PgM" ? "Actual Timesheet · by CSCOP" : "My Actual Timesheet"}</h3><p>{role === "PgM" ? "PgM sees submissions from all people and Vendors grouped by project." : `${identity.name} can create and view only their own entries.`}</p></div><button className="primary" onClick={() => setCreating(true)}>＋ Create Timesheet</button></div><div className="entry-table"><div className="entry-row entry-head"><span>Participant</span><span>CSCOP / Epic</span><span>Vendor</span><span>Date range</span><span>Hours</span><span>Status</span></div>{visibleEntries.map(entry => <div className="entry-row" key={entry.id}><span><b>{entry.person}</b><small>{entry.project}</small></span><span><b>{entry.code}</b><small>{entry.epic}</small></span><span>{entry.vendor}</span><span>{entry.week}</span><strong>{entry.hours}h</strong><span><Pill tone={tone(entry.status)}>{entry.status}</Pill></span></div>)}</div></section></div>;
  const selectedProject = availableProjects.find(project => project.code === projectCode) || availableProjects[0];
  const formatRange = () => `${startDate} → ${endDate}`;
  const submit = () => { if (!selectedProject || !supporter.trim()) return; const entries = rows.map((row, index) => ({ id: Date.now() + index, code: selectedProject.code, project: selectedProject.name, epic: row.epic, vendor: identity.vendor, person: supporter.trim(), hours: row.days.reduce((sum, value) => sum + value, 0), week: formatRange(), status: "Submitted" })); save({ ...state, entries: [...state.entries, ...entries] }, `${supporter.trim()}'s timesheet submitted`); setCreating(false); };
  return <div className="page"><section className="timesheet-hero"><div><button className="back-link" onClick={() => setCreating(false)}>← Timesheet Dashboard</button><span className="kicker">Personal submission</span><h2>Create Actual Timesheet</h2><p>{identity.name} · {identity.vendor}. Identity cannot be changed.</p></div><div className="week-score"><strong>{total}<em>/ 40h</em></strong><div><i style={{ width: `${Math.min(100, total / 40 * 100)}%` }} /></div><small>{total === 40 ? "Ready to submit" : `${Math.abs(40 - total)} hours ${total < 40 ? "remaining" : "over"}`}</small></div></section><section className="panel"><div className="form-grid timesheet-context"><label>Project (CSCOP)<select value={projectCode} onChange={event => setProjectCode(event.target.value)}>{availableProjects.map(project => <option key={project.code} value={project.code}>{project.code} · {project.name}</option>)}</select></label><label>Start Date<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label>End Date<input type="date" min={startDate} value={endDate} onChange={event => setEndDate(event.target.value)} /></label><label>Submitted By<input value={identity.name} readOnly className="readonly" /></label><label>Supporter *<input value={supporter} onChange={event => setSupporter(event.target.value)} placeholder="Enter supporter name" /></label><label>Vendor<input value={identity.vendor} readOnly className="readonly" /></label></div><div className="panel-head"><div><h3>My time entries</h3><p>Add approved Epic rows for the selected date range.</p></div><button className="secondary" onClick={() => setRows([...rows, { epic: "1.3 · BRD – Business Requirement", days: [0, 0, 0, 0, 0] }])}>＋ Add Epic Row</button></div><div className="time-grid"><div className="time-row time-head"><span>Project / Epic</span>{["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => <span key={day}>{day}</span>)}<span>Total</span></div>{rows.map((row, rowIndex) => <div className="time-row" key={rowIndex}><span><Pill tone="blue">{selectedProject?.code}</Pill><select value={row.epic} onChange={event => { const next = rows.map(item => ({ ...item, days: [...item.days] })); next[rowIndex].epic = event.target.value; setRows(next); }}>{epics.flatMap(section => section[1]).map(epic => <option key={epic}>{epic}</option>)}</select><small>{identity.vendor} · {supporter || "Supporter required"}</small></span>{row.days.map((value, dayIndex) => <span key={dayIndex}><input type="number" min="0" max="24" value={value} onChange={event => { const next = rows.map(item => ({ ...item, days: [...item.days] })); next[rowIndex].days[dayIndex] = Number(event.target.value); setRows(next); }} /></span>)}<strong>{row.days.reduce((sum, value) => sum + value, 0)}h</strong></div>)}</div><div className="time-actions"><div className="validation"><span>✓</span><div><b>{startDate && endDate ? formatRange() : "Select a date range"}</b><p>Entries will roll up by CSCOP, supporter and Vendor.</p></div></div><button className="secondary">Save Draft</button><button className="primary" disabled={!selectedProject || !startDate || !endDate || !supporter.trim()} onClick={submit}>Submit My Timesheet</button></div></section></div>;
}

function AuditDetail({ project, allocations, back, update }: { project: Project; allocations: AllocationRecord[]; back: () => void; update: (project: Project, message: string) => void }) {
  const phase = auditPhase(project);
  const existingPath = project.code.endsWith("-1") ? "1" : project.code.endsWith("-2") ? "2" : null;
  const [path, setPath] = useState<"1" | "2">(existingPath || "1");
  const [initiative, setInitiative] = useState(project.initiative || "");
  const [goal, setGoal] = useState(project.goal || "");
  const [startDate, setStartDate] = useState(project.startDate || "");
  const [dueDate, setDueDate] = useState(project.dueDate || "");
  const [pm, setPm] = useState(project.pm || "");
  const [gw1, setGw1] = useState(project.brdSignoffDate || "");
  const [gw4, setGw4] = useState(project.techReleaseDate || "");
  const complete = Boolean(initiative && goal && startDate && dueDate && pm && gw1 && gw4);
  const updatedProject = (locked: boolean): Project => ({ ...project, code: existingPath ? project.code : `${project.code}-${path}`, track: path === "1" ? "Discovery · CSCOP-1" : "Delivery · CSCOP-2", initiative, goal, startDate, dueDate, pm, brdSignoffDate: gw1, techReleaseDate: gw4, stage: existingPath ? project.stage : path === "1" ? "GW1 · Intake" : "GW2 · Development", pgmComplete: true, locked, status: locked ? "Signed & locked" : "Pending sign-off" });
  return <div className="page"><button className="back-link" onClick={back}>← Project Audit Summary</button><section className="project-banner"><div><div className="project-title"><Pill tone="blue">{project.code}</Pill><h2>{project.name}</h2></div><div className="banner-pills"><Pill tone="amber">{project.track}</Pill><Pill tone={phase.tone}>{phase.gateway} · {phase.label}</Pill>{project.locked && <Pill tone="purple">Signed & locked</Pill>}</div></div></section><section className="panel path-governance"><div className="panel-head"><div><span className="kicker">PgM Lifecycle Setup</span><h3>Create Discovery or Delivery project</h3><p>CCB owns the Project master and Vendor List. PgM creates the execution path.</p></div><Pill tone={path === "1" ? "blue" : "green"}>{existingPath ? project.code : `${project.code}-${path}`}</Pill></div><fieldset disabled={project.locked || Boolean(existingPath)}><div className="pgm-path-options"><button className={path === "1" ? "selected discovery" : "discovery"} onClick={() => setPath("1")}><b>Discovery · -1</b><span>Intake → BRD → Feasibility · closes at GW2</span></button><button className={path === "2" ? "selected delivery" : "delivery"} onClick={() => setPath("2")}><b>Delivery · -2</b><span>Development → Deploy → Handover · closes at GW5</span></button></div></fieldset></section><section className="panel form-panel"><div className="panel-head"><div><span className="kicker">Section 1 · PgM Project Information</span><h3>Project definition & Gateway dates</h3><p>Domain and Domain Owner remain CCB-controlled and are not editable here.</p></div><Pill tone={project.locked ? "purple" : complete ? "green" : "amber"}>{project.locked ? "Read only" : complete ? "Complete" : "Incomplete"}</Pill></div><fieldset disabled={project.locked}><div className="form-grid audit-grid"><label>1 · Initiative *<input value={initiative} onChange={event => setInitiative(event.target.value)} placeholder="Enter initiative" /></label><label>2 · Project<input value={project.name} readOnly className="readonly" /></label><label>3 · Goal *<input value={goal} onChange={event => setGoal(event.target.value)} placeholder="Enter goal" /></label><label>4 · Start Date *<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label>5 · Due Date *<input type="date" min={startDate} value={dueDate} onChange={event => setDueDate(event.target.value)} /></label><label>Assigned PM · PgM editable *<input value={pm} onChange={event => setPm(event.target.value)} placeholder="Enter Assigned PM" /></label><label>GW1 BRD Sign-off Date *<input type="date" value={gw1} onChange={event => setGw1(event.target.value)} /></label><label>GW4 Tech Release Date *<input type="date" value={gw4} onChange={event => setGw4(event.target.value)} /></label></div></fieldset>{!project.locked && <div className="form-actions"><button className="primary" disabled={!complete} onClick={() => update(updatedProject(false), "PgM Section 1 completed · Vendor access enabled")}>✓ Mark Section 1 Complete</button><button className="danger" disabled={!complete} onClick={() => update(updatedProject(true), "BRD signed · baseline locked")}>Sign Off & Lock</button></div>}</section><section className="panel"><div className="panel-head"><div><span className="kicker">Section 2 · Vendor Submitted Mandays</span><h3>Multi-Vendor Allocation by CSCOP</h3><p>Every Vendor submission for {project.code} appears here after submission.</p></div><Pill tone="blue">{allocations.length} records</Pill></div><AllocationSummary records={allocations} /></section></div>;
}

function ProjectAudit({ state, save, open }: { state: AppState; save: (state: AppState, message: string) => void; open: (view: View) => void }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const project = state.projects.find(item => item.code === selectedCode);
  if (project) return <AuditDetail project={project} allocations={state.allocations.filter(item => item.code === project.code)} back={() => setSelectedCode(null)} update={(updated, message) => save({ ...state, projects: state.projects.map(item => item.code === project.code ? updated : item) }, message)} />;
  return <div className="page"><button className="back-link" onClick={() => open("dashboard")}>← Project Dashboard</button><div className="metrics"><article><span>CSCOP projects</span><strong>{state.projects.length}</strong><small>Portfolio scope</small></article><article><span>Section 1 incomplete</span><strong>{state.projects.filter(item => !item.pgmComplete).length}</strong><small className="warn">Vendor access pending</small></article><article><span>Vendor plans</span><strong>{state.allocations.length}</strong><small>Section 2 records</small></article><article><span>Locked baselines</span><strong>{state.projects.filter(item => item.locked).length}</strong><small className="up">Audit ready</small></article></div><section className="panel"><div className="panel-head"><div><h3>Project Audit & Lock · by CSCOP</h3><p>PgM governance workspace: select a CSCOP to open its detailed Section 1 and Section 2 record.</p></div></div><div className="audit-cards">{state.projects.map(item => { const phase = auditPhase(item); const plans = state.allocations.filter(record => record.code === item.code); return <button key={item.code} onClick={() => setSelectedCode(item.code)}><div><div className="audit-badges"><Pill tone={phase.tone}>{phase.gateway} · {phase.label}</Pill>{item.locked && <Pill tone="purple">Locked</Pill>}</div><h4>{item.code}</h4><p>{item.name}</p></div><div className="audit-progress"><span>Section 1 / Vendor plans</span><b>{item.pgmComplete ? "Complete" : "Required"} · {plans.length}</b><i><em style={{ width: item.pgmComplete ? "100%" : "40%" }} /></i></div><span>Open detail →</span></button>; })}</div></section></div>;
}

export default function Home() {
  const [signedIn, setSignedIn] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [role, setRole] = useState<Role>("CCB");
  const [state, setState] = useState<AppState>(seed);
  const [toast, setToast] = useState("");
  const roleViews: Record<Role, View[]> = {
    CCB: ["dashboard", "create"],
    PgM: ["dashboard", "timesheet", "audit"],
    "Vendor PM": ["dashboard", "allocation", "timesheet"],
  };
  const visibleNav = nav.filter(item => roleViews[role].includes(item.id));
  const current = useMemo(() => nav.find(item => item.id === view) || nav[0], [view]);
  useEffect(() => {
    try { const local = window.localStorage.getItem(STORAGE_KEY); if (local) setState(normalizeState(JSON.parse(local))); } catch { /* use seed */ }
    fetch("/api/state").then(response => response.ok ? response.json() : null).then(data => { if (data?.state) setState(normalizeState(data.state)); }).catch(() => {});
  }, []);
  const save = (next: AppState, message: string) => {
    setState(next); setToast(message);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* in-memory still works */ }
    fetch("/api/state", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: next }) }).catch(() => {});
    window.setTimeout(() => setToast(""), 2500);
  };
  const addProject = (project: Project) => { save({ ...state, projects: [project, ...state.projects] }, `${project.code} created and added to Project Dashboard`); setView("dashboard"); };
  const changeRole = (next: Role) => { setRole(next); if (!roleViews[next].includes(view)) setView("dashboard"); };
  if (!signedIn) return <SignIn onSignIn={() => { setRole("CCB"); setView("dashboard"); setSignedIn(true); }} />;
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">C</div><div><b>Corporate Solution Timesheet</b><span>FY26 SOP workspace</span></div></div><nav>{["Overview", "Planning", "Execution", "Governance"].map(section => { const items = visibleNav.filter(item => item.section === section); return items.length ? <div className="nav-section" key={section}><span>{section}</span>{items.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><i>{item.icon}</i>{item.label}{item.id === "audit" && <em>{state.projects.filter(project => !project.pgmComplete).length}</em>}</button>)}</div> : null; })}</nav><div className="sidebar-foot"><RoleLogin role={role} onChange={changeRole} /><div className="user"><div className="avatar">{identities[role].name.split(" ").map(part => part[0]).join("")}</div><div><b>{identities[role].name}</b><span>{role === "Vendor PM" ? `${CURRENT_VENDOR} Vendor PM` : role}</span></div></div></div></aside><div className="workspace"><Topbar title={current.label} role={role} />{view === "flow" && <Flow open={setView} />}{view === "dashboard" && <ProjectDashboard state={state} role={role} open={setView} />}{view === "create" && role === "CCB" && <CreateCscop addProject={addProject} />}{view === "allocation" && role === "Vendor PM" && <AllocationWorkspace state={state} role={role} save={save} />}{view === "timesheet" && <ActualTimesheet state={state} role={role} save={save} />}{view === "audit" && role === "PgM" && <ProjectAudit state={state} save={save} open={setView} />}</div><Toast text={toast} /></main>;
}
