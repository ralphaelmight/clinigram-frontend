// iOS-style 12-tick activity spinner shown while pulling / refreshing.
// Pair with usePullToRefresh:
//   const { pull, refreshing } = usePullToRefresh(onRefresh);
//   <PullToRefresh pull={pull} refreshing={refreshing} />
export default function PullToRefresh({ pull = 0, refreshing = false, threshold = 70 }) {
  if (pull <= 0 && !refreshing) return null;

  const progress = Math.min(pull / threshold, 1);
  const y = refreshing ? 12 : Math.max(pull * 0.5 - 6, 0);
  const scale = refreshing ? 1 : 0.6 + progress * 0.4;
  const opacity = refreshing ? 1 : Math.min(progress * 1.3, 1);
  const windUp = refreshing ? 0 : progress * 300;

  return (
    <>
      <style>{`@keyframes ptr-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        position: 'fixed', left: '50%', zIndex: 40, pointerEvents: 'none',
        top: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        transform: `translate(-50%, ${y}px) scale(${scale})`,
        opacity,
        transition: refreshing ? 'transform 0.2s ease' : 'none',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(242,244,248,0.96)',
          boxShadow: '0 2px 10px -2px rgba(26,26,46,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            position: 'relative', width: 20, height: 20,
            transform: refreshing ? undefined : `rotate(${windUp}deg)`,
            animation: refreshing ? 'ptr-spin 0.9s linear infinite' : undefined,
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} style={{
                position: 'absolute', top: 0, left: '50%',
                width: 2, height: 6, marginLeft: -1, borderRadius: 2,
                background: '#e93223',
                transformOrigin: '1px 10px',
                transform: `rotate(${i * 30}deg)`,
                opacity: refreshing ? (i + 1) / 12 : progress >= (i + 1) / 12 ? 1 : 0.15,
              }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
