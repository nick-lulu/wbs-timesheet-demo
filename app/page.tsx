"use client";

import { useMemo, useState } from "react";

type View = "flow" | "dashboard" | "create" | "allocation" | "timesheet" | "audit";
type Role = "CCB" | "PgM" | "Vendor PM";

const projects = [
  { code: "CSCOP-417", name: "3rd DC Foundation · PO Release", track: "Discovery → Delivery", owner: "Liz Liu", vendors: "Cap, Baison", stage: "GW2 · Feasibility", status: "Pending sign-off", tone: "amber" },
  { code: "CSCOP-965", name: "3rd DC Foundation · Inbound Release", track: "Direct Delivery", owner: "Liz Liu", vendors: "Valtech, TW", stage: "GW3 · Build & Test", status: "In progress", tone: "blue" },
  { code: "CSCOP-108", name: "AI Warehouse Feasibility Study", track: "Discovery only", owner: "Bingbing Zhao", vendors: "Internal", stage: "GW2 · Feasibility", status: "Signed & locked", tone: "purple" },
];

const nav: { id: View; label: string; icon: string; section: string }[] = [
  { id: "flow", label: "Closed-loop Flow", icon: "⌁", section: "Overview" },
  { id: "dashboard", label: "Project Portfolio", icon: "▦", section: "Overview" },
  { id: "create", label: "Create CSCOP", icon: "+", section: "Planning" },
  { id: "allocation", label: "Manday Allocation", icon: "◫", section: "Planning" },
  { id: "timesheet", label: "Actual Timesheet", icon: "◷", section: "Execution" },
  { id: "audit", label: "Audit & Lock", icon: "◇", section: "Governance" },
];

function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function Topbar({ title, eyebrow, role, setRole }: { title: string; eyebrow: string; role: Role; setRole: (r: Role) => void }) {
  return <header className="topbar">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div>
    <div className="top-actions">
      <div className="role-switch" aria-label="Switch role">
        {(["CCB", "PgM", "Vendor PM"] as Role[]).map(r => <button key={r} className={role === r ? "active" : ""} onClick={() => setRole(r)}>{r}</button>)}
      </div>
      <button className="icon-button">⌕</button><div className="avatar">JL</div>
    </div>
  </header>;
}

