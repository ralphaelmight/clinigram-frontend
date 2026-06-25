import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Package, Wallet, Users, FileBarChart, Plus, X,
  Search, AlertTriangle, TrendingUp, TrendingDown, Trash2,
  ChevronRight, Pill, Stethoscope, BedDouble, FlaskConical, Receipt,
  CalendarDays, Save, Settings, Lock, ShieldCheck, Download,
  ScrollText, Eraser, KeyRound, ArrowLeft, UserPlus, LogOut,
  UserCog, Power, RotateCcw, Syringe, History,
  FileText, Activity, CalendarClock, PackagePlus, Printer,
  Banknote, Link2, AlertOctagon, Tag, WifiOff
} from "lucide-react";
import { api, getToken, setToken } from "./api";

/* ----------------------------- brand tokens ----------------------------- */

const RED = "#EC1C24";
const TEAL = "#42B4B8";
const WHITE = "#FFFFFF";
const INK = "#202733";
const MUTE = "#6B7B87";
const FAINT = "#9AA8B1";
const LINE = "#ECEFF1";
const BG = "#FFFFFF";

const REVENUE_CATEGORIES = ["Consultation", "Folder Opening", "Procedure", "Investigation", "Admission", "Pharmacy Sale", "Other"];
const EXPENSE_CATEGORIES = ["Salaries", "Utilities", "Supplies Purchase", "Equipment", "Maintenance", "Other"];
const SERVICE_CATEGORIES = ["Consultation", "Folder Opening", "Procedure", "Investigation"];
const UNITS = ["tablets", "vials", "bottles", "packs", "boxes", "units", "ampoules", "sachets"];
const ROLE_OPTIONS = ["Admin", "Pharmacist", "Front Desk", "Accounts", "Lab Scientist", "Nurse", "Doctor", "Paramedic", "HR", "Other"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const fmtNaira = (n) =>
  "\u20a6" + Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " \u00b7 " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const daysUntil = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - new Date(todayISO()).getTime();
  return Math.round(ms / 86400000);
};

const EXPIRY_WARNING_DAYS = 60;

/* ----------------------------- generic API-backed collection hook ----------------------------- */

function useApiCollection(endpoint, { enabled = true } = {}) {
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const rows = await api.get(endpoint);
      setData(rows);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }, [endpoint, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (body) => { const r = await api.post(endpoint, body); await refresh(); return r; };
  const update = async (id, body) => { const r = await api.put(`${endpoint}/${id}`, body); await refresh(); return r; };
  const remove = async (id) => { const r = await api.del(`${endpoint}/${id}`); await refresh(); return r; };

  return { data, loaded, error, refresh, create, update, remove, setData };
}

function useSummary(period, offset, ready) {
  const [summary, setSummary] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => {
    if (!ready) return;
    try {
      const s = await api.get(`/api/reports/summary?period=${period}&offset=${offset}`);
      setSummary(s);
    } catch (e) { /* ignore, will retry on next refresh */ }
    finally { setLoaded(true); }
  }, [period, offset, ready]);
  useEffect(() => { refresh(); }, [refresh]);
  return { summary, loaded, refresh };
}

/* ----------------------------- logo ----------------------------- */

function ClinigramMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r="19" fill={WHITE} />
      <path d="M20 3 A17 17 0 0 0 5.5 29.5 L13 25.2 A9.5 9.5 0 0 1 20 10.5 Z" fill={RED} />
      <path d="M20 36.5 A16.5 16.5 0 0 0 34.2 11 L26.8 15.3 A9 9 0 0 1 20 29.5 Z" fill={TEAL} />
    </svg>
  );
}

function ClinigramWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <ClinigramMark size={28} />
      <div>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: WHITE, lineHeight: 1.1 }}>Clinigram</div>
        <div style={{ fontSize: 9.5, letterSpacing: 1.2, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase" }}>Facility Manager</div>
      </div>
    </div>
  );
}

/* ----------------------------- shared UI bits ----------------------------- */

function Shell({ children }) {
  return (
    <div id="app-root" style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: INK }}>
      {children}
    </div>
  );
}

function TopBar({ title, subtitle, onSettings }) {
  return (
    <div style={{ background: RED, color: WHITE, padding: "16px 16px 22px", borderRadius: "0 0 18px 18px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <ClinigramWordmark />
        {onSettings && (
          <button onClick={onSettings} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10, padding: 7, cursor: "pointer" }}>
            <Settings size={17} color={WHITE} />
          </button>
        )}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, marginTop: 14 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function Card({ children, style, ...rest }) {
  return (
    <div{...rest} style={{ background: WHITE, borderRadius: 14, padding: 16, border: `1px solid ${LINE}`, boxShadow: "0 1px 3px rgba(20,40,60,0.05)", ...style }}>
      {children}
    </div>
  );
}

function Stat({ icon, label, value, color, sub }) {
  return (
    <Card style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div style={{ fontSize: 12, color: MUTE, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: INK }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: FAINT, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

function LockedStat({ label, icon, color }) {
  return (
    <Card style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div style={{ fontSize: 12, color: MUTE, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: FAINT }}>
        <Lock size={14} /><span style={{ fontSize: 13.5, fontWeight: 700 }}>Admin only</span>
      </div>
    </Card>
  );
}

function FAB({ onClick, label = "Add" }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed", bottom: 88, right: 18, zIndex: 30,
        background: TEAL, color: WHITE, border: "none", borderRadius: 28,
        padding: "13px 20px", display: "flex", alignItems: "center", gap: 6,
        fontWeight: 700, fontSize: 14, boxShadow: "0 6px 16px rgba(66,180,184,0.45)",
        cursor: "pointer"
      }}
    >
      <Plus size={18} /> {label}
    </button>
  );
}

function Sheet({ title, onClose, children, onBack }) {
  return (
    <div className="app-no-print" style={{ position: "fixed", inset: 0, background: "rgba(20,30,40,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: WHITE, width: "100%", maxHeight: "88vh", overflowY: "auto",
          borderRadius: "20px 20px 0 0", padding: "16px 18px 28px",
          animation: "slideUp 0.22s ease-out"
        }}
      >
        <div style={{ width: 36, height: 4, background: LINE, borderRadius: 4, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {onBack && (
              <button onClick={onBack} style={{ background: "#F4F5F6", border: "none", borderRadius: 9, padding: 6, cursor: "pointer" }}>
                <ArrowLeft size={16} color={MUTE} />
              </button>
            )}
            <div style={{ fontSize: 17, fontWeight: 700, color: RED }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: "#F4F5F6", border: "none", borderRadius: 10, padding: 6, cursor: "pointer" }}>
            <X size={18} color={MUTE} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 12, ...style }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: MUTE, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 12px", borderRadius: 10, border: `1.5px solid ${LINE}`,
  fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#FBFCFD", color: INK
};

function Input(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function Select({ options, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function TextArea(props) { return <textarea {...props} style={{ ...inputStyle, minHeight: 70, resize: "vertical", ...(props.style || {}) }} />; }

function PrimaryButton({ children, onClick, disabled, color = TEAL }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", background: disabled ? "#D9DEE1" : color, color: WHITE, border: "none",
        borderRadius: 12, padding: "13px 0", fontSize: 15.5, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, color = MUTE }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: "none", border: "none", color, fontWeight: 700, fontSize: 13.5, padding: "12px 0 2px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
      {children}
    </button>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div style={{ background: "#FDEAEA", color: RED, fontSize: 12.5, fontWeight: 600, padding: "9px 12px", borderRadius: 10, marginBottom: 10 }}>{message}</div>;
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px", color: FAINT }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{text}</div>
      {sub && <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <Search size={16} color={FAINT} style={{ position: "absolute", left: 12, top: 12 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 36 }} />
    </div>
  );
}

function Row({ label, value, color, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid #F1F4F6`, fontSize: 13.5 }}>
      <span style={{ color: MUTE }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 700, color: color || INK }}>{value}</span>
    </div>
  );
}

function LockedRow({ label }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid #F1F4F6`, fontSize: 13.5 }}>
      <span style={{ color: MUTE }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4, color: FAINT, fontWeight: 700 }}><Lock size={12} /> Admin only</span>
    </div>
  );
}

function RoleBadge({ role }) {
  const admin = role === "Admin";
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: admin ? "#FDEAEA" : "#EAF8F8", color: admin ? RED : TEAL }}>{role}</span>;
}

function Avatar({ name, role, size = 38 }) {
  const admin = role === "Admin";
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0, background: admin ? "#FDEAEA" : "#EAF8F8", color: admin ? RED : TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4 }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

/* ----------------------------- Bottom Nav ----------------------------- */

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "dashboard", icon: LayoutDashboard, label: "Home" },
    { id: "inventory", icon: Package, label: "Stock" },
    { id: "visits", icon: Stethoscope, label: "Visits" },
    { id: "finance", icon: Wallet, label: "Finance" },
    { id: "patients", icon: Users, label: "Patients" },
    { id: "report", icon: FileBarChart, label: "Report" },
  ];
  return (
    <div className="app-no-print" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: WHITE, borderTop: `1px solid ${LINE}`, display: "flex", justifyContent: "space-around", padding: "8px 4px 10px", zIndex: 40 }}>
      {items.map((it) => {
        const active = tab === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: active ? RED : FAINT, flex: 1, padding: "2px 0" }}>
            <Icon size={21} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------- Auth ----------------------------- */

function RoleSelect({ value, customValue, onChange, onCustomChange }) {
  return (
    <>
      <Select value={value} onChange={(e) => onChange(e.target.value)} options={ROLE_OPTIONS} />
      {value === "Other" && <Input style={{ marginTop: 8 }} value={customValue} onChange={(e) => onCustomChange(e.target.value)} placeholder="Type role title" />}
    </>
  );
}

function CreateAdminScreen({ onDone }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    if (pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
    if (pin !== pin2) { setError("PINs don't match"); return; }
    setBusy(true);
    try {
      const r = await api.post("/api/auth/setup-admin", { name: name.trim(), pin });
      setToken(r.token);
      onDone(r.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: RED, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: WHITE, borderRadius: 18, padding: 28, width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><ClinigramMark size={48} /></div>
        <div style={{ fontWeight: 800, fontSize: 17, color: INK, marginBottom: 2 }}>Welcome to Clinigram Facility Manager</div>
        <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 18 }}>Set up the first Admin account for your facility</div>
        <div style={{ textAlign: "left" }}>
          <Field label="Your name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Field>
          <Field label="Set a PIN"><Input type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="At least 4 digits" /></Field>
          <Field label="Confirm PIN"><Input type="password" inputMode="numeric" maxLength={8} value={pin2} onChange={(e) => { setPin2(e.target.value.replace(/\D/g, "")); setError(""); }} /></Field>
        </div>
        {error && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{error}</div>}
        <PrimaryButton onClick={submit} color={RED} disabled={busy}><ShieldCheck size={15} /> {busy ? "Creating..." : "Create Admin account"}</PrimaryButton>
        <div style={{ fontSize: 11, color: FAINT, marginTop: 14, lineHeight: 1.5 }}>
          As Admin, you'll be the only one who can see total revenue figures, manage staff accounts,
          set service prices, and delete transactions \u2014 everyone else can still log activity.
        </div>
      </div>
    </div>
  );
}

function UserSelectScreen({ staffList, onPick }) {
  const active = staffList.filter((u) => u.active);
  return (
    <div style={{ minHeight: "100vh", background: RED, padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><ClinigramMark size={48} /></div>
      <div style={{ textAlign: "center", color: WHITE, fontWeight: 800, fontSize: 17, marginBottom: 2 }}>Who's on duty?</div>
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 12.5, marginBottom: 20 }}>Select your name to sign in</div>
      <div style={{ maxWidth: 360, margin: "0 auto" }}>
        {active.map((u) => (
          <button key={u.id} onClick={() => onPick(u)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: WHITE, border: "none", borderRadius: 14, padding: "12px 14px", marginBottom: 10, cursor: "pointer" }}>
            <Avatar name={u.name} role={u.role} />
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>{u.name}</div>
              <RoleBadge role={u.role} />
            </div>
            <ChevronRight size={17} color={FAINT} />
          </button>
        ))}
        {active.length === 0 && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 20 }}>No active accounts. Ask an Admin to reactivate your account.</div>}
      </div>
    </div>
  );
}

