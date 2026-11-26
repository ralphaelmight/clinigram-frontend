import React, { useState, useEffect, useCallback } from "react";
import { Stethoscope, Activity, FileText, Plus, Save, CheckCircle2, X, ChevronDown, ChevronUp, Lock, History, AlertTriangle } from "lucide-react";
import { api } from "../api";
import { useTapLock, Spinner } from "../lib/tapLock";

/*
  Paperless clinic (EMR) screens for Facility Manager.
  Self-contained on purpose: it only talks to the clinical endpoints that already
  exist on the backend (/api/visits/:id/clinical-notes, /vitals, and
  /api/patients/:id/clinical-history). Role rules are enforced by the server; the
  checks here only decide what to SHOW.
*/

const RED = "#e93223";
const TEAL = "#5db2b6";
const WHITE = "#ffffff";
const INK = "#1a1a2e";
const SURFACE = "#f2f4f8";
const SUBTLE = "#f5f7fa";
const MUTE = "#6b7280";
const FAINT = "#9ca3af";
const GREEN = "#1f9d57";       // in-range vitals
const HAIRLINE = "#c3cad3";    // flat-look border with more contrast
const SHADOW_SOFT = "5px 5px 12px #c9d0de, -5px -5px 12px #ffffff";

const VIEW_ROLES = ["Doctor", "Nurse", "Paramedic", "Super Admin"];
const WRITE_NOTE_ROLES = ["Doctor", "Super Admin"];
const VITALS_ROLES = ["Doctor", "Nurse", "Paramedic", "Super Admin"];

export const canViewClinical = (role) => VIEW_ROLES.includes(role);

// Flat fields, matching the app-wide input restyle (white + hairline border).
// Teal focus ring comes from the global input:focus CSS in App.jsx.
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #c3cad3",
  fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  background: WHITE, color: INK, boxShadow: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return fmtDate(iso) + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

// Adult reference ranges, used only to highlight values for a clinician to look at. Children differ.
const VITAL_RULES = {
  temperature: (v) => v >= 38 || v < 35.5,
  pulse_rate: (v) => v < 50 || v > 100,
  respiratory_rate: (v) => v < 12 || v > 20,
  blood_pressure_systolic: (v) => v >= 140 || v < 90,
  blood_pressure_diastolic: (v) => v >= 90 || v < 60,
  oxygen_saturation: (v) => v < 94,
};
const isAbnormal = (key, val) => {
  const n = Number(val);
  return val !== null && val !== undefined && val !== "" && Number.isFinite(n) && !!VITAL_RULES[key]?.(n);
};
const ABN = { color: RED, fontWeight: 800 };

