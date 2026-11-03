// The Clinigram mark, rebuilt from the flat logo.jpg into layered SVG elements
// so each part — the grey ring, teal ring, red disc, white phone, the red
// medical cross and its tilted white plus — animates in on its own instead of
// scaling a static picture. Reused by the app splash and the onboarding intro.
//
// `size` sets the pixel box; `animate` (default true) plays the staggered
// entrance, and prefers-reduced-motion forces the finished state with no motion.
export default function AnimatedLogo({ size = 120, animate = true, className = '' }) {
  return (
    <span
      className={`cg-mark${animate ? '' : ' cg-mark-static'} ${className}`}
      style={{ width: size, height: size, display: 'inline-block', lineHeight: 0 }}
      aria-hidden="true"
    >
      <style>{markCss}</style>
      <svg viewBox="0 0 220 220" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* rings + disc */}
        <circle className="cg-el cg-ring-grey" cx="110" cy="110" r="105" fill="#e4e7ee" />
        <circle className="cg-el cg-ring-teal" cx="110" cy="110" r="96" fill="#42b4b8" />
        <circle className="cg-el cg-disc-red" cx="110" cy="110" r="86" fill="#e93223" />

        {/* phone */}
        <g className="cg-el cg-phone">
          <rect x="74" y="50" width="72" height="120" rx="17" fill="#ffffff" stroke="#5db2b6" strokeWidth="3.5" />
          <rect x="98" y="62" width="24" height="5" rx="2.5" fill="#9fd0d2" />
        </g>

        {/* red medical cross */}
        <g className="cg-el cg-cross">
          <rect x="96" y="82" width="28" height="64" rx="7" fill="#e93223" />
          <rect x="78" y="100" width="64" height="28" rx="7" fill="#e93223" />
        </g>

        {/* tilted white plus inside the cross */}
        <g className="cg-el cg-plus">
          <rect x="106" y="96" width="8" height="36" rx="4" fill="#ffffff" />
          <rect x="92" y="110" width="36" height="8" rx="4" fill="#ffffff" />
        </g>
      </svg>
    </span>
  );
}

const EASE = 'cubic-bezier(.34,1.56,.64,1)'; // gentle overshoot for a tactile "settle"

const markCss = `
.cg-mark .cg-el{transform-box:fill-box;transform-origin:center;}

.cg-mark .cg-ring-grey{opacity:0;animation:cgPop .55s ${EASE} .04s forwards;}
.cg-mark .cg-ring-teal{opacity:0;animation:cgPop .55s ${EASE} .16s forwards;}
.cg-mark .cg-disc-red{opacity:0;animation:cgPop .55s ${EASE} .28s forwards;}
.cg-mark .cg-phone{opacity:0;animation:cgRise .55s cubic-bezier(.22,1,.36,1) .48s forwards;}
.cg-mark .cg-cross{opacity:0;animation:cgStamp .5s ${EASE} .72s forwards;}
.cg-mark .cg-plus{opacity:0;transform:scale(.4) rotate(-90deg);animation:cgPlus .55s ${EASE} .92s forwards;}
/* one slow breathe once everything has landed */
.cg-mark svg{animation:cgBreathe 3.2s ease-in-out 1.5s infinite;transform-origin:center;}

@keyframes cgPop{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
@keyframes cgRise{0%{opacity:0;transform:translateY(16px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes cgStamp{0%{opacity:0;transform:scale(1.5) rotate(-8deg)}60%{opacity:1}100%{opacity:1;transform:scale(1) rotate(0deg)}}
@keyframes cgPlus{0%{opacity:0;transform:scale(.4) rotate(-90deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
@keyframes cgBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}

/* static: show the finished mark, no motion */
.cg-mark-static .cg-el{opacity:1 !important;animation:none !important;transform:none !important;}
.cg-mark-static svg{animation:none !important;}
.cg-mark-static .cg-plus{opacity:1 !important;transform:none !important;}

/* reduced-motion: same finished state, no motion */
@media (prefers-reduced-motion: reduce){
  .cg-mark .cg-el{opacity:1 !important;animation:none !important;transform:none !important;}
  .cg-mark svg{animation:none !important;}
  .cg-mark .cg-plus{opacity:1 !important;transform:none !important;}
}
`;