function Flow({ onOpen }: { onOpen: (v: View) => void }) {
  const [track, setTrack] = useState<"discovery" | "hybrid" | "delivery">("hybrid");
  return <div className="page flow-page">
    <section className="hero-card">
      <div><Pill tone="blue">FY26 operating model</Pill><h2>One project record.<br/>A complete delivery loop.</h2><p>From intake to feasibility or project closure—with allocation, actual effort and governance connected to the same CSCOP.</p></div>
      <div className="hero-stat"><span>Current portfolio</span><strong>3</strong><small>active CSCOPs</small><div className="mini-bars"><i/><i/><i/><i/><i/></div></div>
    </section>

    <section className="section-head"><div><span className="kicker">Lifecycle logic</span><h3>Choose a route to explain the flow</h3></div><div className="segmented">
      <button className={track === "discovery" ? "active" : ""} onClick={() => setTrack("discovery")}>Discovery only</button>
      <button className={track === "hybrid" ? "active" : ""} onClick={() => setTrack("hybrid")}>Discovery → Delivery</button>
      <button className={track === "delivery" ? "active" : ""} onClick={() => setTrack("delivery")}>Direct delivery</button>
    </div></section>

    <section className="flow-board">
      <div className="lane-label"><span>01</span><b>Set up</b><small>CCB</small></div>
      <div className="flow-node start"><span className="node-icon">↗</span><small>REQUEST</small><b>Intake received</b><p>RITM & project need</p></div><div className="connector"><i/></div>
      <button className="flow-node mint" onClick={() => onOpen("create")}><span className="node-icon">＋</span><small>CCB</small><b>Create CSCOP</b><p>Owner · PM · Vendors</p></button><div className="connector"><i/></div>
      <div className="flow-node decision"><span className="node-icon">⌘</span><small>DECISION</small><b>{track === "discovery" ? "Discovery only" : track === "delivery" ? "Direct delivery" : "Discovery → Delivery"}</b><p>{track === "delivery" ? "Begin at GW2" : "Begin before GW1"}</p></div>

      <div className="lane-label second"><span>02</span><b>Plan</b><small>PgM + Vendor PM</small></div>
      <button className="flow-node violet plan" onClick={() => onOpen("audit")}><span className="node-icon">⌗</span><small>PgM</small><b>Project metadata</b><p>Goal · Initiative · Gate dates</p></button><div className="connector plan-connector"><i/></div>
      <button className="flow-node blue allocation" onClick={() => onOpen("allocation")}><span className="node-icon">▤</span><small>VENDOR PM</small><b>Manday allocation</b><p>Epic × role × vendor</p></button><div className="connector alloc-connector"><i/></div>
      <div className="flow-node gate"><span className="node-icon">◈</span><small>GW1 GATE</small><b>BRD sign-off</b><p>Validate, sign & freeze</p><Pill tone="red">Irreversible lock</Pill></div>

      <div className="lane-label third"><span>03</span><b>Execute</b><small>All roles</small></div>
      <div className="flow-node lifecycle"><span className="node-icon">◎</span><small>LIFECYCLE</small><b>{track === "discovery" ? "Feasibility" : track === "delivery" ? "Delivery execution" : "Launch delivery"}</b><p>{track === "discovery" ? "Close at GW2" : "GW2 → GW5"}</p></div><div className="connector life-connector"><i/></div>
      <button className="flow-node green close" onClick={() => onOpen("dashboard")}><span className="node-icon">✓</span><small>OUTCOME</small><b>{track === "discovery" ? "Feasibility closed" : "Project closure"}</b><p>{track === "discovery" ? "Decision documented" : "Handover complete"}</p></button>

      <button className="parallel-bar" onClick={() => onOpen("timesheet")}><span className="pulse">●</span><div><b>Actual Timesheet runs in parallel</b><p>Weekly hours are booked against approved Epics; budget vs actual updates automatically.</p></div><span>Open timesheet →</span></button>
    </section>

    <section className="rule-grid"><article><span>Before GW1</span><h4>Everything editable</h4><p>CCB, PgM and Vendor PM complete ownership, metadata and resource allocation.</p></article><article><span>At BRD sign-off</span><h4>Baseline freezes</h4><p>Project metadata and Discovery allocation become an auditable snapshot.</p></article><article><span>After sign-off</span><h4>Execution is measured</h4><p>Actual effort rolls up against the locked plan through feasibility or closure.</p></article></section>
  </div>;
}

function Dashboard({ onOpen }: { onOpen: (v: View) => void }) {
  return <div className="page"><div className="metrics"><article><span>Active projects</span><strong>3</strong><small className="up">↑ 1 this quarter</small></article><article><span>Pending BRD sign-off</span><strong>2</strong><small className="warn">Requires PgM action</small></article><article><span>Allocated capacity</span><strong>263 <em>MD</em></strong><small>Across 5 vendors</small></article><article><span>Portfolio health</span><strong>92<em>%</em></strong><small className="up">Within plan</small></article></div>
    <section className="panel"><div className="panel-head"><div><h3>Project portfolio</h3><p>Lifecycle, ownership and gate status in one view.</p></div><button className="primary" onClick={() => onOpen("create")}>＋ New CSCOP</button></div>
      <div className="table"><div className="tr th"><span>Project</span><span>Lifecycle</span><span>Owner / Vendors</span><span>Current stage</span><span>Status</span><span/></div>{projects.map(p => <div className="tr" key={p.code}><span><b className="link">{p.code}</b><small>{p.name}</small></span><span><Pill tone={p.tone}>{p.track}</Pill></span><span><b>{p.owner}</b><small>{p.vendors}</small></span><span>{p.stage}</span><span><Pill tone={p.tone}>{p.status}</Pill></span><span><button className="arrow" onClick={() => onOpen("audit")}>→</button></span></div>)}</div>
    </section>
  </div>;
}