function PinEntryScreen({ user, onSuccess, onBack }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const r = await api.post("/api/auth/login", { staffId: user.id, pin });
      setToken(r.token);
      onSuccess(r.user);
    } catch (e) {
      setError(e.message); setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: RED, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div style={{ background: WHITE, borderRadius: 18, padding: 28, width: "100%", maxWidth: 360, textAlign: "center", position: "relative" }}>
        <button onClick={onBack} style={{ position: "absolute", top: 14, left: 14, background: "#F4F5F6", border: "none", borderRadius: 9, padding: 6, cursor: "pointer" }}><ArrowLeft size={16} color={MUTE} /></button>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Avatar name={user.name} role={user.role} size={52} /></div>
        <div style={{ fontWeight: 800, fontSize: 16, color: INK }}>{user.name}</div>
        <div style={{ marginBottom: 16 }}><RoleBadge role={user.role} /></div>
        <Input type="password" inputMode="numeric" maxLength={8} placeholder="Enter your PIN" value={pin} autoFocus
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={{ textAlign: "center", fontSize: 20, letterSpacing: 6, marginBottom: 10 }} />
        {error && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{error}</div>}
        <PrimaryButton onClick={submit} color={RED} disabled={busy}><Lock size={15} /> {busy ? "Checking..." : "Sign in"}</PrimaryButton>
      </div>
    </div>
  );
}

function ConnectionError({ onRetry }) {
  return (
    <div style={{ minHeight: "100vh", background: RED, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: WHITE, borderRadius: 18, padding: 28, width: "100%", maxWidth: 360, textAlign: "center" }}>
        <WifiOff size={36} color={RED} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 800, fontSize: 16, color: INK, marginBottom: 6 }}>Can't reach the server</div>
        <div style={{ fontSize: 13, color: MUTE, marginBottom: 16, lineHeight: 1.5 }}>
          Check your internet connection. If this is the first request in a while, the free server
          may just be waking up \u2014 this can take up to a minute.
        </div>
        <PrimaryButton onClick={onRetry} color={RED}>Try again</PrimaryButton>
      </div>
    </div>
  );
}

function AuthGate({ onLogin }) {
  const [staffList, setStaffList] = useState(null);
  const [picked, setPicked] = useState(null);
  const [connErr, setConnErr] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      const rows = await api.get("/api/staff");
      setStaffList(rows);
      setConnErr(false);
    } catch (e) {
      setConnErr(true);
    }
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  if (connErr) return <ConnectionError onRetry={loadStaff} />;
  if (staffList === null) {
    return <div style={{ minHeight: "100vh", background: RED, display: "flex", alignItems: "center", justifyContent: "center", color: WHITE, fontSize: 13.5 }}>Connecting...</div>;
  }
  if (staffList.length === 0) {
    return <CreateAdminScreen onDone={onLogin} />;
  }
  if (picked) {
    return <PinEntryScreen user={picked} onBack={() => setPicked(null)} onSuccess={onLogin} />;
  }
  return <UserSelectScreen staffList={staffList} onPick={setPicked} />;
}

/* ----------------------------- Manage Users (Admin) ----------------------------- */

function ManageUsers({ staffCol, currentUser, onClose }) {
  const { data: users, create, update } = staffCol;
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", role: "Front Desk", customRole: "", pin: "", pin2: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const adminCount = users.filter((u) => u.role === "Admin" && u.active).length;

  const openAdd = () => { setForm({ name: "", role: "Front Desk", customRole: "", pin: "", pin2: "" }); setError(""); setEditing("add"); };
  const openEdit = (u) => { setForm({ name: u.name, role: ROLE_OPTIONS.includes(u.role) ? u.role : "Other", customRole: ROLE_OPTIONS.includes(u.role) ? "" : u.role, pin: "", pin2: "" }); setError(""); setEditing(u.id); };
  const resolvedRole = () => (form.role === "Other" ? (form.customRole.trim() || "Other") : form.role);

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true); setError("");
    try {
      if (editing === "add") {
        if (form.pin.length < 4 || form.pin !== form.pin2) { setError("PINs must match and be at least 4 digits"); setBusy(false); return; }
        await create({ name: form.name.trim(), role: resolvedRole(), pin: form.pin });
      } else {
        await update(editing, { name: form.name.trim(), role: resolvedRole() });
      }
      setEditing(null);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const toggleActive = async (u) => {
    try { await update(u.id, { active: !u.active }); }
    catch (e) { setError(e.message); }
  };

  const resetPin = async (u) => {
    if (form.pin.length < 4 || form.pin !== form.pin2) { setError("PINs must match and be at least 4 digits"); return; }
    try { await update(u.id, { newPin: form.pin }); setForm({ ...form, pin: "", pin2: "" }); }
    catch (e) { setError(e.message); }
  };

  if (editing) {
    const existing = editing !== "add" ? users.find((u) => u.id === editing) : null;
    return (
      <Sheet title={editing === "add" ? "Add staff account" : `Edit ${existing.name}`} onClose={onClose} onBack={() => setEditing(null)}>
        <ErrorBanner message={error} />
        <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Role"><RoleSelect value={form.role} customValue={form.customRole} onChange={(v) => setForm({ ...form, role: v })} onCustomChange={(v) => setForm({ ...form, customRole: v })} /></Field>
        {editing === "add" ? (
          <>
            <Field label="Set PIN"><Input type="password" inputMode="numeric" maxLength={8} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Confirm PIN"><Input type="password" inputMode="numeric" maxLength={8} value={form.pin2} onChange={(e) => setForm({ ...form, pin2: e.target.value.replace(/\D/g, "") })} /></Field>
            <PrimaryButton color={RED} onClick={save} disabled={busy || !form.name.trim() || form.pin.length < 4 || form.pin !== form.pin2}><Save size={16} /> Create account</PrimaryButton>
          </>
        ) : (
          <>
            <PrimaryButton color={RED} onClick={save} disabled={busy}><Save size={16} /> Save changes</PrimaryButton>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: MUTE, margin: "16px 0 5px" }}>Reset their PIN</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input type="password" inputMode="numeric" maxLength={8} placeholder="New PIN" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} />
              <Input type="password" inputMode="numeric" maxLength={8} placeholder="Confirm" value={form.pin2} onChange={(e) => setForm({ ...form, pin2: e.target.value.replace(/\D/g, "") })} />
            </div>
            <GhostButton color={TEAL} onClick={() => resetPin(existing)}><RotateCcw size={14} /> Reset PIN</GhostButton>
            <GhostButton color={RED} onClick={() => toggleActive(existing)}><Power size={14} /> {existing.active ? "Deactivate account" : "Reactivate account"}</GhostButton>
            {existing.role === "Admin" && existing.active && adminCount <= 1 && (
              <div style={{ fontSize: 11.5, color: FAINT, textAlign: "center", marginTop: 4 }}>This is the only active Admin, so it can't be deactivated.</div>
            )}
          </>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Manage staff accounts" onClose={onClose}>
      {users.map((u) => (
        <button key={u.id} onClick={() => openEdit(u)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 12px", marginBottom: 9, cursor: "pointer", opacity: u.active ? 1 : 0.5 }}>
          <Avatar name={u.name} role={u.role} size={34} />
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}{u.id === currentUser.id ? " (you)" : ""}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}><RoleBadge role={u.role} />{!u.active && <span style={{ fontSize: 10.5, color: FAINT, fontWeight: 600 }}>Inactive</span>}</div>
          </div>
          <ChevronRight size={16} color={FAINT} />
        </button>
      ))}
      <PrimaryButton color={TEAL} onClick={openAdd}><UserPlus size={16} /> Add staff account</PrimaryButton>
    </Sheet>
  );
}

/* ----------------------------- Manage price list (Admin) ----------------------------- */

