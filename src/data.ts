export type Issue = { code: string; title: string; report?: string };
export type Committee = { abbreviation: string; name: string; shortName: string; image: string; issues: Issue[]; chairs: string[] };

// The legacy site still exposes conflicting October dates in stale metadata and a
// programme shell. The live rendered homepage (captured 15 Sep 2026) shows these
// November dates, so this is the single value to update when the secretariat confirms changes.
export const conference = {
  name: "RijnMUN",
  year: 2026,
  startDate: "2026-11-20T11:00:00+01:00",
  endDate: "2026-11-22T17:30:00+01:00",
  dateLabel: "20–22 November 2026",
  location: "Het Rijnlands Lyceum Oegstgeest",
  address: "Apollolaan 1, 2341 BA Oegstgeest, The Netherlands",
  email: "info@rijnmun.org",
  registrationStatus: "OPEN" as const,
  registrationLinks: {
    school: "https://forms.gle/YnfHWGUubXNuQQWn9",
    individual: "https://forms.gle/3txXmHfF5M9DBeUQ8",
    officer: "https://docs.google.com/forms/d/e/1FAIpQLScubMI5XszXKzvep6ih1ThUTQ7YzUzyiV0PmpQ_ZFarnyq3Vw/viewform?usp=header",
    rlo: "https://forms.gle/3txXmHfF5M9DBeUQ8",
  },
  fees: { delegate: 35, officer: 15, director: 15, lostBadge: 5 },
  socialLinks: {
    instagram: "https://www.instagram.com/rijn.mun?igsh=cWtvcHhlZzN3N2R5",
    tiktok: "https://www.tiktok.com/@rijn_mun",
  },
};

export const committees: Committee[] = [
  {
    abbreviation: "GA1",
    name: "International Security and Disarmament",
    shortName: "Disarmament & International Security",
    image: "/images/rijnmun-photo2.webp",
    chairs: [],
    issues: [
      { code: "GA101", title: "The regulation of autonomous weapons systems" },
      { code: "GA102", title: "Preventing cyber warfare against civilian infrastructure" },
    ],
  },
  {
    abbreviation: "GA3",
    name: "Social, Humanitarian and Cultural",
    shortName: "Social, Humanitarian & Cultural",
    image: "/images/rijnmun-photo1.webp",
    chairs: [],
    issues: [
      { code: "GA301", title: "Protecting indigenous communities amid development projects" },
      { code: "GA302", title: "Advancing gender equality in humanitarian response systems" },
    ],
  },
  {
    abbreviation: "GA4",
    name: "Special Political and Decolonization",
    shortName: "Special Political & Decolonization",
    image: "/images/rijnmun-photo3.webp",
    chairs: [],
    issues: [
      { code: "GA401", title: "The question of the Western Sahara" },
      { code: "GA402", title: "Addressing the rights of the Chagossian peoples of Diego Garcia" },
    ],
  },
  {
    abbreviation: "HRC",
    name: "Human Rights Council",
    shortName: "Human Rights Council",
    image: "/images/rijnmun-photo4.webp",
    chairs: [],
    issues: [
      { code: "HRC01", title: "The protection of journalists in conflict zones" },
      { code: "HRC02", title: "Ensuring humanitarian access to conflict zones" },
    ],
  },
  {
    abbreviation: "SC",
    name: "Security Council",
    shortName: "Security Council",
    image: "/images/rijnmun-photo2.webp",
    chairs: [],
    issues: [
      { code: "SC01", title: "The situation in Sudan" },
      { code: "SC02", title: "Maritime security in the Red Sea" },
    ],
  },
];

export const programme = [
  { day: "DAY 01", date: "Friday 20 November", events: [{ time: "TBA", title: "Arrival, workshops & lobbying", note: "The detailed programme will be announced by the Secretariat." }] },
  { day: "DAY 02", date: "Saturday 21 November", events: [{ time: "TBA", title: "Opening ceremony & committee sessions", note: "Timings and room assignments are to be announced." }] },
  { day: "DAY 03", date: "Sunday 22 November", events: [{ time: "TBA", title: "Committee sessions & closing ceremony", note: "Timings and final logistics are to be announced." }] },
];

export const resources = [
  { title: "Delegate Handbook", type: "PDF · 2025 edition", description: "Rules, preparation guidance, procedures and useful phrases for first-time delegates.", href: "/documents/delegate-handbook.pdf" },
  { title: "Note Paper Template", type: "PDF template", description: "Printable note paper for formal communication during committee sessions.", href: "/documents/note-paper-template.pdf" },
  { title: "Annotated Resolution", type: "PDF example", description: "A worked example showing the structure and conventions of a MUN resolution.", href: "/documents/annotated-resolution.pdf" },
  { title: "Rules of Procedure", type: "External guide", description: "RijnMUN follows the THIMUN rules of procedure.", href: "https://foundation.thimun.org/" },
  { title: "Research Reports", type: "Committee documents", description: "Chair-authored reports will appear with each issue when released.", href: "/committees" },
];

export const news = [
  { date: "14 September 2026", category: "Conference", title: "Committees and issues released", description: "The five committees and ten issues for RijnMUN 2026 are now available.", href: "/committees", image: "/images/rijnmun-photo2.webp", featured: true },
  { date: "12 October 2025", category: "Archive", title: "RijnMUN 2025 photos", description: "Photographs from RijnMUN 2025 are available in the RijnMUN photo archive.", href: "/archive", image: "/images/rijnmun-photo4.webp" },
  { date: "31 December 2024", category: "Archive", title: "RijnMUN archives", description: "Explore previous editions, committees and conference photographs.", href: "/archive", image: "/images/rlo_front.webp" },
];

export const journey = ["Register", "Receive your delegation", "Research", "Prepare", "Debate", "Build consensus", "RijnMUN"];

export const registrations = [
  { key: "school", title: "School delegations", audience: "For MUN directors reserving places for a school delegation.", status: "OPEN", fee: "No school registration fee · €35 per delegate", deadline: "Preliminary registration closes 31 August 2026.", link: conference.registrationLinks.school },
  { key: "individual", title: "Individual delegates", audience: "For delegates aged 14–18 joining independently. Beginners are welcome.", status: "OPEN", fee: "€35 per delegate", deadline: "Registration deadline to be announced.", link: conference.registrationLinks.individual },
  { key: "officer", title: "Student officers", audience: "For experienced MUN students applying to chair a committee.", status: "OPENING SOON", fee: "€15 per student officer", deadline: "The published application form is not currently public.", link: "mailto:info@rijnmun.org?subject=Student%20Officer%20application", action: "Contact Secretariat" },
  { key: "rlo", title: "RLO students", audience: "For Rijnlands Lyceum students joining MUN activities and RijnMUN.", status: "OPEN", fee: "See the registration form for current details.", deadline: "Thursday practice: sixth period, room N103.", link: conference.registrationLinks.rlo },
];

export const board: { name: string; role: string; image?: string }[] = [];
export const speakers: { name: string; role: string; image?: string }[] = [];