function CreateProject({ onOpen }: { onOpen: (v: View) => void }) {
  const [selected, setSelected] = useState(1);
  const tracks = [
    ["Discovery only", "Pre-GW1 → GW2", "Ends after feasibility sign-off. No build phase.", "Discovery closure"],
    ["Discovery → Delivery", "Pre-GW1 → GW5", "Starts with discovery, then transitions to full delivery.", "Project closure"],
    ["Direct delivery", "GW2 → GW5", "For a pre-approved solution. Discovery is skipped.", "Project closure"],
  ];
  return <div className="page narrow"><div className="stepper"><div className="done">✓</div><i/><div className="active">2</div><i/><div>3</div><span>Lifecycle</span><span>Project details</span><span>Review</span></div>
    <section className="panel form-panel"><div className="panel-head"><div><span className="kicker">Step 1</span><h3>Select lifecycle track</h3><p>This choice controls available stages, closure logic and the allocation template.</p></div></div>
      <div className="track-cards">{tracks.map((t, i) => <button key={t[0]} className={selected === i ? "selected" : ""} onClick={() => setSelected(i)}><span className="radio">{selected === i ? "●" : ""}</span><span className="track-icon">{i === 0 ? "◧" : i === 1 ? "⌘" : "▰"}</span><b>{t[0]}</b><Pill tone={i === 1 ? "amber" : i === 2 ? "green" : "blue"}>{t[1]}</Pill><p>{t[2]}</p><small>Closure: <strong>{t[3]}</strong></small></button>)}</div>
    </section>
    <section className="panel form-panel"><div className="panel-head"><div><span className="kicker">Step 2</span><h3>Project basics</h3><p>Required fields establish ownership before planning begins.</p></div><Pill tone="gray">Draft auto-saved</Pill></div>
      <div className="form-grid"><label>CSCOP code *<input defaultValue="CSCOP-1028"/></label><label>Intake no. (RITM) *<input placeholder="e.g. RITM1720912"/></label><label className="wide">Project name *<input placeholder="e.g. APAC Fulfillment Modernization"/></label><label>Domain *<select defaultValue=""><option value="" disabled>Select domain</option><option>Fulfillment</option><option>Corporate</option></select></label><label>Domain owner<input value="Auto-filled from domain" readOnly className="readonly"/></label><label>Assigned PM<input placeholder="Search employee"/></label><label className="wide">Participating vendors<div className="checks">{["Capgemini","Baison","Valtech","TW","Internal"].map((x,i)=><span key={x} className={i < 2 ? "checked" : ""}>{i < 2 ? "✓" : ""} {x}</span>)}</div></label></div>
      <div className="form-actions"><button className="secondary">Save draft</button><button className="primary" onClick={() => onOpen("audit")}>Create project & continue →</button></div>
    </section>
  </div>;
}

const stages = [
  { stage: "Pre-GW1 · Intake & discovery", rows: [["1.1","Intake assignment","2","3","4","—","—"],["1.3","BRD · Business requirements","2","3","—","—","—"],["1.4","High-level solution","—","3","—","4","—"]] },
  { stage: "GW1 → GW2 · Feasibility", rows: [["2.1","Product requirement document","—","4","2","—","—"],["2.2","Initiative solution design","1","3","4","6","—"],["2.7","Feature solution design","—","4","3","5","—"]] },
  { stage: "GW2 → GW3 · Development & testing", rows: [["3.2","Development by feature","3","8","5","30","—"],["3.3","System integration testing","—","4","2","—","10"],["3.4","Tech user acceptance test","1","—","—","—","5"]] },
];

function Allocation() {
  return <div className="page"><section className="selection-strip"><label>Project<select><option>CSCOP-417 · 3rd DC Foundation</option></select></label><label>Vendor<select><option>Capgemini</option></select></label><label>Quarter<select><option>FY26 Q1</option></select></label><div><span>Plan total</span><strong>96 MD</strong></div><button className="primary">Submit allocation</button></section>
    <section className="panel matrix-panel"><div className="panel-head"><div><h3>Manday allocation</h3><p>Enter planned days by Epic and delivery role. Discovery baseline locks at BRD sign-off.</p></div><Pill tone="amber">Editable · Before GW1</Pill></div>
      <div className="matrix"><div className="matrix-row matrix-head"><span>Epic / Deliverable</span><span>PM</span><span>BA</span><span>TL</span><span>DEV</span><span>QA</span><span>Total</span></div>{stages.map(s => <div key={s.stage} className="stage-group"><div className="stage-title">{s.stage}</div>{s.rows.map(r => <div className="matrix-row" key={r[0]}><span><small>{r[0]}</small><b>{r[1]}</b></span>{r.slice(2).map((v,i)=><span key={i} className={v !== "—" ? `value c${i}` : "dash"}>{v}</span>)}<span className="total">{r.slice(2).filter(x=>x!=="—").reduce((a,x)=>a+Number(x),0)}</span></div>)}</div>)}</div>
      <div className="matrix-total"><span>Column totals</span><b>9</b><b>32</b><b>20</b><b>45</b><b>15</b><strong>121 MD</strong></div>
    </section>
  </div>;
}