function InvestigationRecipeEditor({ service, inventory, onMutate }) {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try { setRecipes(await api.get(`/api/services/${service.id}/recipes`)); }
    catch (e) { setError(e.message); }
    finally { setLoaded(true); }
  }, [service.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const addRecipe = async () => {
    if (!pickId) { setError("Choose a consumable"); return; }
    const qty = Number(pickQty);
    if (!qty || qty <= 0) { setError("Enter a valid quantity"); return; }
    try {
      await api.post(`/api/services/${service.id}/recipes`, { inventoryItemId: pickId, quantityUsed: qty });
      setPickId(""); setPickQty("1"); setError("");
      await refresh(); onMutate();
    } catch (e) { setError(e.message); }
  };

  const updateQty = async (recipe, qty) => {
    try { await api.put(`/api/recipes/${recipe.id}`, { quantityUsed: qty }); await refresh(); onMutate(); }
    catch (e) { setError(e.message); }
  };

  const removeRecipe = async (recipe) => {
    try { await api.del(`/api/recipes/${recipe.id}`); await refresh(); onMutate(); }
    catch (e) { setError(e.message); }
  };

  const usedItemIds = recipes.map((r) => r.inventory_item_id);
  const availableItems = inventory.filter((i) => !usedItemIds.includes(i.id));

  return (
    <Field label="Consumables used (deducted from stock per investigation run)">
      {loaded && recipes.length === 0 && <div style={{ fontSize: 12, color: FAINT, marginBottom: 8 }}>No consumables linked yet \u2014 this investigation won't deduct any stock.</div>}
      {recipes.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: `1px solid #F1F4F6` }}>
          <div style={{ flex: 1, fontSize: 13 }}>{r.inventory_item_name}</div>
          <Input type="number" min="0" step="any" value={r.quantity_used} onChange={(e) => updateQty(r, e.target.value)} style={{ width: 70 }} />
          <span style={{ fontSize: 12, color: FAINT }}>{r.inventory_item_unit}</span>
          <button onClick={() => removeRecipe(r)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={14} color="#D9DEE1" /></button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <select value={pickId} onChange={(e) => { setPickId(e.target.value); setError(""); }} style={{ ...inputStyle, flex: 2 }}>
          <option value="">Add consumable...</option>
          {availableItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <Input type="number" min="0" step="any" value={pickQty} onChange={(e) => setPickQty(e.target.value)} style={{ flex: 1 }} />
      </div>
      <button onClick={addRecipe} style={{ marginTop: 8, width: "100%", background: "#EAF8F8", color: TEAL, border: "none", borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "center", gap: 5 }}><Plus size={14} /> Add consumable</button>
      {error && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>{error}</div>}
    </Field>
  );
}

function ManageServices({ servicesCol, inventoryCol, onClose }) {
  const { data: services, create, update, remove } = servicesCol;
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Consultation", price: "", is_outsourced: false, external_cost: "" });
  const [error, setError] = useState("");

  const openAdd = () => { setForm({ name: "", category: "Consultation", price: "", is_outsourced: false, external_cost: "" }); setError(""); setEditing("add"); };
  const openEdit = (s) => { setForm({ ...s, external_cost: s.external_cost ?? "" }); setError(""); setEditing(s.id); };

  const isInvestigation = form.category === "Investigation";

  const save = async () => {
    if (!form.name.trim() || form.price === "") return;
    const payload = { name: form.name.trim(), category: form.category, price: form.price };
    if (isInvestigation) {
      payload.isOutsourced = !!form.is_outsourced;
      payload.externalCost = form.is_outsourced ? (form.external_cost === "" ? null : form.external_cost) : null;
    }
    try {
      if (editing === "add") await create(payload);
      else await update(editing, payload);
      setEditing(null);
    } catch (e) { setError(e.message); }
  };
  const toggleActive = async (s) => { try { await update(s.id, { active: !s.active }); } catch (e) { setError(e.message); } };
  const removeIt = async (s) => { try { await remove(s.id); setEditing(null); } catch (e) { setError(e.message); } };

  if (editing) {
    const existing = editing !== "add" ? services.find((s) => s.id === editing) : null;
    return (
      <Sheet title={editing === "add" ? "Add price list item" : "Edit price"} onClose={onClose} onBack={() => setEditing(null)}>
        <ErrorBanner message={error} />
        <Field label="Service / fee name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. General Consultation" /></Field>
        <Field label="Category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={SERVICE_CATEGORIES} /></Field>
        <Field label="Price (\u20a6)"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" /></Field>

        {isInvestigation && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: INK, marginBottom: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={!!form.is_outsourced} onChange={(e) => setForm({ ...form, is_outsourced: e.target.checked })} /> Outsourced to an external lab
            </label>
            {form.is_outsourced ? (
              <Field label="External cost (\u20a6, what the clinic pays the lab \u2014 not billed to the patient)">
                <Input type="number" value={form.external_cost} onChange={(e) => setForm({ ...form, external_cost: e.target.value })} placeholder="0" />
              </Field>
            ) : existing ? (
              <InvestigationRecipeEditor service={existing} inventory={inventoryCol.data} onMutate={() => {}} />
            ) : (
              <div style={{ fontSize: 12, color: FAINT, marginBottom: 10 }}>Save this investigation first, then reopen it here to link the consumables it uses.</div>
            )}
          </>
        )}

        <PrimaryButton color={RED} onClick={save}><Save size={16} /> Save</PrimaryButton>
        {existing && (
          <>
            <GhostButton color={TEAL} onClick={() => toggleActive(existing)}><Power size={14} /> {existing.active ? "Deactivate" : "Reactivate"}</GhostButton>
            <GhostButton color={RED} onClick={() => removeIt(existing)}><Trash2 size={14} /> Remove</GhostButton>
          </>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Price list" onClose={onClose}>
      <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 10 }}>Set standard fees for consultations, folder opening, procedures and investigations.</div>
      {SERVICE_CATEGORIES.map((cat) => {
        const items = services.filter((s) => s.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: TEAL, marginBottom: 6 }}>{cat}</div>
            {items.map((s) => (
              <button key={s.id} onClick={() => openEdit(s)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 12px", marginBottom: 7, cursor: "pointer", opacity: s.active ? 1 : 0.5 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}{!s.active ? " (inactive)" : ""}</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: RED }}>{fmtNaira(s.price)}</span>
              </button>
            ))}
          </div>
        );
      })}
      {services.length === 0 && <EmptyState icon={<Tag size={36} />} text="No price list items yet" />}
      <PrimaryButton color={TEAL} onClick={openAdd}><Plus size={16} /> Add price list item</PrimaryButton>
    </Sheet>
  );
}

/* ----------------------------- Settings ----------------------------- */

function SettingsSheet({ onClose, currentUser, staffCol, servicesCol, inventoryCol, auditCol, onWipe, onLogout }) {
  const [view, setView] = useState("main");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [pinError, setPinError] = useState("");
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [exporting, setExporting] = useState(false);

  const isAdmin = currentUser.role === "Admin";

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await api.get("/api/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `clinigram-facility-data-${todayISO()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { /* swallow - could show toast */ }
    finally { setExporting(false); }
  };

  const changeMyPin = async () => {
    if (newPin.length < 4) { setPinError("New PIN must be at least 4 digits"); return; }
    if (newPin !== newPin2) { setPinError("New PINs don't match"); return; }
    try {
      await api.put("/api/auth/my-pin", { oldPin, newPin });
      setView("main"); setOldPin(""); setNewPin(""); setNewPin2(""); setPinError("");
    } catch (e) { setPinError(e.message); }
  };

  if (view === "manageUsers") return <ManageUsers staffCol={staffCol} currentUser={currentUser} onClose={onClose} />;
  if (view === "manageServices") return <ManageServices servicesCol={servicesCol} inventoryCol={inventoryCol} onClose={onClose} />;

  if (view === "pin") {
    return (
      <Sheet title="Change my PIN" onClose={onClose} onBack={() => setView("main")}>
        <Field label="Current PIN"><Input type="password" inputMode="numeric" value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="New PIN"><Input type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="Confirm new PIN"><Input type="password" inputMode="numeric" value={newPin2} onChange={(e) => setNewPin2(e.target.value.replace(/\D/g, ""))} /></Field>
        {pinError && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{pinError}</div>}
        <PrimaryButton onClick={changeMyPin} color={RED}><KeyRound size={15} /> Update PIN</PrimaryButton>
      </Sheet>
    );
  }

  if (view === "audit") {
    return (
      <Sheet title="Audit log" onClose={onClose} onBack={() => setView("main")}>
        <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 10 }}>Every action below is attributed to the staff account that performed it, recorded automatically by the server.</div>
        {auditCol.data.length === 0 ? (
          <EmptyState icon={<ScrollText size={36} />} text="No activity logged yet" />
        ) : (
          auditCol.data.map((e, i) => (
            <div key={e.id || i} style={{ padding: "8px 0", borderTop: "1px solid #F1F4F6" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.action}</div>
              <div style={{ fontSize: 11, color: FAINT }}>{e.by_name || "Unknown"}{e.by_role ? ` (${e.by_role})` : ""} \u00b7 {fmtDateTime(e.at)}</div>
            </div>
          ))
        )}
      </Sheet>
    );
  }

  if (view === "privacy") {
    return (
      <Sheet title="Privacy & NDPA notice" onClose={onClose} onBack={() => setView("main")}>
        <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.6 }}>
          <p><b>What we collect.</b> Patient name, hospital number and phone number, recorded for identifying patient folders and supporting care delivery and billing at Clinigram Healthcare.</p>
          <p><b>Lawful basis.</b> Performance of healthcare services and Clinigram's legitimate operational interest, in line with the Nigeria Data Protection Act (NDPA) 2023.</p>
          <p><b>Who can access it.</b> Staff with an account created by an Admin, over an encrypted connection. PINs are stored as one-way hashes, never in plain text.</p>
          <p><b>Retention.</b> Records are kept for as long as needed for care continuity and statutory requirements, and can be deleted individually at any time.</p>
          <p><b>Accountability.</b> Every action is logged server-side with the staff member's name, role and a timestamp.</p>
          <p style={{ color: MUTE, fontSize: 12 }}>This in-app notice covers technical safeguards only. Clinigram should also maintain organisational policies (staff training, a designated data protection contact, and incident response steps) to be fully NDPA compliant.</p>
        </div>
      </Sheet>
    );
  }

  if (view === "wipe") {
    return (
      <Sheet title="Erase all data" onClose={onClose} onBack={() => setView("main")}>
        <div style={{ fontSize: 13.5, color: INK, marginBottom: 12, lineHeight: 1.5 }}>
          This permanently deletes all inventory, finance, patient, dispensation, restock and reconciliation records on the server. Staff accounts and the price list are kept. This cannot be undone. Type <b>DELETE</b> to confirm.
        </div>
        <Input value={wipeConfirm} onChange={(e) => setWipeConfirm(e.target.value)} placeholder="DELETE" />
        <PrimaryButton color={RED} disabled={wipeConfirm !== "DELETE"} onClick={() => { onWipe(); onClose(); }}><Eraser size={15} /> Erase everything</PrimaryButton>
      </Sheet>
    );
  }

  return (
    <Sheet title="Settings" onClose={onClose}>
      <Card style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Avatar name={currentUser.name} role={currentUser.role} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{currentUser.name}</div>
          <RoleBadge role={currentUser.role} />
        </div>
      </Card>
      <SettingsRow icon={<KeyRound size={16} color={RED} />} label="Change my PIN" onClick={() => setView("pin")} />
      {isAdmin && <SettingsRow icon={<UserCog size={16} color={TEAL} />} label="Manage staff accounts" onClick={() => setView("manageUsers")} />}
      {isAdmin && <SettingsRow icon={<Tag size={16} color={TEAL} />} label="Manage price list" onClick={() => setView("manageServices")} />}
      <SettingsRow icon={<ShieldCheck size={16} color={TEAL} />} label="Privacy & NDPA notice" onClick={() => setView("privacy")} />
      <SettingsRow icon={<ScrollText size={16} color={RED} />} label="Audit log" onClick={() => setView("audit")} />
      <SettingsRow icon={<Download size={16} color={TEAL} />} label={exporting ? "Exporting..." : "Export all data (.json)"} onClick={exportData} />
      {isAdmin && <SettingsRow icon={<Eraser size={16} color={RED} />} label="Erase all data" onClick={() => setView("wipe")} danger />}
      <SettingsRow icon={<LogOut size={16} color={MUTE} />} label="Switch user / sign out" onClick={onLogout} />
      <div style={{ fontSize: 11, color: FAINT, marginTop: 14, textAlign: "center" }}>Connected to your facility's online server.</div>
    </Sheet>
  );
}