function AllergyBanner({ text }) {
  if (!text || !String(text).trim()) return null;
  return (
    <div role="alert" style={{ background: "#FDE7E5", color: RED, borderRadius: 12, padding: "9px 12px", marginBottom: 10, fontSize: 13, fontWeight: 700, display: "flex", gap: 8, alignItems: "flex-start" }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>Allergies: {text}</span>
    </div>
  );
}

function Fld({ label, children, flex }) {
  return (
    <div style={{ marginBottom: 10, flex }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: MUTE, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function Txt({ value, onChange, rows = 2, placeholder, disabled }) {
  return (
    <textarea
      value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ ...inputStyle, minHeight: rows * 24 + 12, resize: "vertical" }}
    />
  );
}

function Num({ value, onChange, placeholder, disabled, step, abnormal }) {
  return (
    <input
      type="number" inputMode="decimal" step={step || "any"} value={value ?? ""} placeholder={placeholder} disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={abnormal ? { ...inputStyle, borderColor: RED, color: RED, fontWeight: 700 } : inputStyle}
    />
  );
}

function Btn({ children, onClick, disabled, tone = "red", small }) {
  const [pending, run] = useTapLock(onClick);
  const bg = disabled ? "#d1d5db" : tone === "teal" ? "linear-gradient(180deg,#64bcc0,#4ba4a8)" : tone === "plain" ? SUBTLE : "linear-gradient(180deg,#f2402d,#e42a1b)";
  return (
    <button
      onClick={disabled ? undefined : run} disabled={disabled || pending} aria-busy={pending}
      style={{
        background: bg, color: tone === "plain" ? MUTE : WHITE, border: "none", borderRadius: 14,
        padding: small ? "8px 14px" : "12px 16px", fontSize: small ? 13 : 15, fontWeight: 700,
        cursor: pending ? "wait" : disabled ? "not-allowed" : "pointer", opacity: pending ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: small ? "auto" : "100%",
      }}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}

function Err({ message }) {
  if (!message) return null;
  return <div style={{ background: `${RED}14`, color: RED, fontSize: 12.5, fontWeight: 600, padding: "10px 14px", borderRadius: 12, marginBottom: 10 }}>{message}</div>;
}

// Full-screen overlay (sits above the existing sheets, which use z-index 50).
function Overlay({ title, onClose, children }) {
  return (
    <div data-fm-modal className="app-no-print" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.5)", zIndex: 70, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: SURFACE, width: "100%", maxHeight: "94vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: "0 20px calc(32px + env(safe-area-inset-bottom, 0px))", overscrollBehaviorY: "contain" }}>
        {/* Sticky header so the Close button stays reachable however far the form scrolls. */}
        <div style={{ position: "sticky", top: 0, zIndex: 3, background: SURFACE, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 12px", marginBottom: 6, boxShadow: `0 1px 0 ${HAIRLINE}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: INK }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: WHITE, border: `1px solid ${HAIRLINE}`, borderRadius: 10, padding: 7, cursor: "pointer", display: "flex" }}><X size={18} color={MUTE} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------- Vitals ----------------------------- */

const VITAL_FIELDS = [
  ["temperature", "Temp (°C)"], ["pulse_rate", "Pulse (bpm)"], ["respiratory_rate", "Resp rate"],
  ["blood_pressure_systolic", "BP systolic"], ["blood_pressure_diastolic", "BP diastolic"], ["oxygen_saturation", "SpO₂ (%)"],
  ["weight_kg", "Weight (kg)"], ["height_cm", "Height (cm)"],
];

function VitalsSheet({ visitId, onClose, onSaved }) {
  const [f, setF] = useState({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const any = VITAL_FIELDS.some(([k]) => String(f[k] ?? "").trim() !== "");
  const save = async () => {
    setBusy(true); setError("");
    try {
      await api.post(`/api/visits/${visitId}/vitals`, { ...f, notes });
      onSaved(); onClose();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return (
    <Overlay title="Record vitals" onClose={onClose}>
      <Err message={error} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" }}>
        {VITAL_FIELDS.map(([k, label]) => (
          <Fld key={k} label={label}><Num value={f[k]} onChange={(v) => setF({ ...f, [k]: v })} /></Fld>
        ))}
      </div>
      <Fld label="Notes (optional)"><Txt value={notes} onChange={setNotes} /></Fld>
      <Btn onClick={save} disabled={busy || !any} tone="teal"><Save size={16} /> {busy ? "Saving..." : "Save vitals"}</Btn>
    </Overlay>
  );
}

/* ----------------------------- Clinical note editor ----------------------------- */

const TEXT_GROUPS = [
  { title: "Presenting complaint", open: true, fields: [
    ["chief_complaint", "Chief complaint *", 2], ["history_of_presenting_complaint", "History of presenting complaint", 3], ["duration", "Duration", 1],
  ] },
  { title: "History", fields: [
    ["past_medical_history", "Past medical history", 2], ["surgical_history", "Surgical history", 2], ["family_history", "Family history", 2],
    ["social_history", "Social history", 2], ["allergies", "Allergies", 1], ["current_medications", "Current medications", 2],
    ["immunisation_history", "Immunisation history", 1], ["review_of_systems", "Review of systems", 3],
  ] },
  { title: "Examination", fields: [
    ["general_examination", "General", 2], ["cardiovascular_examination", "Cardiovascular", 2], ["respiratory_examination", "Respiratory", 2],
    ["abdominal_examination", "Abdominal", 2], ["neurological_examination", "Neurological", 2], ["musculoskeletal_examination", "Musculoskeletal", 2],
    ["other_examination", "Other", 2],
  ] },
  { title: "Assessment & plan", open: true, fields: [
    ["diagnosis", "Diagnosis *", 2], ["differential_diagnoses", "Differential diagnoses", 2], ["icd_code", "ICD code", 1],
    ["treatment_plan", "Treatment plan *", 3], ["investigations_ordered", "Investigations ordered", 2],
    ["referral", "Referral (to whom / where)", 1], ["referral_reason", "Referral reason", 2],
    ["follow_up_instructions", "Follow-up instructions", 2],
  ] },
];
const NUMERIC_KEYS = ["temperature", "pulse_rate", "respiratory_rate", "blood_pressure_systolic", "blood_pressure_diastolic", "oxygen_saturation", "weight_kg", "height_cm"];

// Common presenting complaints — one tap appends to the chief-complaint field.
const COMPLAINT_CHIPS = ["Fever", "Cough", "Headache", "Body pain", "Vomiting", "Diarrhoea", "Abdominal pain", "Malaria"];
// Fields tucked behind "+ Add" within each SOAP section (keys match TEXT_GROUPS so payload() still sends them).
const SUBJECTIVE_MORE = [
  ["history_of_presenting_complaint", "History of presenting complaint", 3], ["duration", "Duration", 1],
  ["past_medical_history", "Past medical history", 2], ["surgical_history", "Surgical history", 2],
  ["family_history", "Family history", 2], ["social_history", "Social history", 2],
  ["allergies", "Allergies", 1], ["current_medications", "Current medications", 2],
  ["immunisation_history", "Immunisation history", 1], ["review_of_systems", "Review of systems", 3],
];
const EXAM_FIELDS = [
  ["general_examination", "General", 2], ["cardiovascular_examination", "Cardiovascular", 2],
  ["respiratory_examination", "Respiratory", 2], ["abdominal_examination", "Abdominal", 2],
  ["neurological_examination", "Neurological", 2], ["musculoskeletal_examination", "Musculoskeletal", 2],
  ["other_examination", "Other", 2],
];
const EXAM_MORE = EXAM_FIELDS.slice(1); // everything after General — behind "+ Add"

// Read-only vitals bar (nurse-recorded) shown above Subjective. Normal = green, abnormal = red.
function VitalsBar({ data }) {
  const d = data || {};
  const has = (v) => v !== undefined && v !== null && String(v) !== "";
  const items = [];
  if (has(d.temperature)) items.push({ l: "Temp", v: `${d.temperature}°`, bad: isAbnormal("temperature", d.temperature), ruled: true });
  if (has(d.pulse_rate)) items.push({ l: "Pulse", v: d.pulse_rate, bad: isAbnormal("pulse_rate", d.pulse_rate), ruled: true });
  if (has(d.respiratory_rate)) items.push({ l: "Resp", v: d.respiratory_rate, bad: isAbnormal("respiratory_rate", d.respiratory_rate), ruled: true });
  if (has(d.blood_pressure_systolic)) items.push({ l: "BP", v: `${d.blood_pressure_systolic}/${d.blood_pressure_diastolic ?? ""}`, bad: isAbnormal("blood_pressure_systolic", d.blood_pressure_systolic) || isAbnormal("blood_pressure_diastolic", d.blood_pressure_diastolic), ruled: true });
  if (has(d.oxygen_saturation)) items.push({ l: "SpO₂", v: `${d.oxygen_saturation}%`, bad: isAbnormal("oxygen_saturation", d.oxygen_saturation), ruled: true });
  if (has(d.weight_kg)) items.push({ l: "Wt", v: `${d.weight_kg}kg`, bad: false, ruled: false });
  return (
    <div style={{ background: WHITE, border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: "8px 10px", marginBottom: 10, boxShadow: SHADOW_SOFT }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: items.length ? 6 : 0 }}>Vitals · recorded by nurse</div>
      {items.length === 0
        ? <div style={{ fontSize: 12, color: FAINT }}>None recorded for this visit yet.</div>
        : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {items.map((it, i) => {
              const color = it.bad ? RED : it.ruled ? GREEN : INK;
              const bg = it.bad ? "#FDE7E5" : it.ruled ? "#E7F6EE" : SUBTLE;
              return <span key={i} style={{ fontSize: 11.5, fontWeight: 700, color, background: bg, borderRadius: 8, padding: "3px 8px" }}><span style={{ color: FAINT, fontWeight: 600 }}>{it.l} </span>{it.v}{it.bad ? " ▲" : ""}</span>;
            })}
          </div>}
    </div>
  );
}

// A clean SOAP block: lettered badge + title, then its fields.
function SoapSection({ letter, title, hint, children }) {
  return (
    <div style={{ background: WHITE, borderRadius: 16, marginBottom: 10, boxShadow: SHADOW_SOFT, padding: "12px 14px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 24, height: 24, borderRadius: 8, background: TEAL, color: WHITE, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 }}>{letter}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: INK }}>{title}</span>
        {hint && <span style={{ fontSize: 11, color: FAINT, marginLeft: "auto" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// Progressive-disclosure toggle for the rarely-used fields. Shows a filled count
// so a continued draft's hidden-but-filled sections are obvious.
function More({ label, open, onToggle, count = 0, children }) {
  return (
    <>
      <button type="button" onClick={onToggle} style={{ width: "100%", background: "none", border: "none", padding: "6px 2px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: TEAL, fontWeight: 700, fontSize: 12.5, fontFamily: "inherit" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={14} /> {label}
          {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: WHITE, background: TEAL, borderRadius: 999, padding: "1px 7px" }}>{count}</span>}
        </span>
        {open ? <ChevronUp size={15} color={MUTE} /> : <ChevronDown size={15} color={MUTE} />}
      </button>
      {open && <div style={{ paddingTop: 4 }}>{children}</div>}
    </>
  );
}

// Chart-first snapshot shown at the top of the editor (B): allergy, last visit, last vitals.
function NoteSnapshot({ allergy, lastVisit, lastVitals }) {
  const v = lastVitals || {};
  const hasVitals = v.blood_pressure_systolic || v.pulse_rate || v.temperature || v.oxygen_saturation;
  if (!allergy && !lastVisit && !hasVitals) return null;
  const Tile = ({ label, value, bad }) => (
    <div style={{ flex: 1, minWidth: 64, background: WHITE, border: "1px solid #c3cad3", borderRadius: 10, padding: "6px 4px", textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: bad ? RED : INK }}>{value}{bad ? " ▲" : ""}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: ".4px" }}>{label}</div>
    </div>
  );
  return (
    <div style={{ marginBottom: 12 }}>
      <AllergyBanner text={allergy} />
      {lastVisit && (
        <div style={{ background: WHITE, borderRadius: 12, padding: "8px 11px", marginBottom: 8, boxShadow: SHADOW_SOFT }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: ".5px" }}>Last visit · {fmtDate(lastVisit.date)}</div>
          <div style={{ fontSize: 13, color: INK, marginTop: 1 }}>{lastVisit.diagnosis || lastVisit.chief_complaint || "—"}</div>
        </div>
      )}
      {hasVitals && (
        <div style={{ display: "flex", gap: 6 }}>
          {v.blood_pressure_systolic ? <Tile label="BP" value={`${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`} bad={isAbnormal("blood_pressure_systolic", v.blood_pressure_systolic) || isAbnormal("blood_pressure_diastolic", v.blood_pressure_diastolic)} /> : null}
          {v.pulse_rate ? <Tile label="Pulse" value={v.pulse_rate} bad={isAbnormal("pulse_rate", v.pulse_rate)} /> : null}
          {v.temperature ? <Tile label="Temp" value={`${v.temperature}°`} bad={isAbnormal("temperature", v.temperature)} /> : null}
          {v.oxygen_saturation ? <Tile label="SpO₂" value={`${v.oxygen_saturation}%`} bad={isAbnormal("oxygen_saturation", v.oxygen_saturation)} /> : null}
        </div>
      )}
    </div>
  );
}

// Tappable phrase chips that append to a field.
function ChipRow({ options, onPick }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "2px 0 12px" }}>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onPick(o)} style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 999, background: SUBTLE, color: MUTE, border: "1px solid #c3cad3", cursor: "pointer", fontFamily: "inherit" }}>+ {o}</button>
      ))}
    </div>
  );
}

function NoteEditor({ visitId, note, canPrivate, knownAllergy, lastVisit, lastVitals, onClose, onSaved }) {
  // Vitals are view-only here (the nurse records them). On a NEW consultation, snapshot
  // the latest recorded vitals so they're stored with, and shown on, the note.
  const [f, setF] = useState(() => {
    if (note) return { ...note };
    const seed = {};
    if (lastVitals) for (const [k] of VITAL_FIELDS) if (lastVitals[k] !== null && lastVitals[k] !== undefined && lastVitals[k] !== "") seed[k] = lastVitals[k];
    return seed;
  });
  const [noteId, setNoteId] = useState(note?.id || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const str = (x) => String(x ?? "").trim();
  const filled = (keys) => keys.filter((k) => str(f[k])).length;
  const PLAN_MORE = ["investigations_ordered", "referral", "referral_reason", "follow_up_instructions", "follow_up_date"];
  // Open any section that a continued draft has already filled, so nothing hides behind "+ Add".
  const [expanded, setExpanded] = useState(() => {
    const n = note || {};
    return {
      s: SUBJECTIVE_MORE.some(([k]) => str(n[k])),
      o: EXAM_MORE.some(([k]) => str(n[k])),
      a: !!(str(n.differential_diagnoses) || str(n.icd_code)),
      p: PLAN_MORE.some((k) => str(n[k])),
      priv: !!str(n.doctor_private_notes),
    };
  });
  const tog = (k) => setExpanded((e) => ({ ...e, [k]: !e[k] }));
  const addChip = (field, word) => setF((p) => {
    const cur = String(p[field] || "").trim();
    const parts = cur ? cur.split(/,\s*/) : [];
    if (parts.some((x) => x.toLowerCase() === word.toLowerCase())) return p; // no duplicates
    return { ...p, [field]: cur ? `${cur}, ${word}` : word };
  });

  const payload = () => {
    const body = {};
    for (const g of TEXT_GROUPS) for (const [k] of g.fields) body[k] = f[k] ?? "";
    for (const k of NUMERIC_KEYS) body[k] = f[k] ?? "";
    body.follow_up_date = f.follow_up_date ? String(f.follow_up_date).slice(0, 10) : "";
    if (canPrivate) body.doctor_private_notes = f.doctor_private_notes ?? "";
    return body;
  };

  const saveDraft = async () => {
    // The server needs the three required fields to exist even on a draft; send empty strings if blank.
    if (noteId) {
      await api.put(`/api/visits/${visitId}/clinical-notes/${noteId}`, payload());
      return noteId;
    }
    const created = await api.post(`/api/visits/${visitId}/clinical-notes`, payload());
    setNoteId(created.id);
    return created.id;
  };

  const doSave = async () => {
    setBusy(true); setError("");
    try { await saveDraft(); setSavedAt(new Date()); onSaved(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const doComplete = async () => {
    for (const [k, label] of [["chief_complaint", "Chief complaint"], ["diagnosis", "Diagnosis"], ["treatment_plan", "Treatment plan"]]) {
      if (!String(f[k] || "").trim()) { setError(`${label} is required to complete the note.`); return; }
    }
    setBusy(true); setError("");
    try {
      const id = await saveDraft();
      await api.put(`/api/visits/${visitId}/clinical-notes/${id}`, { ...payload(), status: "completed" });
      onSaved(); onClose();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Overlay title={noteId ? "Consultation (draft)" : "Consultation"} onClose={onClose}>
      <Err message={error} />
      <NoteSnapshot allergy={knownAllergy} lastVisit={lastVisit} />
      <VitalsBar data={f} />

      <SoapSection letter="S" title="Subjective">
        <Fld label="Chief complaint *"><Txt value={f.chief_complaint} onChange={set("chief_complaint")} rows={2} placeholder="Why the patient came in" /></Fld>
        <ChipRow options={COMPLAINT_CHIPS} onPick={(w) => addChip("chief_complaint", w)} />
        <More label="Add history & review of systems" open={!!expanded.s} onToggle={() => tog("s")} count={filled(SUBJECTIVE_MORE.map((x) => x[0]))}>
          {SUBJECTIVE_MORE.map(([k, label, rows]) => <Fld key={k} label={label}><Txt value={f[k]} onChange={set(k)} rows={rows} /></Fld>)}
        </More>
      </SoapSection>

      <SoapSection letter="O" title="Objective" hint="examination">
        <Fld label="General examination"><Txt value={f.general_examination} onChange={set("general_examination")} rows={2} placeholder="On examination…" /></Fld>
        <More label="Add system examinations" open={!!expanded.o} onToggle={() => tog("o")} count={filled(EXAM_MORE.map((x) => x[0]))}>
          {EXAM_MORE.map(([k, label, rows]) => <Fld key={k} label={label}><Txt value={f[k]} onChange={set(k)} rows={rows} /></Fld>)}
        </More>
      </SoapSection>

      <SoapSection letter="A" title="Assessment">
        <Fld label="Diagnosis *"><Txt value={f.diagnosis} onChange={set("diagnosis")} rows={2} placeholder="Working diagnosis" /></Fld>
        <More label="Add differentials & ICD code" open={!!expanded.a} onToggle={() => tog("a")} count={filled(["differential_diagnoses", "icd_code"])}>
          <Fld label="Differential diagnoses"><Txt value={f.differential_diagnoses} onChange={set("differential_diagnoses")} rows={2} /></Fld>
          <Fld label="ICD code"><Txt value={f.icd_code} onChange={set("icd_code")} rows={1} /></Fld>
        </More>
      </SoapSection>

      <SoapSection letter="P" title="Plan">
        <Fld label="Treatment plan *"><Txt value={f.treatment_plan} onChange={set("treatment_plan")} rows={3} placeholder="Medications, procedures, advice" /></Fld>
        <More label="Add orders, referral & follow-up" open={!!expanded.p} onToggle={() => tog("p")} count={filled(PLAN_MORE)}>
          <Fld label="Investigations ordered"><Txt value={f.investigations_ordered} onChange={set("investigations_ordered")} rows={2} /></Fld>
          <Fld label="Referral (to whom / where)"><Txt value={f.referral} onChange={set("referral")} rows={1} /></Fld>
          <Fld label="Referral reason"><Txt value={f.referral_reason} onChange={set("referral_reason")} rows={2} /></Fld>
          <Fld label="Follow-up instructions"><Txt value={f.follow_up_instructions} onChange={set("follow_up_instructions")} rows={2} /></Fld>
          <Fld label="Follow-up date">
            <input type="date" value={f.follow_up_date ? String(f.follow_up_date).slice(0, 10) : ""} onChange={(e) => set("follow_up_date")(e.target.value)} style={inputStyle} />
          </Fld>
        </More>
      </SoapSection>

      {canPrivate && (
        <div style={{ background: WHITE, borderRadius: 16, marginBottom: 10, boxShadow: SHADOW_SOFT, padding: "6px 14px" }}>
          <More label="Doctor's private notes (only doctors can see)" open={!!expanded.priv} onToggle={() => tog("priv")} count={filled(["doctor_private_notes"])}>
            <Fld label="Private notes"><Txt value={f.doctor_private_notes} onChange={set("doctor_private_notes")} rows={3} /></Fld>
          </More>
        </div>
      )}

      <div style={{ fontSize: 11.5, color: FAINT, margin: "4px 0 10px", lineHeight: 1.5 }}>
        Fields marked * are required to complete. A completed note is locked and cannot be edited. {savedAt ? `Draft saved ${savedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.` : ""}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><Btn tone="plain" onClick={doSave} disabled={busy}><Save size={15} /> Save draft</Btn></div>
        <div style={{ flex: 1 }}><Btn onClick={doComplete} disabled={busy}><CheckCircle2 size={15} /> Complete note</Btn></div>
      </div>
    </Overlay>
  );
}

/* ----------------------------- Read-only note view ----------------------------- */

const VIEW_ROWS = [
  ["chief_complaint", "Chief complaint"], ["history_of_presenting_complaint", "History"], ["duration", "Duration"],
  ["past_medical_history", "Past medical history"], ["surgical_history", "Surgical history"], ["family_history", "Family history"],
  ["social_history", "Social history"], ["allergies", "Allergies"], ["current_medications", "Current medications"],
  ["immunisation_history", "Immunisations"], ["review_of_systems", "Review of systems"],
  ["general_examination", "General exam"], ["cardiovascular_examination", "Cardiovascular"], ["respiratory_examination", "Respiratory"],
  ["abdominal_examination", "Abdominal"], ["neurological_examination", "Neurological"], ["musculoskeletal_examination", "Musculoskeletal"],
  ["other_examination", "Other exam"], ["diagnosis", "Diagnosis"], ["differential_diagnoses", "Differentials"], ["icd_code", "ICD code"],
  ["treatment_plan", "Treatment plan"], ["investigations_ordered", "Investigations"], ["referral", "Referral"], ["referral_reason", "Referral reason"],
  ["follow_up_instructions", "Follow-up instructions"], ["doctor_private_notes", "Private notes"],
];

function NoteView({ visitId, note, user, onClose }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [addenda, setAddenda] = useState([]);
  const [addText, setAddText] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const canAddendum = WRITE_NOTE_ROLES.includes(user?.role) && note.status === "completed";
  const loadAddenda = useCallback(async () => {
    if (note.status !== "completed") return;
    try { setAddenda(await api.get(`/api/visits/${visitId}/clinical-notes/${note.id}/addenda`)); } catch (e) { /* older server without addenda: just hide */ }
  }, [visitId, note.id, note.status]);
  useEffect(() => { loadAddenda(); }, [loadAddenda]);
  const saveAddendum = async () => {
    setAddBusy(true); setError("");
    try { await api.post(`/api/visits/${visitId}/clinical-notes/${note.id}/addenda`, { body: addText }); setAddText(""); await loadAddenda(); }
    catch (e) { setError(e.message); }
    finally { setAddBusy(false); }
  };
  const vitals = VITAL_FIELDS.filter(([k]) => note[k] !== null && note[k] !== undefined && note[k] !== "");
  const openPdf = async () => {
    setError("");
    const tab = window.open("", "_blank");
    setBusy(true);
    try {
      const { url } = await api.get(`/api/visits/${visitId}/clinical-notes/${note.id}/pdf`);
      if (tab) tab.location.href = url;
    } catch (e) { if (tab) tab.close(); setError(e.message); }
    finally { setBusy(false); }
  };
  return (
    <Overlay title="Clinical note" onClose={onClose}>
      <div style={{ fontSize: 12, color: FAINT, marginBottom: 10 }}>
        {note.status === "completed" ? `Completed ${fmtDateTime(note.completed_at)}` : "Draft"} · locked once completed
      </div>
      <Err message={error} />
      {vitals.length > 0 && (
        <div style={{ background: WHITE, borderRadius: 14, padding: 12, marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {vitals.map(([k, label]) => (
            <div key={k} style={{ fontSize: 13 }}><span style={{ color: FAINT }}>{label}: </span><b style={isAbnormal(k, note[k]) ? ABN : undefined}>{note[k]}{isAbnormal(k, note[k]) ? " \u25b2" : ""}</b></div>
          ))}
          {note.bmi && <div style={{ fontSize: 13 }}><span style={{ color: FAINT }}>BMI: </span><b>{note.bmi}</b></div>}
        </div>
      )}
      {VIEW_ROWS.filter(([k]) => note[k]).map(([k, label]) => (
        <div key={k} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTE, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
          <div style={{ fontSize: 14, color: INK, whiteSpace: "pre-wrap" }}>{note[k]}</div>
        </div>
      ))}
      {note.follow_up_date && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTE, textTransform: "uppercase", letterSpacing: 0.4 }}>Follow-up date</div>
          <div style={{ fontSize: 14 }}>{fmtDate(note.follow_up_date)}</div>
        </div>
      )}
      {note.status === "completed" && (
        <div style={{ marginTop: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTE, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Addenda (dated corrections)</div>
          {addenda.length === 0 && <div style={{ fontSize: 13, color: FAINT, marginBottom: 6 }}>None. The signed note above cannot be edited; add a dated addendum to correct or extend it.</div>}
          {addenda.map((ad) => (
            <div key={ad.id} style={{ background: WHITE, borderRadius: 12, padding: "9px 12px", marginBottom: 6 }}>
              <div style={{ fontSize: 11.5, color: FAINT }}>{fmtDateTime(ad.created_at)} · {ad.added_by_name} ({ad.added_by_role})</div>
              <div style={{ fontSize: 13.5, color: INK, whiteSpace: "pre-wrap" }}>{ad.body}</div>
            </div>
          ))}
          {canAddendum && (
            <>
              <Txt value={addText} onChange={setAddText} rows={2} placeholder="Add a correction or additional finding..." />
              <div style={{ marginTop: 6 }}><Btn tone="plain" onClick={saveAddendum} disabled={addBusy || !addText.trim()}><Plus size={15} /> {addBusy ? "Saving..." : "Add addendum"}</Btn></div>
            </>
          )}
        </div>
      )}
      {note.status === "completed" && (
        <Btn tone="teal" onClick={openPdf} disabled={busy}><FileText size={16} /> {busy ? "Opening..." : "Open PDF summary"}</Btn>
      )}
    </Overlay>
  );
}

/* ----------------------------- Section shown inside a Visit ----------------------------- */

export function ClinicalSection({ visitId, visitOpen, user, patientId }) {
  const role = user?.role;
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null); // {note?}
  const [viewing, setViewing] = useState(null);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [vitalsMsg, setVitalsMsg] = useState("");
  const [histAllergy, setHistAllergy] = useState("");
  const [lastVisit, setLastVisit] = useState(null);
  const [lastVitals, setLastVitals] = useState(null);

  const load = useCallback(async () => {
    if (!canViewClinical(role)) return; // don't even ask the server (it would refuse)
    try { setNotes(await api.get(`/api/visits/${visitId}/clinical-notes`)); setError(""); }
    catch (e) { setError(e.message); setNotes([]); }
  }, [visitId, role]);
  useEffect(() => { load(); }, [load]);
  // Snapshot context for the editor: allergies, last completed visit, latest vitals.
  useEffect(() => {
    if (!patientId || !canViewClinical(role)) return;
    let live = true;
    api.get(`/api/patients/${patientId}/clinical-history`)
      .then((r) => { if (live) { setHistAllergy((r.find((x) => x.allergies && String(x.allergies).trim()) || {}).allergies || ""); setLastVisit(r[0] || null); } })
      .catch(() => {});
    // This visit's nurse-recorded vitals (not a stale prior visit's) for the view-only bar.
    api.get(`/api/patients/${patientId}/vitals-history`)
      .then((r) => { if (live) setLastVitals((r || []).find((v) => v.visit_id === visitId) || null); })
      .catch(() => {});
    return () => { live = false; };
  }, [patientId, role, visitId]);

  if (!canViewClinical(role)) return null;
  const canWrite = WRITE_NOTE_ROLES.includes(role);
  const canVitals = VITALS_ROLES.includes(role);

  return (
    <div style={{ background: WHITE, borderRadius: 18, padding: 14, marginBottom: 14, boxShadow: SHADOW_SOFT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Stethoscope size={17} color={TEAL} />
        <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>Clinical record</div>
      </div>
      <Err message={error} />
      <AllergyBanner text={((notes || []).find((n) => n.allergies && String(n.allergies).trim()) || {}).allergies || histAllergy} />
      {vitalsMsg && <div style={{ fontSize: 12.5, color: TEAL, fontWeight: 600, marginBottom: 8 }}>{vitalsMsg}</div>}

      {notes === null ? (
        <div style={{ fontSize: 13, color: FAINT }}>Loading...</div>
      ) : notes.length === 0 ? (
        <div style={{ fontSize: 13, color: FAINT, marginBottom: 10 }}>No consultation recorded for this visit yet.</div>
      ) : (
        notes.map((n) => (
          <div key={n.id} style={{ padding: "9px 0", borderTop: `1px solid ${SUBTLE}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.chief_complaint || "(no complaint recorded)"}</div>
              <div style={{ fontSize: 11.5, color: n.status === "completed" ? TEAL : RED, fontWeight: 600 }}>
                {n.status === "completed" ? <><Lock size={10} /> Completed {fmtDate(n.completed_at)}</> : "Draft"}
                {n.diagnosis ? <span style={{ color: FAINT, fontWeight: 500 }}> · {n.diagnosis}</span> : null}
              </div>
            </div>
            {n.status === "draft" && canWrite && visitOpen
              ? <Btn small tone="plain" onClick={() => setEditor({ note: n })}>Continue</Btn>
              : <Btn small tone="plain" onClick={() => setViewing(n)}>View</Btn>}
          </div>
        ))
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {canVitals && visitOpen && <div style={{ flex: 1 }}><Btn tone="teal" onClick={() => setVitalsOpen(true)}><Activity size={15} /> Record vitals</Btn></div>}
        {canWrite && visitOpen && <div style={{ flex: 1 }}><Btn onClick={() => setEditor({ note: null })}><Plus size={15} /> Consultation</Btn></div>}
      </div>
      {!visitOpen && canWrite && <div style={{ fontSize: 11.5, color: FAINT, marginTop: 8 }}>This visit is closed, so new notes can't be added.</div>}

      {vitalsOpen && <VitalsSheet visitId={visitId} onClose={() => setVitalsOpen(false)} onSaved={() => setVitalsMsg("Vitals saved.")} />}
      {editor && <NoteEditor visitId={visitId} note={editor.note} canPrivate={role === "Doctor" || role === "Super Admin"} knownAllergy={((notes || []).find((n) => n.allergies && String(n.allergies).trim()) || {}).allergies || histAllergy} lastVisit={lastVisit} lastVitals={lastVitals} onClose={() => { setEditor(null); load(); }} onSaved={load} />}
      {viewing && <NoteView visitId={visitId} note={viewing} user={user} onClose={() => setViewing(null)} />}
    </div>
  );
}

/* ----------------------------- Timeline in a patient folder ----------------------------- */

export function PatientClinicalHistory({ patientId, user }) {
  const [rows, setRows] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!canViewClinical(user?.role)) return;
    let live = true;
    api.get(`/api/patients/${patientId}/clinical-history`)
      .then((r) => { if (live) setRows(r); })
      .catch((e) => { if (live) { setError(e.message); setRows([]); } });
    api.get(`/api/patients/${patientId}/vitals-history`)
      .then((r) => { if (live) setVitals(r.slice(0, 5)); })
      .catch(() => {});
    return () => { live = false; };
  }, [patientId, user?.role]);

  if (!canViewClinical(user?.role)) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: MUTE, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
        <History size={14} /> Clinical history
      </div>
      <Err message={error} />
      <AllergyBanner text={((rows || []).find((x) => x.allergies && String(x.allergies).trim()) || {}).allergies} />
      {rows === null ? <div style={{ fontSize: 13, color: FAINT }}>Loading...</div>
        : rows.length === 0 ? <div style={{ fontSize: 13, color: FAINT }}>No completed clinic visits on record yet.</div>
        : rows.map((r) => (
          <div key={r.id} style={{ background: WHITE, borderRadius: 14, padding: "10px 12px", marginBottom: 8, boxShadow: SHADOW_SOFT }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: FAINT }}>
              <span>{fmtDate(r.date)}</span><span>{r.doctor_name ? `Dr ${String(r.doctor_name).replace(/^dr\.?\s*/i, "")}` : ""}</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginTop: 2 }}>{r.chief_complaint}</div>
            <div style={{ fontSize: 12.5, color: MUTE, marginTop: 2 }}><b>Dx:</b> {r.diagnosis}</div>
            <div style={{ fontSize: 12.5, color: MUTE, marginTop: 1 }}><b>Plan:</b> {r.treatment_plan}</div>
          </div>
        ))}
      {vitals.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTE, marginBottom: 4 }}>Recent vitals <span style={{ fontWeight: 500, color: FAINT }}>(red = outside adult range)</span></div>
          {vitals.map((v) => (
            <div key={v.id} style={{ fontSize: 12.5, color: MUTE, padding: "4px 0", borderTop: `1px solid ${SUBTLE}` }}>
              {fmtDate(v.recorded_at)}:
              {v.blood_pressure_systolic ? <span style={isAbnormal("blood_pressure_systolic", v.blood_pressure_systolic) || isAbnormal("blood_pressure_diastolic", v.blood_pressure_diastolic) ? ABN : undefined}> BP {v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span> : null}
              {v.pulse_rate ? <span style={isAbnormal("pulse_rate", v.pulse_rate) ? ABN : undefined}> · P {v.pulse_rate}</span> : null}
              {v.temperature ? <span style={isAbnormal("temperature", v.temperature) ? ABN : undefined}> · T {v.temperature}°</span> : null}
              {v.oxygen_saturation ? <span style={isAbnormal("oxygen_saturation", v.oxygen_saturation) ? ABN : undefined}> · SpO₂ {v.oxygen_saturation}%</span> : null}
              {v.weight_kg ? ` · ${v.weight_kg}kg` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