function Timesheet() {
  const [submitted, setSubmitted] = useState(false);
  const days = ["Mon 10", "Tue 11", "Wed 12", "Thu 13", "Fri 14"];
  return <div className="page"><section className="timesheet-hero"><div><span className="kicker">Week 33 · 10–14 Aug 2026</span><h2>Good morning, Jackie.</h2><p>Log actual hours against approved work. Your week is {submitted ? "submitted" : "almost complete"}.</p></div><div className="week-score"><strong>{submitted ? "40" : "36"}<em>/ 40h</em></strong><div><i style={{width: submitted ? "100%" : "90%"}}/></div><small>{submitted ? "Submitted for approval" : "4 hours remaining"}</small></div></section>
    <section className="panel"><div className="panel-head"><div><h3>My weekly timesheet</h3><p>Actuals roll up to Epic, vendor, CSCOP and portfolio views.</p></div><div className="week-nav"><button>‹</button><b>This week</b><button>›</button></div></div>
      <div className="time-grid"><div className="time-row time-head"><span>Project / Epic</span>{days.map(d=><span key={d}>{d}</span>)}<span>Total</span></div>
        <div className="time-row"><span><Pill tone="blue">CSCOP-417</Pill><b>3.2 · Development by feature</b><small>Capgemini · Delivery</small></span>{[8,8,8,8,4].map((x,i)=><span key={i}><input defaultValue={x}/></span>)}<strong>36h</strong></div>
        <div className="time-row empty"><span><button>＋ Add project or Epic</button></span>{days.map(d=><span key={d}>—</span>)}<span>—</span></div>
        <div className="time-row time-total"><span>Daily total</span>{[8,8,8,8,4].map((x,i)=><b key={i}>{x}h</b>)}<strong>36h</strong></div>
      </div>
      <div className="time-actions"><div className="validation"><span>✓</span><div><b>Ready to submit</b><p>No missing project codes or locked Epics.</p></div></div><button className="secondary">Save draft</button><button className="primary" onClick={()=>setSubmitted(true)}>{submitted ? "✓ Submitted" : "Submit week"}</button></div>
    </section>
    <div className="insight-grid"><article><span>Approved plan</span><strong>121 MD</strong><small>Capgemini · CSCOP-417</small></article><article><span>Actual to date</span><strong>74.5 MD</strong><small>61.6% consumed</small></article><article><span>Forecast at completion</span><strong>118 MD</strong><small className="up">3 MD under plan</small></article><article className="spark"><span>Burn trend</span><div><i/><i/><i/><i/><i/><i/></div><small>Healthy consumption</small></article></div>
  </div>;
}

