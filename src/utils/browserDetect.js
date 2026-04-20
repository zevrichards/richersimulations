// Utility helpers for detecting mobile devices and in-app browsers
// (Instagram, Facebook, TikTok, etc. which often break Firebase popup
// and sometimes redirect auth). Used by the sign-in flow to decide
// between popup vs redirect vs "please open in system browser".

const IN_APP_BROWSER_SIGNATURES = [
  "FBAN", "FBAV", "FB_IAB", // Facebook / Messenger
  "Instagram",
  "Line",
  "Twitter",
  "TikTok",
  "musical_ly", // older TikTok
  "LinkedInApp",
  "Snapchat",
  "Pinterest",
  "WeChat", "MicroMessenger",
  "KAKAOTALK",
];

export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const pattern = new RegExp(IN_APP_BROWSER_SIGNATURES.join("|"), "i");
  return pattern.test(ua);
}

export function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

// Returns a URL that (best-effort) forces the page to re-open in the
// OS's default browser rather than the current in-app web view.
//
// Android:  an `intent://` URL that launches Chrome via Android intents.
// iOS:      prefixing with `x-safari-https://` opens Safari for most apps
//           that honour it (Instagram/Facebook honour it on recent iOS).
// Fallback: returns the plain URL, which some in-app browsers still open
//           externally if the user taps "Open in Browser" themselves.
export function buildOpenInBrowserUrl(targetUrl) {
  try {
    const url = new URL(targetUrl);
    if (isAndroid()) {
      // Strip scheme; intent:// takes host+path and a scheme fallback.
      const withoutScheme = targetUrl.replace(/^https?:\/\//, "");
      return (
        "intent://" +
        withoutScheme +
        "#Intent;scheme=https;package=com.android.chrome;" +
        "S.browser_fallback_url=" +
        encodeURIComponent(targetUrl) +
        ";end"
      );
    }
    if (isIOS()) {
      // Replaces https:// with x-safari-https://
      if (url.protocol === "https:") {
        return "x-safari-https://" + targetUrl.slice("https://".length);
      }
    }
    return targetUrl;
  } catch (e) {
    return targetUrl;
  }
}
