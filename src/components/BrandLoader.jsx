// A branded "please wait" screen, used instead of plain "Loading..." text.
import React, { useEffect, useState } from "react";
import AnimatedLogo from "./AnimatedLogo";

// If it takes this long, the server is probably waking up: say so, so nobody thinks it froze.
const SLOW_AFTER_MS = 6000;

export default function BrandLoader({ label = "Loading", onRed = false }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);
  const text = onRed ? "#ffffff" : "#6b7280";
  return (
    <div role="status" aria-live="polite" style={{
      minHeight: "100dvh", background: onRed ? "#e42a1b" : "transparent", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14, padding: "0 32px", textAlign: "center",
    }}>
      <span className="fm-breathe"><AnimatedLogo size={72} animate={false} /></span>
      <div style={{ color: text, fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <span className="fm-dots" style={{ color: onRed ? "#ffffff" : "#4ba4a8" }} aria-hidden="true"><i /><i /><i /></span>
      {slow && <div style={{ color: text, fontSize: 12, maxWidth: 260 }}>Still working. The server can take up to a minute to wake up.</div>}
    </div>
  );
}
