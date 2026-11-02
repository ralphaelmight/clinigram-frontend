// Light haptic feedback — makes taps feel physical, like a native app.
// Uses the Web Vibration API (Android Chrome); iOS Safari silently ignores it.
// Every call is wrapped so it can never throw or block the UI.
//
//   haptic()           // light — most taps
//   haptic('medium')   // confirmations (saved, submitted)
//   haptic('heavy')    // rare, important moments

export function haptic(style = 'light') {
  try {
    const ms = style === 'heavy' ? 28 : style === 'medium' ? 16 : 10;
    navigator.vibrate?.(ms);
  } catch {
    /* no vibration support — ignore */
  }
}
