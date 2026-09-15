import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ProgrammeEvent = { id: string; time: string; title: string; note: string };
export type ProgrammeDay = { id: string; label: string; date: string; events: ProgrammeEvent[] };

export type SiteContent = {
  conference: { dateLabel: string; location: string; address: string; email: string };
  forms: { school: string; individual: string; officer: string; rlo: string };
  social: { instagram: string; tiktok: string };
  home: {
    heroEyebrow: string; heroSubtitle: string; aboutLabel: string; aboutHeading: string;
    aboutBodyOne: string; aboutBodyTwo: string; committeesHeading: string;
    journeyHeading: string; newsHeading: string; ctaHeading: string;
  };
  announcement: { enabled: boolean; label: string; title: string; body: string; linkLabel: string; link: string };
  programme: { notice: string; days: ProgrammeDay[] };
  visual: Record<string, { type: "text" | "image"; value: string; alt?: string }>;
};

export const defaultSiteContent: SiteContent = {
  conference: { dateLabel: "20–22 November 2026", location: "Het Rijnlands Lyceum Oegstgeest", address: "Apollolaan 1, 2341 BA Oegstgeest, The Netherlands", email: "info@rijnmun.org" },
  forms: { school: "https://forms.gle/YnfHWGUubXNuQQWn9", individual: "https://forms.gle/3txXmHfF5M9DBeUQ8", officer: "", rlo: "https://forms.gle/3txXmHfF5M9DBeUQ8" },
  social: { instagram: "https://www.instagram.com/rijn.mun?igsh=cWtvcHhlZzN3N2R5", tiktok: "https://www.tiktok.com/@rijn_mun" },
  home: {
    heroEyebrow: "Debate · Diplomacy · A brighter tomorrow", heroSubtitle: "Rijnlands Lyceum Oegstgeest\nModel United Nations",
    aboutLabel: "About RijnMUN", aboutHeading: "Where diplomacy begins.",
    aboutBodyOne: "Model United Nations is an educational simulation in which students represent countries, debate current global issues and build solutions together.",
    aboutBodyTwo: "Hosted by students of Het Rijnlands Lyceum Oegstgeest, RijnMUN is deliberately small and beginner-friendly—giving delegates aged 14–18 a supported first step into the MUN community.",
    committeesHeading: "Convergence: where perspectives unite for global progress.", journeyHeading: "From registration to the assembly.",
    newsHeading: "From the Secretariat.", ctaHeading: "Be part of the conversation."
  },
  announcement: { enabled: true, label: "Secretariat announcement", title: "Registration for RijnMUN 2026 is open.", body: "School delegations and individual delegates can now secure their place for November.", linkLabel: "View registration", link: "/registration" },
  programme: {
    notice: "The detailed 2026 timetable has not yet been released. This page will update once timings are confirmed.",
    days: [
      { id: "day-1", label: "DAY 01", date: "Friday 20 November", events: [{ id: "day-1-event-1", time: "TBA", title: "Arrival, workshops & lobbying", note: "The detailed programme will be announced by the Secretariat." }] },
      { id: "day-2", label: "DAY 02", date: "Saturday 21 November", events: [{ id: "day-2-event-1", time: "TBA", title: "Opening ceremony & committee sessions", note: "Timings and room assignments are to be announced." }] },
      { id: "day-3", label: "DAY 03", date: "Sunday 22 November", events: [{ id: "day-3-event-1", time: "TBA", title: "Committee sessions & closing ceremony", note: "Timings and final logistics are to be announced." }] },
    ],
  },
  visual: {},
};

export function mergeSiteContent(value: Partial<SiteContent>): SiteContent {
  return {
    conference: { ...defaultSiteContent.conference, ...value.conference },
    forms: { ...defaultSiteContent.forms, ...value.forms },
    social: { ...defaultSiteContent.social, ...value.social },
    home: { ...defaultSiteContent.home, ...value.home },
    announcement: { ...defaultSiteContent.announcement, ...value.announcement },
    programme: {
      ...defaultSiteContent.programme,
      ...value.programme,
      days: Array.isArray(value.programme?.days) ? value.programme.days : defaultSiteContent.programme.days,
    },
    visual: { ...defaultSiteContent.visual, ...value.visual },
  };
}

const ContentContext = createContext<SiteContent>(defaultSiteContent);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState(defaultSiteContent);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch("/api/public/content", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((value) => { if (active) setContent(mergeSiteContent(value)); }).catch(() => {});
    refresh();
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("rijnmun-content") : null;
    if (channel) channel.onmessage = refresh;
    const onMessage = (event: MessageEvent) => { if (event.origin === window.location.origin && event.data?.type === "rijnmun-preview") setContent(mergeSiteContent(event.data.content)); };
    window.addEventListener("message", onMessage);
    window.addEventListener("focus", refresh);
    return () => { active = false; channel?.close(); window.removeEventListener("message", onMessage); window.removeEventListener("focus", refresh); };
  }, []);
  const stable = useMemo(() => content, [content]);
  return <ContentContext.Provider value={stable}>{children}</ContentContext.Provider>;
}

export function useSiteContent() { return useContext(ContentContext); }