function Audit() {
  const [locked, setLocked] = useState(false);
  return <div className="page"><section className="project-banner"><div><div className="project-title"><Pill tone="blue">CSCOP-417</Pill><h2>3rd DC Foundation · PO Release</h2></div><div className="banner-pills"><Pill tone="amber">Discovery → Delivery</Pill><Pill tone={locked ? "purple" : "amber"}>{locked ? "Signed & locked" : "Pending BRD sign-off"}</Pill></div></div><div className="milestones">{[["GW1","BRD target"],["GW2","Feasibility"],["GW3","Build & test"],["GW4","Tech release"],["GW5","Closure"]].map((x,i)=><div key={x[0]} className={i===0?"current":""}><span>{i===0?"✓":x[0]}</span><b>{x[1]}</b></div>)}</div></section>
    <section className="panel form-panel"><div className="panel-head"><div><span className="kicker">PgM mandatory metadata</span><h3>Project definition & gate dates</h3><p>Complete before BRD sign-off. Vendor planning remains gated until this section is ready.</p></div><Pill tone={locked ? "purple" : "green"}>{locked ? "Read only" : "Complete"}</Pill></div>
      <fieldset disabled={locked}><div className="form-grid audit-grid"><label>Goal *<select><option>Fulfillment excellence</option></select></label><label className="wide">Initiative *<input defaultValue="3rd DC + Service Center Foundation"/></label><label>Original initiative<input defaultValue="Global Logistics Expansion FY26"/></label><label>GW1 BRD sign-off date *<input type="date" defaultValue="2026-03-24"/></label><label>GW4 Tech release date *<input type="date" defaultValue="2026-05-18"/></label><label>Check-in quarter<select><option>FY26 Q1</option></select></label></div></fieldset>
      <div className="lock-zone"><div className="lock-copy"><span>{locked ? "▣" : "◇"}</span><div><b>{locked ? "Baseline locked" : "Ready for BRD sign-off"}</b><p>{locked ? "Metadata and Discovery allocation are now immutable. Changes require a governed exception." : "Signing creates an auditable snapshot and enables Delivery execution."}</p></div></div>{!locked && <button className="danger" onClick={()=>setLocked(true)}>Sign off BRD & lock</button>}</div>
    </section>
    <section className="panel"><div className="panel-head"><div><h3>Multi-vendor whole picture</h3><p>Approved plan and actual effort across project stages.</p></div><button className="secondary">Export .xlsx</button></div><div className="summary-table"><div className="sum-row sum-head"><span>Phase / Epic</span><span>Vendors</span><span>Plan</span><span>Actual</span><span>Variance</span><span>Status</span></div><div className="phase">Phase 1 · CSCOP-1 Discovery {locked ? "· Frozen" : "· Planning"}</div><div className="sum-row"><span><b>1.3 BRD</b><small>Pre-GW1</small></span><span><Pill tone="blue">Cap</Pill> <Pill tone="green">Baison</Pill></span><span>8 MD</span><span>8 MD</span><span className="up">0</span><span><Pill tone="green">Complete</Pill></span></div><div className="phase delivery">Phase 2 · CSCOP-2 Delivery · Active</div><div className="sum-row"><span><b>3.2 Development</b><small>GW2 → GW3</small></span><span><Pill tone="blue">Cap</Pill></span><span>56 MD</span><span>38 MD</span><span>18 MD</span><span><Pill tone="blue">In progress</Pill></span></div></div></section>
  </div>;
}

export default function Home() {
  const [view, setView] = useState<View>("flow");
  const [role, setRole] = useState<Role>("CCB");
  const current = useMemo(() => nav.find(n => n.id === view)!, [view]);
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">W</div><div><b>WBS Timesheet</b><span>FY26 SOP workspace</span></div></div><nav>{["Overview","Planning","Execution","Governance"].map(section => <div key={section} className="nav-section"><span>{section}</span>{nav.filter(n=>n.section===section).map(n=><button key={n.id} className={view===n.id?"active":""} onClick={()=>setView(n.id)}><i>{n.icon}</i>{n.label}{n.id==="audit"&&<em>2</em>}</button>)}</div>)}</nav><div className="sidebar-foot"><div className="help-card"><span>◇</span><b>Need process help?</b><small>View SOP governance guide</small></div><div className="user"><div className="avatar">JL</div><div><b>Jackie Chen</b><span>{role}</span></div><button>•••</button></div></div></aside>
    <div className="workspace"><Topbar title={current.label} eyebrow={`${current.section} · WBS Timesheet`} role={role} setRole={setRole}/>{view==="flow"&&<Flow onOpen={setView}/>} {view==="dashboard"&&<Dashboard onOpen={setView}/>} {view==="create"&&<CreateProject onOpen={setView}/>} {view==="allocation"&&<Allocation/>} {view==="timesheet"&&<Timesheet/>} {view==="audit"&&<Audit/>}</div>
  </main>;
}