function SettingsRow({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px 14px", marginBottom: 9, cursor: "pointer" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: "#F6F7F8", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <span style={{ fontSize: 14, fontWeight: 600, color: danger ? RED : INK, flex: 1, textAlign: "left" }}>{label}</span>
      <ChevronRight size={16} color={FAINT} />
    </button>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function Dashboard({ inventoryCol, servicesCol, visitsCol, summary, setTab, onSettings, currentUser, onMutate }) {
  const isAdmin = currentUser.role === "Admin";
  const lowStock = summary?.lowStockItems || [];
  const expiring = summary?.expiringItems || [];
  const outstandingVisits = (visitsCol?.data || []).filter((v) => Number(v.outstanding_balance) > 0).sort((a, b) => Number(b.outstanding_balance) - Number(a.outstanding_balance));
  const [activeVisitId, setActiveVisitId] = useState(null);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <TopBar title={`Good day, ${currentUser.name.split(" ")[0]}`} subtitle={`${currentUser.role} \u00b7 ${summary ? summary.label : ""}`} onSettings={onSettings} />
      <div style={{ display: "flex", gap: 10, marginTop: -14, marginBottom: 12 }}>
        {isAdmin
          ? <Stat icon={<TrendingUp size={15} color={TEAL} />} color={TEAL} label="Revenue" value={fmtNaira(summary?.revenue)} sub="this week" />
          : <LockedStat icon={<TrendingUp size={15} color={TEAL} />} color={TEAL} label="Revenue" />}
        <Stat icon={<TrendingDown size={15} color={RED} />} color={RED} label="Expenditure" value={fmtNaira(summary?.expenditure)} sub="this week" />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Stat icon={<Users size={15} color={RED} />} color={RED} label="New patients" value={summary?.newPatients ?? "\u2014"} sub="this week" />
        <Stat icon={<Package size={15} color={TEAL} />} color={TEAL} label="Low stock" value={lowStock.length} sub="items need reorder" />
      </div>

      {expiring.length > 0 && (
        <Card style={{ marginBottom: 14, border: `1.5px solid ${RED}33` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><CalendarClock size={16} color={RED} /><div style={{ fontWeight: 700, fontSize: 14, color: RED }}>Stock expiring soon</div></div>
          {expiring.slice(0, 4).map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5, borderTop: "1px solid #FBEAEA" }}>
              <span>{i.name}</span><span style={{ fontWeight: 700, color: RED }}>{i.daysLeft < 0 ? "Expired" : `${i.daysLeft}d left`}</span>
            </div>
          ))}
          {expiring.length > 4 && <div onClick={() => setTab("inventory")} style={{ fontSize: 12.5, color: TEAL, fontWeight: 700, marginTop: 6, cursor: "pointer" }}>View all {expiring.length} \u2192</div>}
        </Card>
      )}

      {outstandingVisits.length > 0 && (
        <Card style={{ marginBottom: 14, border: `1.5px solid ${RED}33` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><AlertOctagon size={16} color={RED} /><div style={{ fontWeight: 700, fontSize: 14, color: RED }}>Outstanding balances</div></div>
          {outstandingVisits.slice(0, 4).map((v) => (
            <div key={v.id} onClick={() => setActiveVisitId(v.id)} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5, borderTop: "1px solid #FBEAEA", cursor: "pointer" }}>
              <span>{v.patient_name} <span style={{ color: FAINT }}>· HN {v.hospital_number}</span></span><span style={{ fontWeight: 700, color: RED }}>{fmtNaira(v.outstanding_balance)}</span>
            </div>
          ))}
          {outstandingVisits.length > 4 && <div onClick={() => setTab("visits")} style={{ fontSize: 12.5, color: TEAL, fontWeight: 700, marginTop: 6, cursor: "pointer" }}>View all {outstandingVisits.length} →</div>}
        </Card>
      )}

      {activeVisitId && (
        <VisitDetailSheet
          visitId={activeVisitId}
          inventory={inventoryCol.data}
          services={servicesCol.data}
          onClose={() => { setActiveVisitId(null); visitsCol.refresh(); }}
          onMutate={() => { visitsCol.refresh(); inventoryCol.refresh(); onMutate(); }}
        />
      )}

      {lowStock.length > 0 && (
        <Card style={{ marginBottom: 14, border: `1.5px solid ${RED}33` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><AlertTriangle size={16} color={RED} /><div style={{ fontWeight: 700, fontSize: 14, color: RED }}>Low stock alert</div></div>
          {lowStock.slice(0, 4).map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5, borderTop: "1px solid #FBEAEA" }}>
              <span>{i.name}</span><span style={{ fontWeight: 700, color: RED }}>{i.quantity} {i.unit} left</span>
            </div>
          ))}
          {lowStock.length > 4 && <div onClick={() => setTab("inventory")} style={{ fontSize: 12.5, color: TEAL, fontWeight: 700, marginTop: 6, cursor: "pointer" }}>View all {lowStock.length} \u2192</div>}
        </Card>
      )}

      <div style={{ fontSize: 14, fontWeight: 700, color: RED, marginBottom: 8 }}>Quick actions</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <QuickAction icon={<Pill size={18} color={TEAL} />} label="Add stock item" onClick={() => setTab("inventory")} />
        <QuickAction icon={<Syringe size={18} color={RED} />} label="Dispense to patient" onClick={() => setTab("inventory")} />
        <QuickAction icon={<Receipt size={18} color={RED} />} label="Log transaction" onClick={() => setTab("finance")} />
        <QuickAction icon={<Banknote size={18} color={TEAL} />} label="Cash reconciliation" onClick={() => setTab("finance")} />
        <QuickAction icon={<Users size={18} color={RED} />} label="New patient folder" onClick={() => setTab("patients")} />
        <QuickAction icon={<FileBarChart size={18} color={TEAL} />} label="View report" onClick={() => setTab("report")} />
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 14, padding: "14px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F6F7F8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{label}</span>
    </button>
  );
}

/* ----------------------------- Restock ----------------------------- */

function RestockSheet({ item, restocksCol, onClose }) {
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState(item.cost_price || "");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const q = Number(qty);
    if (!q || q <= 0) { setError("Enter a valid quantity"); return; }
    setBusy(true);
    try {
      await restocksCol.create({ itemId: item.id, qtyAdded: q, unitCost: unitCost || null, supplier });
      onClose();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Sheet title={`Restock ${item.name}`} onClose={onClose}>
      <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 10 }}>Current stock: {item.quantity} {item.unit}</div>
      <Field label={`Quantity received (${item.unit})`}><Input type="number" value={qty} onChange={(e) => { setQty(e.target.value); setError(""); }} placeholder="0" autoFocus /></Field>
      <Field label="Unit cost (\u20a6, optional)"><Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0" /></Field>
      <Field label="Supplier (optional)"><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. MedPlus Distributors" /></Field>
      {error && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{error}</div>}
      <PrimaryButton onClick={submit} color={TEAL} disabled={busy}><PackagePlus size={16} /> {busy ? "Saving..." : "Confirm restock"}</PrimaryButton>
    </Sheet>
  );
}

