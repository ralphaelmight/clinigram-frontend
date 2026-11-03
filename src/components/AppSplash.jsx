import { useEffect, useState } from 'react';
import AnimatedLogo from './AnimatedLogo';

// Launch screen shown on every app open — the original Clinigram start screen
// (red gradient, white logo tile, wordmark + tagline, pulsing dots), now with a
// polished entrance: the logo settles in with a soft glow, the wordmark and
// tagline rise in, then it fades to the app. Restrained, GPU-only, ~1.8s.
// Respects prefers-reduced-motion. ?splashdev holds it on screen for review.
export default function AppSplash() {
  const [done, setDone] = useState(false);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold = typeof window !== 'undefined' && window.location.search.includes('splashdev');

  useEffect(() => {
    if (hold) return;
    const t = setTimeout(() => setDone(true), reduced ? 650 : 2350);
    return () => clearTimeout(t);
  }, [reduced, hold]);

  if (done) return null;

  return (
    <div className={`cg-splash${reduced ? ' cg-reduced' : ''}`} role="status" aria-label="Clinigram Facility Manager">
      <style>{css}</style>
      <span className="cg-blob cg-blob1" aria-hidden="true" />
      <span className="cg-blob cg-blob2" aria-hidden="true" />
      <span className="cg-blob cg-blob3" aria-hidden="true" />

      <div className="cg-content">
        <div className="cg-logo">
          <span className="cg-halo" aria-hidden="true" />
          <AnimatedLogo size={100} animate={!reduced} />
        </div>
        <p className="cg-name">Clinigram</p>
        <p className="cg-sub">FACILITY MANAGER</p>
        <p className="cg-tag">Streamline your clinic, one screen at a time.</p>
      </div>

      <div className="cg-dots" aria-hidden="true">
        <span /><span /><span />
      </div>
    </div>
  );
}

const EASE = 'cubic-bezier(.22,1,.36,1)';

const css = `
.cg-splash{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:0 32px;overflow:hidden;
  background:linear-gradient(160deg,#e93223 0%,#fc0101 55%,#c31a0f 100%);
  animation:cgOut .5s ease-in 1.95s forwards;}
@keyframes cgOut{to{opacity:0;visibility:hidden}}

/* soft decorative circles, drifting in gently */
.cg-blob{position:absolute;border-radius:50%;opacity:0;animation:cgBlob 1.3s ${EASE} forwards;}
.cg-blob1{top:-64px;right:-64px;width:256px;height:256px;background:rgba(255,255,255,.10);animation-delay:.05s;}
.cg-blob2{top:96px;left:-80px;width:208px;height:208px;background:rgba(255,255,255,.10);animation-delay:.15s;}
.cg-blob3{bottom:-80px;right:-40px;width:240px;height:240px;background:rgba(0,0,0,.10);animation-delay:.1s;}
@keyframes cgBlob{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:scale(1)}}

.cg-content{position:relative;display:flex;flex-direction:column;align-items:center;}

.cg-logo{position:relative;width:112px;height:112px;border-radius:30px;background:#fff;
  display:flex;align-items:center;justify-content:center;box-shadow:0 20px 50px rgba(0,0,0,.28);
  opacity:0;transform:scale(.82);animation:cgLogo .75s ${EASE} .1s forwards;will-change:transform,opacity;}
.cg-logo img{width:96px;height:96px;border-radius:24px;object-fit:cover;}
/* one gentle glow pulse behind the tile */
.cg-halo{position:absolute;inset:-14px;border-radius:42px;background:rgba(255,255,255,.55);
  opacity:0;transform:scale(.85);filter:blur(10px);animation:cgHalo 1.1s ease-out .35s;}
@keyframes cgLogo{0%{opacity:0;transform:scale(.82)}60%{opacity:1}100%{opacity:1;transform:scale(1)}}
@keyframes cgHalo{0%{opacity:0;transform:scale(.85)}35%{opacity:.6}100%{opacity:0;transform:scale(1.25)}}

.cg-name{margin:28px 0 0;color:#fff;font-family:'Poppins','Segoe UI',Arial,sans-serif;font-weight:800;font-size:30px;
  letter-spacing:-.3px;line-height:1;opacity:0;transform:translateY(12px);animation:cgRise .6s ${EASE} .42s forwards;}
.cg-sub{margin:7px 0 0;color:rgba(255,255,255,.82);font-family:'Poppins','Segoe UI',Arial,sans-serif;font-weight:700;
  font-size:10px;letter-spacing:2px;opacity:0;animation:cgSub .55s ${EASE} .58s forwards;}
.cg-tag{margin:20px 0 0;max-width:240px;color:rgba(255,255,255,.92);font-family:'Poppins','Segoe UI',Arial,sans-serif;
  font-weight:500;font-size:15px;line-height:1.4;opacity:0;transform:translateY(12px);animation:cgRise .6s ${EASE} .72s forwards;}
@keyframes cgRise{to{opacity:1;transform:translateY(0)}}
@keyframes cgSub{to{opacity:1;letter-spacing:4px}}

.cg-dots{position:absolute;bottom:44px;display:flex;gap:7px;opacity:0;animation:cgDotsIn .4s ease .95s forwards;}
.cg-dots span{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.6);animation:cgPulse 1s ease-in-out infinite;}
.cg-dots span:nth-child(2){animation-delay:.2s}
.cg-dots span:nth-child(3){animation-delay:.4s}
@keyframes cgDotsIn{to{opacity:1}}
@keyframes cgPulse{0%,100%{opacity:.4;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}

/* reduced motion: no motion, brief fade */
.cg-reduced .cg-blob,.cg-reduced .cg-logo,.cg-reduced .cg-halo,.cg-reduced .cg-name,
.cg-reduced .cg-sub,.cg-reduced .cg-tag,.cg-reduced .cg-dots,.cg-reduced .cg-dots span{animation:none;}
.cg-reduced .cg-blob{opacity:1;transform:none;}
.cg-reduced .cg-logo{opacity:1;transform:none;}
.cg-reduced .cg-name,.cg-reduced .cg-tag{opacity:1;transform:none;}
.cg-reduced .cg-sub{opacity:1;letter-spacing:4px;}
.cg-reduced .cg-dots{opacity:1;}
.cg-reduced.cg-splash{animation:cgOut .5s ease-in .35s forwards;}
`;
