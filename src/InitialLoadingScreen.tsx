import { useEffect } from "react";

/** Controls the pre-painted HTML shell without changing CMS element paths. */
export function InitialLoadingScreen() {
  useEffect(() => {
    const screen = document.getElementById("initial-loading-screen");
    const video = screen?.querySelector("video");
    if (!screen || !video) return;
    if (!document.documentElement.classList.contains("intro-active")) {
      screen.remove();
      return;
    }

    const root = document.getElementById("root");
    const previousInert = root?.inert ?? false;
    if (root) root.inert = true;
    let disposed = false;
    let leaving = false;
    let removal: number | undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const remove = () => {
      screen.remove();
      document.documentElement.classList.remove("intro-active");
      if (root) root.inert = previousInert;
    };
    const dismiss = (immediate = false) => {
      if (disposed) return;
      if (immediate) { window.clearTimeout(removal); remove(); return; }
      if (leaving) return;
      leaving = true;
      screen.classList.add("is-leaving");
      // Keep the final frame in place throughout the CSS opacity transition.
      removal = window.setTimeout(remove, 600);
    };

    // React has committed the site underneath. Give its first image a bounded
    // opportunity to decode, without waiting for every lazy image or API call.
    const firstImage = document.querySelector<HTMLImageElement>(".hero-image, .page-hero > img");
    let readinessTimeout: number | undefined;
    const ready = Promise.race([
      firstImage?.decode().catch(() => {}) ?? Promise.resolve(),
      new Promise<void>(resolve => { readinessTimeout = window.setTimeout(resolve, 2500); }),
    ]);
    const finish = () => { void ready.then(() => dismiss()); };
    const motionChanged = () => { if (reducedMotion.matches) dismiss(true); };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === screen && event.propertyName === "opacity" && leaving) remove();
    };

    video.muted = true;
    video.loop = false;
    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    screen.addEventListener("transitionend", onTransitionEnd);
    reducedMotion.addEventListener("change", motionChanged);
    // Independent safety net for stalled downloads or playback.
    const timeout = window.setTimeout(() => dismiss(), 10000);
    if (!video.getAttribute("src")) video.src = video.dataset.src!;
    try {
      void video.play().catch(finish);
    } catch {
      finish();
    }

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.clearTimeout(removal);
      window.clearTimeout(readinessTimeout);
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      screen.removeEventListener("transitionend", onTransitionEnd);
      reducedMotion.removeEventListener("change", motionChanged);
      if (root) root.inert = previousInert;
    };
  }, []);
  return null;
}