function RestockHistorySheet({ restocks, onClose }) {
  return (
    <Sheet title="Restock log" onClose={onClose}>
      {restocks.length === 0 ? (
        <EmptyState icon={<History size={36} />} text="No restocks recorded yet" />
      ) : (
        restocks.map((r) => (
          <div key={r.id} style={{ padding: "10px 0", borderTop: `1px solid #F1F4F6` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.item_name}</div>
              <div style={{ fontSize: 11.5, color: FAINT }}>{fmtDate(r.date)}</div>
            </div>
            <div style={{ fontSize: 12.5, color: MUTE, marginTop: 3 }}>
              +{r.qty_added} {r.unit}{r.unit_cost ? ` \u00b7 ${fmtNaira(r.unit_cost)}/unit` : ""}{r.supplier ? ` \u00b7 ${r.supplier}` : ""}{r.created_by_name ? ` \u00b7 ${r.created_by_name}` : ""}
            </div>
          </div>
        ))
      )}
    </Sheet>
  );
}

/* ----------------------------- Dispense + receipt ----------------------------- */

function DispenseSheet({ inventory, patients, dispensationsCol, onClose, onReceipt }) {
  const [patientQuery, setPatientQuery] = useState("");
  const [patient, setPatient] = useState(null);
  const [walkInName, setWalkInName] = useState("");
  const [basket, setBasket] = useState([]);
  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [recordRevenue, setRecordRevenue] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const matchedPatients = patientQuery
    ? patients.filter((p) => p.name.toLowerCase().includes(patientQuery.toLowerCase()) || p.hospital_number.toLowerCase().includes(patientQuery.toLowerCase())).slice(0, 5)
    : [];

  const availableItems = inventory.filter((i) => Number(i.quantity) > 0);
  const pickedItem = inventory.find((i) => i.id === pickId);
  const inBasketQty = (itemId) => basket.filter((b) => b.itemId === itemId).reduce((s, b) => s + Number(b.qty), 0);

  const addToBasket = () => {
    if (!pickedItem) { setError("Choose an item"); return; }
    const qty = Number(pickQty);
    if (!qty || qty <= 0) { setError("Enter a valid quantity"); return; }
    const already = inBasketQty(pickedItem.id);
    if (already + qty > Number(pickedItem.quantity)) { setError(`Only ${pickedItem.quantity - already} ${pickedItem.unit} left in stock`); return; }
    setBasket([...basket, { itemId: pickedItem.id, name: pickedItem.name, unit: pickedItem.unit, qty, sellingPrice: pickedItem.selling_price }]);
    setPickId(""); setPickQty("1"); setError("");
  };
  const removeFromBasket = (idx) => setBasket(basket.filter((_, i) => i !== idx));
  const total = basket.reduce((s, b) => s + Number(b.qty) * Number(b.sellingPrice || 0), 0);

  const submit = async () => {
    if (basket.length === 0) { setError("Add at least one item"); return; }
    if (!patient && !walkInName.trim()) { setError("Enter a patient name or pick a folder"); return; }
    setBusy(true);
    try {
      const record = await dispensationsCol.create({
        patientName: patient ? patient.name : walkInName.trim(),
        hospitalNumber: patient ? patient.hospital_number : "",
        items: basket.map((b) => ({ itemId: b.itemId, qty: b.qty })),
        recordRevenue,
      });
      onReceipt(record);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Sheet title="Dispense to patient" onClose={onClose}>
      <Field label="Patient">
        {patient ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FDEAEA", borderRadius: 10, padding: "9px 12px" }}>
            <Avatar name={patient.name} role="Front Desk" size={26} />
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{patient.name} <span style={{ color: FAINT, fontWeight: 500 }}>\u00b7 HN {patient.hospital_number}</span></div>
            <button onClick={() => setPatient(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={15} color={MUTE} /></button>
          </div>
        ) : (
          <>
            <Input value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search patient folder, or type a walk-in name" />
            {matchedPatients.length > 0 && (
              <div style={{ marginTop: 6, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
                {matchedPatients.map((p) => (
                  <button key={p.id} onClick={() => { setPatient(p); setPatientQuery(""); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", background: WHITE, border: "none", borderBottom: `1px solid ${LINE}`, cursor: "pointer", fontSize: 13 }}>
                    <b>{p.name}</b> <span style={{ color: FAINT }}>HN {p.hospital_number}</span>
                  </button>
                ))}
              </div>
            )}
            {matchedPatients.length === 0 && patientQuery && <div style={{ fontSize: 11.5, color: FAINT, marginTop: 5 }}>No folder match \u2014 will be recorded as walk-in "{patientQuery}"</div>}
          </>
        )}
        {!patient && <Input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="Walk-in / OTC patient name" style={{ marginTop: 8, display: matchedPatients.length ? "none" : "block" }} />}
      </Field>

      <Field label="Add item from stock">
        <div style={{ display: "flex", gap: 8 }}>
          <select value={pickId} onChange={(e) => { setPickId(e.target.value); setError(""); }} style={{ ...inputStyle, flex: 2 }}>
            <option value="">Select item...</option>
            {availableItems.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} left)</option>)}
          </select>
          <Input type="number" min="1" value={pickQty} onChange={(e) => setPickQty(e.target.value)} style={{ flex: 1 }} />
        </div>
        <button onClick={addToBasket} style={{ marginTop: 8, width: "100%", background: "#EAF8F8", color: TEAL, border: "none", borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "center", gap: 5 }}><Plus size={14} /> Add to dispensation</button>
      </Field>

      {basket.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {basket.map((b, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid #F1F4F6` }}>
              <div style={{ fontSize: 13.5 }}>{b.name} <span style={{ color: FAINT }}>\u00d7 {b.qty} {b.unit}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {b.sellingPrice > 0 && <span style={{ fontSize: 12.5, color: MUTE }}>{fmtNaira(b.qty * b.sellingPrice)}</span>}
                <button onClick={() => removeFromBasket(i)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={14} color="#D9DEE1" /></button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: 700, fontSize: 14 }}><span>Total value</span><span>{fmtNaira(total)}</span></div>
          {total > 0 && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTE, marginTop: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={recordRevenue} onChange={(e) => setRecordRevenue(e.target.checked)} /> Also record {fmtNaira(total)} as Pharmacy Sale revenue
            </label>
          )}
        </div>
      )}

      {error && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{error}</div>}
      <PrimaryButton onClick={submit} color={RED} disabled={busy}><Syringe size={16} /> {busy ? "Saving..." : "Confirm dispensation"}</PrimaryButton>
    </Sheet>
  );
}

function DispenseHistorySheet({ dispensations, onClose, onPrint }) {
  return (
    <Sheet title="Dispensation history" onClose={onClose}>
      {dispensations.length === 0 ? (
        <EmptyState icon={<History size={36} />} text="No dispensations recorded yet" />
      ) : (
        dispensations.map((d) => (
          <div key={d.id} style={{ padding: "10px 0", borderTop: `1px solid #F1F4F6` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{d.patient_name}{d.hospital_number ? ` \u00b7 HN ${d.hospital_number}` : " (walk-in)"}</div>
              <div style={{ fontSize: 11.5, color: FAINT }}>{fmtDate(d.date)}</div>
            </div>
            <div style={{ fontSize: 12.5, color: MUTE, marginTop: 3 }}>{d.items.map((it) => `${it.name} \u00d7${it.qty} ${it.unit}`).join(", ")}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              {d.recorded_revenue ? <div style={{ fontSize: 11.5, color: TEAL, fontWeight: 600 }}>{fmtNaira(d.total_value)} recorded as revenue</div> : <span />}
              <button onClick={() => onPrint({ ...d, patientName: d.patient_name, hospitalNumber: d.hospital_number, totalValue: d.total_value, by: d.dispensed_by_name ? `${d.dispensed_by_name} (${d.dispensed_by_role})` : "" })} style={{ background: "none", border: "none", color: RED, fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Printer size={12} /> Receipt
              </button>
            </div>
          </div>
        ))
      )}
    </Sheet>
  );
}

function ReceiptOverlay({ record, onClose }) {
  const total = record.totalValue || record.items.reduce((s, it) => s + (it.sellingPrice || 0) * it.qty, 0);
  return (
    <div className="app-no-print" style={{ position: "fixed", inset: 0, background: "rgba(20,30,40,0.55)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div id="receipt-print-area" style={{ background: WHITE, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><ClinigramMark size={40} /></div>
          <div style={{ fontWeight: 800, fontSize: 16, color: RED }}>Clinigram Healthcare</div>
          <div style={{ fontSize: 11, color: MUTE }}>Pharmacy Dispensation Receipt</div>
        </div>
        <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 10, borderTop: `1px dashed ${LINE}`, borderBottom: `1px dashed ${LINE}`, padding: "8px 0" }}>
          <div>Date: {fmtDate(record.date)}</div>
          <div>Patient: <b style={{ color: INK }}>{record.patientName}</b>{record.hospitalNumber ? ` (HN ${record.hospitalNumber})` : " (walk-in)"}</div>
          {record.by && <div>Dispensed by: {record.by}</div>}
        </div>
        {record.items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
            <span>{it.name} \u00d7{it.qty} {it.unit}</span><span>{it.sellingPrice ? fmtNaira(it.qty * it.sellingPrice) : "\u2014"}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, borderTop: `1px solid ${LINE}`, marginTop: 8, paddingTop: 8 }}><span>Total</span><span>{fmtNaira(total)}</span></div>
        <div style={{ textAlign: "center", fontSize: 11, color: FAINT, marginTop: 16 }}>Thank you for choosing Clinigram Healthcare</div>
        <div className="app-no-print" style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={() => window.print()} style={{ flex: 1, background: RED, color: WHITE, border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", justifyContent: "center", gap: 6 }}><Printer size={15} /> Print</button>
          <button onClick={onClose} style={{ flex: 1, background: "#F2F3F4", color: MUTE, border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Inventory ----------------------------- */

function Inventory({ inventoryCol, patientsCol, dispensationsCol, restocksCol, currentUser }) {
  const { data: inventory, create, update, remove } = inventoryCol;
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(null);
  const [showDispense, setShowDispense] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRestockHistory, setShowRestockHistory] = useState(false);
  const [restockFor, setRestockFor] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "Pharmacy", quantity: "", unit: "tablets", reorderLevel: "", costPrice: "", sellingPrice: "", expiryDate: "" });

  const filtered = inventory.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  const openEdit = (item) => {
    setForm({
      name: item.name, category: item.category, quantity: item.quantity, unit: item.unit,
      reorderLevel: item.reorder_level, costPrice: item.cost_price, sellingPrice: item.selling_price,
      expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : "",
    });
    setError(""); setSheet(item.id);
  };
  const openAdd = () => {
    setForm({ name: "", category: "Pharmacy", quantity: "", unit: "tablets", reorderLevel: "", costPrice: "", sellingPrice: "", expiryDate: "" });
    setError(""); setSheet("add");
  };

  const save = async () => {
    if (!form.name || form.quantity === "") return;
    try {
      if (sheet === "add") await create(form);
      else await update(sheet, form);
      setSheet(null);
    } catch (e) { setError(e.message); }
  };
  const removeItem = async (id) => { try { await remove(id); setSheet(null); } catch (e) { setError(e.message); } };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <TopBar title="Pharmacy & Consumables" subtitle={`${inventory.length} items tracked`} />
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={() => setShowDispense(true)} style={{ flex: 1, background: RED, color: WHITE, border: "none", borderRadius: 12, padding: "11px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", justifyContent: "center", gap: 6 }}><Syringe size={15} /> Dispense</button>
          <button onClick={() => setShowHistory(true)} style={{ background: "#F2F3F4", color: MUTE, border: "none", borderRadius: 12, padding: "11px 14px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}><History size={15} /></button>
          <button onClick={() => setShowRestockHistory(true)} style={{ background: "#F2F3F4", color: MUTE, border: "none", borderRadius: 12, padding: "11px 14px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}><PackagePlus size={15} /></button>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Search inventory..." />
        {filtered.length === 0 ? (
          <EmptyState icon={<Package size={40} />} text="No items yet" sub="Tap + Add item to start tracking stock" />
        ) : (
          filtered.map((item) => {
            const low = Number(item.quantity) <= Number(item.reorder_level || 0);
            const exp = daysUntil(item.expiry_date);
            const expired = exp !== null && exp < 0;
            const expiringSoon = exp !== null && exp >= 0 && exp <= EXPIRY_WARNING_DAYS;
            return (
              <Card key={item.id} style={{ marginBottom: 10, cursor: "pointer" }} onClickCapture={() => openEdit(item)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: FAINT, marginTop: 2 }}>{item.category} \u00b7 updated {fmtDate(item.updated_at)}</div>
                    {(expired || expiringSoon) && <div style={{ fontSize: 11, color: RED, fontWeight: 700, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><AlertOctagon size={11} /> {expired ? "Expired" : `Expires in ${exp}d`}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: low ? RED : INK, fontSize: 15 }}>{item.quantity} <span style={{ fontSize: 11, color: FAINT, fontWeight: 500 }}>{item.unit}</span></div>
                    {low && <div style={{ fontSize: 10.5, color: RED, fontWeight: 700 }}>Reorder now</div>}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      <FAB onClick={openAdd} label="Add item" />

      {sheet && (
        <Sheet title={sheet === "add" ? "Add stock item" : "Edit stock item"} onClose={() => setSheet(null)}>
          <ErrorBanner message={error} />
          <Field label="Item name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" /></Field>
          <Field label="Category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={["Pharmacy", "Consumable", "Lab Reagent", "Equipment"]} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Quantity" style={{ flex: 1 }}><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" /></Field>
            <Field label="Unit" style={{ flex: 1 }}><Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} options={UNITS} /></Field>
          </div>
          <Field label="Reorder level (alert when at/below this)"><Input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} placeholder="e.g. 10" /></Field>
          <Field label="Expiry date (optional)"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Cost price (\u20a6)" style={{ flex: 1 }}><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0" /></Field>
            <Field label="Selling price (\u20a6)" style={{ flex: 1 }}><Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0" /></Field>
          </div>
          <PrimaryButton onClick={save}><Save size={16} /> Save item</PrimaryButton>
          {sheet !== "add" && <GhostButton color={TEAL} onClick={() => { setRestockFor(inventory.find((i) => i.id === sheet)); setSheet(null); }}><PackagePlus size={14} /> Restock this item</GhostButton>}
          {sheet !== "add" && <GhostButton onClick={() => removeItem(sheet)} color={RED}><Trash2 size={14} /> Remove item</GhostButton>}
        </Sheet>
      )}

      {showDispense && (
        <DispenseSheet inventory={inventory} patients={patientsCol.data} dispensationsCol={dispensationsCol}
          onClose={() => setShowDispense(false)} onReceipt={(record) => { setShowDispense(false); setReceipt(record); inventoryCol.refresh(); }} />
      )}
      {showHistory && <DispenseHistorySheet dispensations={dispensationsCol.data} onClose={() => setShowHistory(false)} onPrint={(d) => setReceipt(d)} />}
      {showRestockHistory && <RestockHistorySheet restocks={restocksCol.data} onClose={() => setShowRestockHistory(false)} />}
      {restockFor && <RestockSheet item={restockFor} restocksCol={restocksCol} onClose={() => { setRestockFor(null); inventoryCol.refresh(); }} />}
      {receipt && <ReceiptOverlay record={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

/* ----------------------------- Cash reconciliation ----------------------------- */

function CashReconciliationSheet({ reconciliationsCol, onClose }) {
  const [actualCash, setActualCash] = useState("");
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (actualCash === "") return;
    setBusy(true);
    try {
      const r = await reconciliationsCol.create({ actualCash, note });
      setResult(r);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (showHistory) {
    return (
      <Sheet title="Reconciliation history" onClose={onClose} onBack={() => setShowHistory(false)}>
        {reconciliationsCol.data.length === 0 ? (
          <EmptyState icon={<Banknote size={36} />} text="No reconciliations logged yet" />
        ) : (
          reconciliationsCol.data.map((r) => (
            <div key={r.id} style={{ padding: "10px 0", borderTop: `1px solid #F1F4F6` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{fmtDate(r.date)}</div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: Number(r.difference) === 0 ? TEAL : RED }}>{Number(r.difference) > 0 ? "+" : ""}{fmtNaira(r.difference)}</div>
              </div>
              <div style={{ fontSize: 12, color: MUTE }}>Expected {fmtNaira(r.expected_revenue)} \u00b7 Counted {fmtNaira(r.actual_cash)} \u00b7 {r.recorded_by_name}</div>
              {r.note && <div style={{ fontSize: 12, color: FAINT, marginTop: 2 }}>{r.note}</div>}
            </div>
          ))
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Daily cash reconciliation" onClose={onClose}>
      <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 12 }}>Compares today's logged revenue against the cash actually counted at close of day.</div>
      {error && <ErrorBanner message={error} />}
      {result ? (
        <>
          <Card style={{ marginBottom: 12 }}>
            <Row label="Expected revenue today" value={fmtNaira(result.expectedRevenue)} color={TEAL} />
            <Row label="Cash counted" value={fmtNaira(result.actualCash)} />
          </Card>
          <div style={{ textAlign: "center", fontWeight: 800, fontSize: 16, color: Number(result.difference) === 0 ? TEAL : RED, marginBottom: 14 }}>
            {Number(result.difference) === 0 ? "Balanced" : Number(result.difference) > 0 ? `+${fmtNaira(result.difference)} surplus` : `${fmtNaira(result.difference)} shortfall`}
          </div>
          <PrimaryButton color={RED} onClick={onClose}>Done</PrimaryButton>
        </>
      ) : (
        <>
          <Field label="Actual cash counted (\u20a6)"><Input type="number" value={actualCash} onChange={(e) => setActualCash(e.target.value)} placeholder="0" autoFocus /></Field>
          <Field label="Note (optional)"><TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any explanation for the difference" /></Field>
          <PrimaryButton onClick={save} color={RED} disabled={actualCash === "" || busy}><Banknote size={16} /> {busy ? "Saving..." : "Save reconciliation"}</PrimaryButton>
          <GhostButton onClick={() => setShowHistory(true)}><History size={14} /> View history</GhostButton>
        </>
      )}
    </Sheet>
  );
}

/* ----------------------------- Finance ----------------------------- */

function Finance({ transactionsCol, patientsCol, servicesCol, reconciliationsCol, summary, currentUser }) {
  const isAdmin = currentUser.role === "Admin";
  const { data: transactions, create, remove } = transactionsCol;
  const [filter, setFilter] = useState("all");
  const [sheet, setSheet] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [linkedPatient, setLinkedPatient] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ type: "revenue", category: "Consultation", amount: "", date: todayISO(), note: "" });

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filtered = filter === "all" ? sorted : sorted.filter((t) => t.type === filter);

  const matchedPatients = patientQuery
    ? patientsCol.data.filter((p) => p.name.toLowerCase().includes(patientQuery.toLowerCase()) || p.hospital_number.toLowerCase().includes(patientQuery.toLowerCase())).slice(0, 5)
    : [];

  const openAdd = (type) => {
    setForm({ type, category: type === "revenue" ? "Consultation" : "Salaries", amount: "", date: todayISO(), note: "" });
    setLinkedPatient(null); setPatientQuery(""); setError("");
    setSheet(true);
  };

  const matchingServices = servicesCol.data.filter((s) => s.category === form.category && s.active);

  const save = async () => {
    if (!form.amount) return;
    try {
      await create({ ...form, linkedPatientName: linkedPatient ? linkedPatient.name : "", linkedHospitalNumber: linkedPatient ? linkedPatient.hospital_number : "" });
      setSheet(false);
    } catch (e) { setError(e.message); }
  };

  const removeTx = async (id) => { try { await remove(id); } catch (e) { /* ignore */ } };

  const catIcon = (cat) => {
    const map = { Consultation: Stethoscope, "Folder Opening": FileText, Procedure: Activity, Investigation: FlaskConical, Admission: BedDouble, "Pharmacy Sale": Pill };
    const Icon = map[cat] || Receipt;
    return <Icon size={16} />;
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <TopBar title="Revenue & Expenditure" subtitle={isAdmin && summary ? `Net this week: ${fmtNaira(summary.netPosition)}` : "Log consultation, procedure & other fees"} />
      <div style={{ display: "flex", gap: 10, marginTop: -14, marginBottom: 14 }}>
        {isAdmin
          ? <Stat icon={<TrendingUp size={15} color={TEAL} />} color={TEAL} label="Revenue (wk)" value={fmtNaira(summary?.revenue)} />
          : <LockedStat icon={<TrendingUp size={15} color={TEAL} />} color={TEAL} label="Revenue (wk)" />}
        <Stat icon={<TrendingDown size={15} color={RED} />} color={RED} label="Expenditure (wk)" value={fmtNaira(summary?.expenditure)} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => openAdd("revenue")} style={{ flex: 1, background: "#EAF8F8", color: TEAL, border: "none", borderRadius: 12, padding: "11px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", justifyContent: "center", gap: 6 }}><Plus size={15} /> Revenue</button>
        <button onClick={() => openAdd("expense")} style={{ flex: 1, background: "#FDEAEA", color: RED, border: "none", borderRadius: 12, padding: "11px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", justifyContent: "center", gap: 6 }}><Plus size={15} /> Expense</button>
      </div>
      <button onClick={() => setShowReconcile(true)} style={{ width: "100%", marginBottom: 12, background: "#F2F3F4", color: INK, border: "none", borderRadius: 12, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "center", gap: 6 }}><Banknote size={15} color={RED} /> Daily cash reconciliation</button>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["all", "revenue", "expense"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: filter === f ? RED : "#F2F3F4", color: filter === f ? WHITE : MUTE }}>{f === "all" ? "All" : f === "revenue" ? "Revenue" : "Expenses"}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Wallet size={40} />} text="No transactions yet" sub="Log your first revenue or expense" />
      ) : (
        filtered.map((t) => (
          <Card key={t.id} style={{ marginBottom: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: t.type === "revenue" ? "#EAF8F8" : "#FDEAEA", color: t.type === "revenue" ? TEAL : RED, display: "flex", alignItems: "center", justifyContent: "center" }}>{catIcon(t.category)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.category}</div>
                <div style={{ fontSize: 11.5, color: FAINT }}>{fmtDate(t.date)}{t.linked_patient_name ? ` \u00b7 ${t.linked_patient_name}` : ""}{t.note ? ` \u00b7 ${t.note}` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: t.type === "revenue" ? TEAL : RED }}>{t.type === "revenue" ? "+" : "\u2212"}{fmtNaira(t.amount)}</div>
              {isAdmin && <button onClick={() => removeTx(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Trash2 size={14} color="#D9DEE1" /></button>}
            </div>
          </Card>
        ))
      )}

      {sheet && (
        <Sheet title={form.type === "revenue" ? "Log revenue" : "Log expense"} onClose={() => setSheet(false)}>
          <ErrorBanner message={error} />
          <Field label="Category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={form.type === "revenue" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES} /></Field>
          {form.type === "revenue" && matchingServices.length > 0 && (
            <Field label="Quick-fill from price list">
              <select defaultValue="" onChange={(e) => { const s = matchingServices.find((x) => x.id === e.target.value); if (s) setForm({ ...form, amount: s.price, note: s.name }); }} style={inputStyle}>
                <option value="">Choose a standard fee...</option>
                {matchingServices.map((s) => <option key={s.id} value={s.id}>{s.name} \u2014 {fmtNaira(s.price)}</option>)}
              </select>
            </Field>
          )}
          <Field label="Amount (\u20a6)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          {form.type === "revenue" && (
            <Field label="Link to patient folder (optional)">
              {linkedPatient ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FDEAEA", borderRadius: 10, padding: "9px 12px" }}>
                  <Link2 size={14} color={RED} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{linkedPatient.name} <span style={{ color: FAINT, fontWeight: 500 }}>\u00b7 HN {linkedPatient.hospital_number}</span></div>
                  <button onClick={() => setLinkedPatient(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} color={MUTE} /></button>
                </div>
              ) : (
                <>
                  <Input value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search name or hospital number" />
                  {matchedPatients.length > 0 && (
                    <div style={{ marginTop: 6, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
                      {matchedPatients.map((p) => (
                        <button key={p.id} onClick={() => { setLinkedPatient(p); setPatientQuery(""); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", background: WHITE, border: "none", borderBottom: `1px solid ${LINE}`, cursor: "pointer", fontSize: 13 }}><b>{p.name}</b> <span style={{ color: FAINT }}>HN {p.hospital_number}</span></button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Field>
          )}
          <Field label="Note (optional)"><TextArea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. additional details" /></Field>
          <PrimaryButton onClick={save} color={form.type === "revenue" ? TEAL : RED}><Save size={16} /> Save {form.type}</PrimaryButton>
        </Sheet>
      )}

      {showReconcile && <CashReconciliationSheet reconciliationsCol={reconciliationsCol} onClose={() => setShowReconcile(false)} />}
    </div>
  );
}

/* ----------------------------- Patients ----------------------------- */

function Patients({ patientsCol }) {
  const { data: patients, create, update, remove } = patientsCol;
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", hospitalNumber: "", phone: "", note: "" });

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.hospital_number.toLowerCase().includes(query.toLowerCase()));

  const openAdd = () => { setForm({ name: "", hospitalNumber: "", phone: "", note: "" }); setError(""); setSheet("add"); };
  const openEdit = (p) => { setForm({ name: p.name, hospitalNumber: p.hospital_number, phone: p.phone, note: p.note }); setError(""); setSheet(p.id); };

  const save = async () => {
    if (!form.name || !form.hospitalNumber) return;
    try {
      if (sheet === "add") await create(form);
      else await update(sheet, form);
      setSheet(null);
    } catch (e) { setError(e.message); }
  };
  const removeIt = async (id) => { try { await remove(id); setSheet(null); } catch (e) { setError(e.message); } };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <TopBar title="Patient Folders" subtitle={`${patients.length} folders on record`} />
      <div style={{ marginTop: 16 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search name or hospital number..." />
        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={40} />} text="No patient folders yet" sub="Tap + Add folder to register a patient" />
        ) : (
          filtered.map((p) => (
            <Card key={p.id} style={{ marginBottom: 9, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClickCapture={() => openEdit(p)}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: "#FDEAEA", color: RED, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{p.name.trim().charAt(0).toUpperCase()}</div>
                <div><div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 12, color: FAINT }}>HN: {p.hospital_number}</div></div>
              </div>
              <ChevronRight size={17} color="#D9DEE1" />
            </Card>
          ))
        )}
      </div>
      <FAB onClick={openAdd} label="Add folder" />

      {sheet && (
        <Sheet title={sheet === "add" ? "New patient folder" : "Edit patient folder"} onClose={() => setSheet(null)}>
          <ErrorBanner message={error} />
          <Field label="Patient name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></Field>
          <Field label="Hospital number"><Input value={form.hospitalNumber} onChange={(e) => setForm({ ...form, hospitalNumber: e.target.value })} placeholder="e.g. CG-2026-0142" /></Field>
          <Field label="Phone (optional)"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08012345678" /></Field>
          <Field label="Note (optional)"><TextArea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Any reference note" /></Field>
          <div style={{ fontSize: 11.5, color: FAINT, marginBottom: 10, lineHeight: 1.5 }}>Recorded under Clinigram's lawful basis for healthcare service delivery, per NDPA 2023.</div>
          <PrimaryButton onClick={save} color={RED}><Save size={16} /> Save folder</PrimaryButton>
          {sheet !== "add" && <GhostButton onClick={() => removeIt(sheet)} color={RED}><Trash2 size={14} /> Remove folder</GhostButton>}
        </Sheet>
      )}
    </div>
  );
}

/* ----------------------------- Visits ----------------------------- */

function OpenVisitSheet({ patients, visitsCol, onClose, onOpened }) {
  const [patientQuery, setPatientQuery] = useState("");
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const matchedPatients = patientQuery
    ? patients.filter((p) => p.name.toLowerCase().includes(patientQuery.toLowerCase()) || p.hospital_number.toLowerCase().includes(patientQuery.toLowerCase())).slice(0, 5)
    : [];

  const submit = async () => {
    if (!patient) { setError("Pick a patient folder to open a visit"); return; }
    setBusy(true);
    try {
      const visit = await visitsCol.create({ patientId: patient.id, patientName: patient.name, hospitalNumber: patient.hospital_number });
      onOpened(visit);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Sheet title="Open a visit" onClose={onClose}>
      <Field label="Patient">
        {patient ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FDEAEA", borderRadius: 10, padding: "9px 12px" }}>
            <Avatar name={patient.name} role="Front Desk" size={26} />
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{patient.name} <span style={{ color: FAINT, fontWeight: 500 }}>· HN {patient.hospital_number}</span></div>
            <button onClick={() => setPatient(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={15} color={MUTE} /></button>
          </div>
        ) : (
          <>
            <Input value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search patient folder by name or hospital number" />
            {matchedPatients.length > 0 && (
              <div style={{ marginTop: 6, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
                {matchedPatients.map((p) => (
                  <button key={p.id} onClick={() => { setPatient(p); setPatientQuery(""); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", background: WHITE, border: "none", borderBottom: `1px solid ${LINE}`, cursor: "pointer", fontSize: 13 }}>
                    <b>{p.name}</b> <span style={{ color: FAINT }}>HN {p.hospital_number}</span>
                  </button>
                ))}
              </div>
            )}
            {matchedPatients.length === 0 && patientQuery && <div style={{ fontSize: 11.5, color: FAINT, marginTop: 5 }}>No folder match — visits require a registered patient folder.</div>}
          </>
        )}
      </Field>
      {error && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{error}</div>}
      <PrimaryButton onClick={submit} color={RED} disabled={busy}><Stethoscope size={16} /> {busy ? "Opening..." : "Open visit"}</PrimaryButton>
    </Sheet>
  );
}

const VISIT_ITEM_TYPES = [
  { id: "service", label: "Service" },
  { id: "medication", label: "Medication" },
  { id: "investigation", label: "Investigation" },
];

function VisitDetailSheet({ visitId, inventory, services, onClose, onMutate }) {
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [itemType, setItemType] = useState("service");
  const [refId, setRefId] = useState("");
  const [qty, setQty] = useState("1");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [closeReason, setCloseReason] = useState("");
  const [showCloseReason, setShowCloseReason] = useState(false);

  const refresh = useCallback(async () => {
    try { setVisit(await api.get(`/api/visits/${visitId}`)); }
    catch (e) { setError(e.message); }
  }, [visitId]);

  useEffect(() => { refresh(); }, [refresh]);

  const referenceOptions = itemType === "medication" ? inventory.filter((i) => Number(i.quantity) > 0)
    : itemType === "investigation" ? services.filter((s) => s.active && s.category === "Investigation")
    : services.filter((s) => s.active && s.category !== "Investigation");

  const addItem = async () => {
    if (!refId) { setError("Choose what to add"); return; }
    setBusy(true); setError("");
    try {
      await api.post(`/api/visits/${visitId}/items`, { itemType, referenceId: refId, quantity: Number(qty) || 1 });
      setRefId(""); setQty("1");
      await refresh(); onMutate();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const addPayment = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setError("Enter a valid payment amount"); return; }
    setBusy(true); setError("");
    try {
      await api.post(`/api/visits/${visitId}/payments`, { amount: amt, paymentMethod: payMethod });
      setPayAmount("");
      await refresh(); onMutate();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const closeVisit = async () => {
    setBusy(true); setError("");
    try {
      await api.put(`/api/visits/${visitId}/close`, { outstandingReason: closeReason });
      await refresh(); onMutate();
      setShowCloseReason(false);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const tryClose = () => {
    if (visit && Number(visit.outstanding_balance) > 0) { setShowCloseReason(true); return; }
    closeVisit();
  };

  if (!visit) return <Sheet title="Visit" onClose={onClose}><div style={{ color: FAINT, fontSize: 13 }}>Loading...</div></Sheet>;

  const isOpen = visit.status === "open";

  return (
    <Sheet title={`Visit · ${visit.patient_name}`} onClose={onClose}>
      <div style={{ fontSize: 12, color: FAINT, marginBottom: 10 }}>HN {visit.hospital_number} · Opened {fmtDateTime(visit.opened_at)} by {visit.opened_by_name}</div>

      {visit.items.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {visit.items.map((it) => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid #F1F4F6` }}>
              <div style={{ fontSize: 13 }}>{it.description} <span style={{ color: FAINT }}>×{it.quantity}</span></div>
              <div style={{ fontSize: 13 }}>{fmtNaira(it.total_price)}</div>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <Field label="Add to visit">
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {VISIT_ITEM_TYPES.map((t) => (
              <button key={t.id} onClick={() => { setItemType(t.id); setRefId(""); }} style={{ flex: 1, border: "none", borderRadius: 8, padding: "7px 0", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: itemType === t.id ? TEAL : "#F2F3F4", color: itemType === t.id ? WHITE : MUTE }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={refId} onChange={(e) => setRefId(e.target.value)} style={{ ...inputStyle, flex: 2 }}>
              <option value="">Select...</option>
              {referenceOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}{itemType === "medication" ? ` (${o.quantity} ${o.unit} left)` : ` — ${fmtNaira(o.price)}`}
                </option>
              ))}
            </select>
            <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={{ flex: 1 }} />
          </div>
          <button onClick={addItem} disabled={busy} style={{ marginTop: 8, width: "100%", background: "#EAF8F8", color: TEAL, border: "none", borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "center", gap: 5 }}><Plus size={14} /> Add</button>
        </Field>
      )}

      <Card style={{ marginBottom: 12 }}>
        <Row label="Total charged" value={fmtNaira(visit.total_amount)} />
        <Row label="Amount paid" value={fmtNaira(visit.amount_paid)} color={TEAL} />
        <Row label="Outstanding balance" value={fmtNaira(visit.outstanding_balance)} color={Number(visit.outstanding_balance) > 0 ? RED : TEAL} bold />
      </Card>

      {isOpen && (
        <Field label="Record payment">
          <div style={{ display: "flex", gap: 8 }}>
            <Input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" style={{ flex: 2 }} />
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="card">Card</option>
            </select>
          </div>
          <button onClick={addPayment} disabled={busy} style={{ marginTop: 8, width: "100%", background: "#EAF8F8", color: TEAL, border: "none", borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "center", gap: 5 }}><Banknote size={14} /> Record payment</button>
        </Field>
      )}

      {visit.payments.length > 0 && (
        <Field label="Payment history">
          {visit.payments.map((p) => (
            <div key={p.id} style={{ padding: "6px 0", borderTop: `1px solid #F1F4F6` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: MUTE }}>
                <span>{fmtDate(p.date)} · {p.payment_method}</span><span style={{ fontWeight: 700, color: INK }}>{fmtNaira(p.amount)}</span>
              </div>
              <div style={{ fontSize: 11, color: FAINT, marginTop: 1 }}>Recorded by {p.recorded_by_name} ({p.recorded_by_role})</div>
            </div>
          ))}
        </Field>
      )}

      {error && <div style={{ color: RED, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{error}</div>}

      {isOpen && !showCloseReason && (
        <PrimaryButton onClick={tryClose} color={RED} disabled={busy}><Lock size={16} /> Close visit</PrimaryButton>
      )}
      {showCloseReason && (
        <>
          <Field label="Reason for outstanding balance">
            <TextArea value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="e.g. patient to pay balance next visit" />
          </Field>
          <PrimaryButton onClick={closeVisit} color={RED} disabled={busy}><Lock size={16} /> Confirm close with outstanding balance</PrimaryButton>
        </>
      )}
      {!isOpen && (
        <div style={{ fontSize: 12, color: FAINT, textAlign: "center" }}>Closed {fmtDateTime(visit.closed_at)} by {visit.closed_by_name}{visit.outstanding_reason ? ` — ${visit.outstanding_reason}` : ""}</div>
      )}
    </Sheet>
  );
}

function Visits({ visitsCol, patientsCol, inventoryCol, servicesCol, onMutate }) {
  const { data: visits } = visitsCol;
  const [query, setQuery] = useState("");
  const [showOpen, setShowOpen] = useState(false);
  const [activeVisitId, setActiveVisitId] = useState(null);

  const filtered = visits.filter((v) => v.patient_name.toLowerCase().includes(query.toLowerCase()) || v.hospital_number.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <TopBar title="Visits" subtitle={`${visits.filter((v) => v.status === "open").length} open visit(s)`} />
      <div style={{ marginTop: 16 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search patient or hospital number..." />
        {filtered.length === 0 ? (
          <EmptyState icon={<Stethoscope size={40} />} text="No visits yet" sub="Tap + Open visit to start one" />
        ) : (
          filtered.map((v) => (
            <Card key={v.id} style={{ marginBottom: 9, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClickCapture={() => setActiveVisitId(v.id)}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.patient_name} <span style={{ fontSize: 11, fontWeight: 700, color: v.status === "open" ? TEAL : FAINT, marginLeft: 4 }}>{v.status === "open" ? "OPEN" : "CLOSED"}</span></div>
                <div style={{ fontSize: 12, color: FAINT }}>HN {v.hospital_number} · {fmtNaira(v.total_amount)}{Number(v.outstanding_balance) > 0 ? ` · ${fmtNaira(v.outstanding_balance)} owed` : ""}</div>
              </div>
              <ChevronRight size={17} color="#D9DEE1" />
            </Card>
          ))
        )}
      </div>
      <FAB onClick={() => setShowOpen(true)} label="Open visit" />

      {showOpen && (
        <OpenVisitSheet
          patients={patientsCol.data}
          visitsCol={visitsCol}
          onClose={() => setShowOpen(false)}
          onOpened={(visit) => { setShowOpen(false); setActiveVisitId(visit.id); }}
        />
      )}

      {activeVisitId && (
        <VisitDetailSheet
          visitId={activeVisitId}
          inventory={inventoryCol.data}
          services={servicesCol.data}
          onClose={() => { setActiveVisitId(null); visitsCol.refresh(); }}
          onMutate={() => { visitsCol.refresh(); inventoryCol.refresh(); onMutate(); }}
        />
      )}
    </div>
  );
}

/* ----------------------------- Report ----------------------------- */

function Report({ currentUser, ready }) {
  const isAdmin = currentUser.role === "Admin";
  const [periodType, setPeriodType] = useState("week");
  const [offset, setOffset] = useState(0);
  const { summary } = useSummary(periodType, offset, ready);
  const periodCount = periodType === "month" ? 12 : periodType === "quarter" ? 8 : 8;
  const options = Array.from({ length: periodCount }, (_, i) => i);

  const shortLabel = (i) => {
    if (periodType === "week") return i === 0 ? "This week" : i === 1 ? "Last week" : `${i} weeks ago`;
    if (periodType === "month") return i === 0 ? "This month" : i === 1 ? "Last month" : `${i} months ago`;
    return i === 0 ? "This quarter" : `${i} quarters ago`;
  };

  if (!summary) {
    return (
      <div style={{ padding: "0 16px 100px" }}>
        <TopBar title="Report" subtitle="Loading..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <TopBar title="Report" subtitle={summary.label} />
      <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 10 }}>
        {["week", "month", "quarter"].map((p) => (
          <button key={p} onClick={() => { setPeriodType(p); setOffset(0); }} style={{ flex: 1, border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: periodType === p ? RED : "#F2F3F4", color: periodType === p ? WHITE : MUTE, textTransform: "capitalize" }}>{p}ly</button>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <select value={offset} onChange={(e) => setOffset(Number(e.target.value))} style={inputStyle}>
          {options.map((i) => <option key={i} value={i}>{shortLabel(i)}</option>)}
        </select>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><CalendarDays size={16} color={RED} /><div style={{ fontWeight: 700, fontSize: 14, color: RED }}>Summary</div></div>
        {isAdmin ? <Row label="Total revenue" value={fmtNaira(summary.revenue)} color={TEAL} /> : <LockedRow label="Total revenue" />}
        <Row label="Total expenditure" value={fmtNaira(summary.expenditure)} color={RED} />
        {isAdmin ? <Row label="Net position" value={fmtNaira(summary.netPosition)} color={summary.netPosition >= 0 ? TEAL : RED} bold /> : <LockedRow label="Net position" />}
        <Row label="New patient folders" value={summary.newPatients} />
        <Row label="Dispensations to patients" value={summary.dispensationsCount} />
        <Row label="Items needing reorder" value={summary.lowStockItems.length} color={summary.lowStockItems.length ? RED : undefined} />
        <Row label="Items expiring/expired" value={summary.expiringItems.length} color={summary.expiringItems.length ? RED : undefined} />
        <Row label="Cash reconciliations logged" value={summary.reconciliationsCount} />
        {isAdmin && summary.reconciliationsCount > 0 && <Row label="Total cash variance" value={fmtNaira(summary.totalVariance)} color={Number(summary.totalVariance) === 0 ? TEAL : RED} />}
      </Card>

      {isAdmin && summary.revenueByCategory && summary.revenueByCategory.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEAL, marginBottom: 8 }}>Revenue breakdown</div>
          {summary.revenueByCategory.map((r) => <Row key={r.cat} label={r.cat} value={fmtNaira(r.total)} />)}
        </Card>
      )}
      {!isAdmin && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEAL, marginBottom: 8 }}>Revenue breakdown</div>
          <LockedRow label="Visible to Admin only" />
        </Card>
      )}

      {summary.expenseByCategory.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: RED, marginBottom: 8 }}>Expenditure breakdown</div>
          {summary.expenseByCategory.map((r) => <Row key={r.cat} label={r.cat} value={fmtNaira(r.total)} />)}
        </Card>
      )}

      {summary.lowStockItems.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: RED, marginBottom: 8 }}>Stock to reorder</div>
          {summary.lowStockItems.map((i) => <Row key={i.id} label={i.name} value={`${i.quantity} ${i.unit}`} />)}
        </Card>
      )}

      {summary.expiringItems.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: RED, marginBottom: 8 }}>Expiring / expired stock</div>
          {summary.expiringItems.map((i) => <Row key={i.id} label={i.name} value={i.daysLeft < 0 ? "Expired" : `${i.daysLeft}d left`} color={RED} />)}
        </Card>
      )}

      <div style={{ textAlign: "center", fontSize: 11.5, color: FAINT, marginTop: 4 }}>Generated on {fmtDate(todayISO())} \u00b7 Clinigram Facility Manager</div>
    </div>
  );
}

/* ----------------------------- App ----------------------------- */

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Resume session if a token is already stored
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) { setCheckingSession(false); return; }
      try {
        const me = await api.get("/api/auth/me");
        setCurrentUser(me);
      } catch (e) {
        setToken(null);
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  const ready = !!currentUser;

  const inventoryCol = useApiCollection("/api/inventory", { enabled: ready });
  const transactionsCol = useApiCollection("/api/transactions", { enabled: ready });
  const patientsCol = useApiCollection("/api/patients", { enabled: ready });
  const dispensationsCol = useApiCollection("/api/dispensations", { enabled: ready });
  const restocksCol = useApiCollection("/api/restocks", { enabled: ready });
  const servicesCol = useApiCollection("/api/services", { enabled: ready });
  const visitsCol = useApiCollection("/api/visits", { enabled: ready });
  const reconciliationsCol = useApiCollection("/api/reconciliations", { enabled: ready });
  const auditCol = useApiCollection("/api/audit-log", { enabled: ready });
  const staffCol = useApiCollection("/api/staff", { enabled: ready });

  const { summary: weekSummary, refresh: refreshSummary } = useSummary("week", 0, ready);

  const refreshAllAfterMutation = () => {
    inventoryCol.refresh(); transactionsCol.refresh(); reconciliationsCol.refresh(); refreshSummary();
  };

  const wipeAll = async () => {
    await api.post("/api/admin/wipe");
    inventoryCol.refresh(); transactionsCol.refresh(); patientsCol.refresh();
    dispensationsCol.refresh(); restocksCol.refresh(); reconciliationsCol.refresh();
    visitsCol.refresh(); auditCol.refresh(); refreshSummary();
  };

  const handleLogin = (user) => setCurrentUser(user);
  const handleLogout = () => { setToken(null); setCurrentUser(null); setTab("dashboard"); };
  // Automatically sign out after 5 minutes of no taps/clicks/typing/scrolling.
  const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
  useEffect(() => {
    if (!currentUser) return;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setToken(null);
        setCurrentUser(null);
        setTab("dashboard");
      }, INACTIVITY_LIMIT_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [currentUser]);

  if (checkingSession) {
    return <Shell><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: FAINT, fontSize: 13.5 }}>Loading...</div></Shell>;
  }

  if (!currentUser) {
    return <Shell><AuthGate onLogin={handleLogin} /></Shell>;
  }

  return (
    <Shell>
      <style>{`
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        * { box-sizing: border-box; }
        ::selection { background: ${TEAL}33; }
        #receipt-print-area { display: none; }
        @media print {
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible !important; display: block; }
          #receipt-print-area { position: absolute; top: 0; left: 0; width: 100%; }
          .app-no-print { display: none !important; }
        }
      `}</style>
      <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
        {tab === "dashboard" && <Dashboard inventoryCol={inventoryCol} servicesCol={servicesCol} visitsCol={visitsCol} summary={weekSummary} setTab={setTab} onSettings={() => setShowSettings(true)} currentUser={currentUser} onMutate={refreshAllAfterMutation} />}
        {tab === "inventory" && (
          <InventoryWithRefresh inventoryCol={inventoryCol} patientsCol={patientsCol} dispensationsCol={dispensationsCol} restocksCol={restocksCol} currentUser={currentUser} onMutate={refreshAllAfterMutation} />
        )}
        {tab === "finance" && (
          <FinanceWithRefresh transactionsCol={transactionsCol} patientsCol={patientsCol} servicesCol={servicesCol} reconciliationsCol={reconciliationsCol} summary={weekSummary} currentUser={currentUser} onMutate={refreshAllAfterMutation} />
        )}
        {tab === "visits" && (
          <Visits visitsCol={visitsCol} patientsCol={patientsCol} inventoryCol={inventoryCol} servicesCol={servicesCol} onMutate={refreshAllAfterMutation} />
        )}
        {tab === "patients" && <Patients patientsCol={patientsCol} />}
        {tab === "report" && <Report currentUser={currentUser} ready={ready} />}
        <BottomNav tab={tab} setTab={setTab} />

        {showSettings && (
          <SettingsSheet
            onClose={() => setShowSettings(false)}
            currentUser={currentUser}
            staffCol={staffCol}
            servicesCol={servicesCol}
            inventoryCol={inventoryCol}
            auditCol={auditCol}
            onWipe={wipeAll}
            onLogout={handleLogout}
          />
        )}
      </div>
    </Shell>
  );
}

// Small wrappers so child mutations also refresh the dashboard/report summary figures.
function InventoryWithRefresh({ onMutate, ...props }) {
  return <Inventory {...props} inventoryCol={{ ...props.inventoryCol, create: wrap(props.inventoryCol.create, onMutate), update: wrap(props.inventoryCol.update, onMutate), remove: wrap(props.inventoryCol.remove, onMutate) }} restocksCol={{ ...props.restocksCol, create: wrap(props.restocksCol.create, onMutate) }} dispensationsCol={{ ...props.dispensationsCol, create: wrap(props.dispensationsCol.create, onMutate) }} />;
}
function FinanceWithRefresh({ onMutate, ...props }) {
  return <Finance {...props} transactionsCol={{ ...props.transactionsCol, create: wrap(props.transactionsCol.create, onMutate), remove: wrap(props.transactionsCol.remove, onMutate) }} reconciliationsCol={{ ...props.reconciliationsCol, create: wrap(props.reconciliationsCol.create, onMutate) }} />;
}
function wrap(fn, onMutate) {
  return async (...args) => { const r = await fn(...args); onMutate(); return r; };
}
