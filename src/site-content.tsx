import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  announcement: { enabled: true, label: "Secretariat announcement", title: "Registration for RijnMUN 2026 is open.", body: "School delegations and individual delegates can now secure their place for November.", linkLabel: "View registration", link: "/registration" }
};

function mergeContent(value: Partial<SiteContent>): SiteContent {
  return {
    conference: { ...defaultSiteContent.conference, ...value.conference },
    forms: { ...defaultSiteContent.forms, ...value.forms },
    social: { ...defaultSiteContent.social, ...value.social },
    home: { ...defaultSiteContent.home, ...value.home },
    announcement: { ...defaultSiteContent.announcement, ...value.announcement },
  };
}

const ContentContext = createContext<SiteContent>(defaultSiteContent);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState(defaultSiteContent);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch("/api/public/content", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((value) => { if (active) setContent(mergeContent(value)); }).catch(() => {});
    refresh();
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("rijnmun-content") : null;
    if (channel) channel.onmessage = refresh;
    const onMessage = (event: MessageEvent) => { if (event.origin === window.location.origin && event.data?.type === "rijnmun-preview") setContent(mergeContent(event.data.content)); };
    window.addEventListener("message", onMessage);
    window.addEventListener("focus", refresh);
    return () => { active = false; channel?.close(); window.removeEventListener("message", onMessage); window.removeEventListener("focus", refresh); };
  }, []);
  const stable = useMemo(() => content, [content]);
  return <ContentContext.Provider value={stable}>{children}</ContentContext.Provider>;
}

export function useSiteContent() { return useContext(ContentContext); }
