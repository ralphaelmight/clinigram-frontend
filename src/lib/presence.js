// Works out whether a signed-in person is still at the clinic.
//
// Phone and computer locations are often rough, especially indoors, and one bad reading must never
// sign anyone out. So:
//   - a reading counts as "outside" only if the person is outside even allowing for its error;
//   - it takes two such readings, a few seconds apart, to start the countdown;
//   - when the countdown ends, one more fresh "outside" reading is needed (a phone that has just
//     woken up must look again before acting);
//   - if the app hasn't seen them at the clinic for a while (it was closed or the phone was
//     locked), there is no countdown: two "outside" readings sign them out.
// A web app can only look while it is open on screen. It cannot follow anyone while closed.

export const GRACE_MS = 5 * 60 * 1000;
const CONFIRM_GAP_MS = 10 * 1000; // the two "outside" readings must be at least this far apart
const CONFIRM_AFTER_MS = 12 * 1000; // when to ask for the second one
const PENDING_EXPIRES_MS = 2 * 60 * 1000; // a lone "outside" reading older than this is forgotten
const AWAY_LONG_MS = 10 * 60 * 1000; // not seen at the clinic for this long: no countdown
const FRESH_MS = 60 * 1000; // a reading older than this is ignored
const LOOK_EVERY_MS = 60 * 1000;
const LOOK_AGAIN_MS = 20 * 1000; // while waiting for the final reading
const PRESENT_AGAIN_MS = 10 * 60 * 1000; // a tap counts as "here again" at most this often
const PRESENT_VALID_MS = 2 * 60 * 1000;

export function distanceMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// "inside", "outside", or "unsure" (too rough a reading to say they have left).
export function classify(coords, clinic) {
  const distance = distanceMetres(coords.latitude, coords.longitude, clinic.lat, clinic.lng);
  if (distance <= clinic.radius) return "inside";
  return distance - (coords.accuracy || 0) > clinic.radius ? "outside" : "unsure";
}

// Calls onPresent() when someone is evidently using the app: it was opened, brought back to the
// screen, or tapped after a while. Timers never count, so a screen nobody touches stays quiet.
export function watchUse(onPresent, { doc = document, now = Date.now } = {}) {
  let last = 0;
  const present = () => { last = now(); onPresent(); };
  const onVisible = () => { if (doc.visibilityState === "visible") present(); };
  const onTap = () => { if (now() - last >= PRESENT_AGAIN_MS) present(); };
  doc.addEventListener("visibilitychange", onVisible);
  doc.addEventListener("pointerdown", onTap, true);
  if (doc.visibilityState === "visible") present();
  return () => {
    doc.removeEventListener("visibilitychange", onVisible);
    doc.removeEventListener("pointerdown", onTap, true);
  };
}

export function watchPresence({
  clinic, geo, memory,
  onCountdown, // seconds left, 0 while taking the final reading, or null
  onLeft,
  onAtClinic, // seen at the clinic while the app is being used
  onLocationOff, // true when the device refuses to give a location
  doc = document, now = Date.now,
}) {
  let stopped = false;
  let firstOutsideAt = null;
  let lastOutsideAt = null;
  let deadline = null;
  let ticker = null;
  let confirmTimer = null;
  let lookedAt = 0;
  let presentAt = null;
  let firstStamp = null;
  let watchId = null;
  let poll = null;
  let stopWatchingUse = null;

  const clearOutside = () => {
    firstOutsideAt = lastOutsideAt = deadline = null;
    clearInterval(ticker); ticker = null;
    clearTimeout(confirmTimer); confirmTimer = null;
    onCountdown(null);
  };

  const leave = () => {
    stop();
    onLeft();
  };

  const tick = () => {
    const left = Math.ceil((deadline - now()) / 1000);
    onCountdown(Math.max(0, left));
    if (left <= 0 && now() - lookedAt >= LOOK_AGAIN_MS) look(true);
  };

  const onReading = (pos) => {
    if (stopped) return;
    const t = now();
    if (pos.timestamp && t - pos.timestamp > FRESH_MS) return;
    onLocationOff(false);
    const where = classify(pos.coords, clinic);

    if (where === "inside") {
      clearOutside();
      memory.setLastInside(t);
      if (presentAt !== null && t - presentAt <= PRESENT_VALID_MS) {
        presentAt = null;
        onAtClinic({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }
      return;
    }
    if (where !== "outside") return;

    if (deadline !== null) {
      lastOutsideAt = t;
      if (t >= deadline) leave();
      return;
    }
    if (firstOutsideAt === null || t - lastOutsideAt > PENDING_EXPIRES_MS) {
      firstOutsideAt = lastOutsideAt = t;
      firstStamp = pos.timestamp ?? null;
      clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => look(true), CONFIRM_AFTER_MS);
      return;
    }
    // The same remembered reading handed over again is not a second look.
    if (firstStamp !== null && pos.timestamp === firstStamp) return;
    lastOutsideAt = t;
    if (t - firstOutsideAt < CONFIRM_GAP_MS) return;

    const seen = memory.getLastInside();
    if (seen && t - seen > AWAY_LONG_MS) { leave(); return; }
    deadline = firstOutsideAt + GRACE_MS;
    ticker = setInterval(tick, 1000);
    tick();
  };

  const onFailure = (err) => {
    // 1 = permission refused, 2 = no position available. A slow reply (3) is nothing to report.
    if (!stopped && (err?.code === 1 || err?.code === 2)) onLocationOff(true);
  };

  function look(precise = false) {
    if (stopped) return;
    lookedAt = now();
    geo.getCurrentPosition(onReading, onFailure, { enableHighAccuracy: precise, maximumAge: 0, timeout: 20000 });
  }

  watchId = geo.watchPosition(onReading, onFailure, { enableHighAccuracy: false, maximumAge: 30000, timeout: 30000 });
  poll = setInterval(() => { if (doc.visibilityState === "visible") look(); }, LOOK_EVERY_MS);
  stopWatchingUse = watchUse(() => { presentAt = now(); look(); }, { doc, now });

  function stop() {
    if (stopped) return;
    clearOutside();
    stopped = true;
    clearInterval(poll);
    geo.clearWatch(watchId);
    stopWatchingUse?.();
  }

  return stop;
}
