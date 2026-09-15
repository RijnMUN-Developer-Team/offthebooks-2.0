import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Mail as MailIcon,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { board, committees, conference, journey, news, programme, registrations, resources, speakers } from "./data";
import { AdminPage } from "./Admin";
import { ArchivePage } from "./Archive";
import { SiteContentProvider, useSiteContent } from "./site-content";

const nav = [
  ["Home", "/"],
  ["General Information", "/rijnmun-2026"],
  ["Committees & Issues", "/committees"],
  ["Programme", "/programme"],
  ["Board", "/board"],
  ["Speakers", "/speakers"],
  ["Venue & Leiden", "/venue"],
  ["Contact", "/contact"],
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function ArrowLink({ to, children, external = false, className = "text-link" }: { to: string; children: React.ReactNode; external?: boolean; className?: string }) {
  const props = external ? { target: "_blank", rel: "noreferrer" } : {};
  return <Link className={className} to={to} {...props}>{children}<ArrowRight size={17} aria-hidden="true" /></Link>;
}

function Header() {
  const content = useSiteContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <><VisualEditingBridge /><header className={`site-header ${scrolled || location.pathname !== "/" ? "is-solid" : ""}`}>
      <Link to="/" className="brand" aria-label="RijnMUN home">
        <img src="/images/logo.webp" alt="RijnMUN globe and laurel logo" />
        <span><b>RIJNMUN</b><small>OEGSTGEEST</small></span>
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {nav.map(([label, href]) => <NavLink key={href} to={href} end={href === "/"}>{label}</NavLink>)}
      </nav>
      <Link to="/registration" className="nav-register">Register <ArrowRight size={16} /></Link>
      <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}><Menu /></button>
      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .45, ease }}>
            <button onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
            <div className="eyebrow">RijnMUN 2026</div>
            <nav aria-label="Mobile navigation">{nav.map(([label, href], index) => <motion.div key={href} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .08 + index * .04 }}><NavLink to={href} end={href === "/"}>{label}</NavLink></motion.div>)}</nav>
            <Link className="button button-gold" to="/registration">Register for RijnMUN <ArrowRight size={18} /></Link>
            <p>{content.conference.dateLabel}<br />Oegstgeest, The Netherlands</p>
          </motion.div>
        )}
      </AnimatePresence>
    </header></>
  );
}

function Footer() {
  const content = useSiteContent();
  return (
    <footer className="footer">
      <div className="footer-word" aria-hidden="true">RIJNMUN</div>
      <div className="footer-top">
        <div className="footer-identity"><img src="/images/logo.webp" alt="" /><h3>Rijnlands Lyceum Oegstgeest<br />Model United Nations</h3><p>Students today.<br /><em>A more peaceful tomorrow.</em></p></div>
        <div><h4>Conference</h4><Link to="/rijnmun-2026">About RijnMUN</Link><Link to="/committees">Committees</Link><Link to="/programme">Programme</Link><Link to="/registration">Registration</Link></div>
        <div><h4>Resources</h4><Link to="/resources">Delegate Handbook</Link><Link to="/resources">Research Reports</Link><Link to="/resources">Rules of Procedure</Link><Link to="/archive">Photo archive</Link></div>
        <div><h4>Contact</h4><a href={`mailto:${content.conference.email}`}>{content.conference.email}</a><p>{content.conference.address}</p><div className="socials"><a href={content.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><img src="/images/instagram-black.webp" alt="" /></a><a href={content.social.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"><img src="/images/tiktok-black.webp" alt="" /></a></div></div>
      </div>
      <div className="footer-bottom"><span>© RijnMUN {new Date().getFullYear()}</span><span>A student-run conference at Rijnlands Lyceum Oegstgeest.</span></div>
    </footer>
  );
}

function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  const start = new Date(conference.startDate).getTime();
  const end = new Date(conference.endDate).getTime();
  if (now >= start && now <= end) return <div className="session-message">RijnMUN {conference.year} is now in session</div>;
  if (now > end) return <div className="session-message">Thank you for joining RijnMUN {conference.year}</div>;
  const remaining = Math.max(0, start - now);
  const parts = [
    [Math.floor(remaining / 86400000), "Days"],
    [Math.floor((remaining / 3600000) % 24), "Hours"],
    [Math.floor((remaining / 60000) % 60), "Minutes"],
    [Math.floor((remaining / 1000) % 60), "Seconds"],
  ];
  return <div className="countdown" aria-label="Countdown to RijnMUN 2026"><div className="countdown-label">Time until<br />RijnMUN 2026</div>{parts.map(([value, label]) => <div className="countdown-part" key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}<div className="countdown-quote">“Global challenges.<br />Student solutions.”</div></div>;
}

function Hero() {
  const content = useSiteContent();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, 110]);
  return (
    <section className="hero">
      <motion.img style={{ y }} className="hero-image" src="/images/rijnmun-photo4.webp" alt="RijnMUN delegates collaborating during a committee session" />
      <div className="hero-overlay" />
      <div className="globe-grid" aria-hidden="true" />
      <div className="hero-content">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 }} className="eyebrow light">{content.home.heroEyebrow}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .85, ease }}>RIJNMUN<br /><span>2026</span></motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .7 }} className="hero-subtitle">{content.home.heroSubtitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</motion.p>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .7 }} className="hero-facts"><span><CalendarDays />{content.conference.dateLabel}</span><span><MapPin />{content.conference.location}</span></motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45, duration: .7 }} className="hero-actions"><Link className="button button-primary" to="/registration">Register <ArrowRight /></Link><Link className="button button-outline" to="/rijnmun-2026">Explore RijnMUN 2026</Link></motion.div>
      </div>
      <a className="scroll-cue" href="#about"><span>Scroll to explore</span><ArrowDown /></a>
    </section>
  );
}

function SectionHeading({ label, title, light = false, aside }: { label: string; title: React.ReactNode; light?: boolean; aside?: React.ReactNode }) {
  return <div className={`section-heading ${light ? "light" : ""}`}><div><p className="eyebrow">{label}</p><h2>{title}</h2></div>{aside && <div className="heading-aside">{aside}</div>}</div>;
}

function Stats() {
  return <section className="stats"><Reveal><span><Users /></span><strong>120</strong><p>Delegates</p></Reveal><Reveal delay={.08}><span><ShieldCheck /></span><strong>60+</strong><p>Student Volunteers</p></Reveal><Reveal delay={.16}><span><CalendarDays /></span><strong>3</strong><p>Conference Days</p></Reveal></section>;
}

function CommitteeStrip({ limit }: { limit?: number }) {
  const visible = limit ? committees.slice(0, limit) : committees;
  return <div className="committee-strip">{visible.map((committee, index) => <Reveal key={committee.abbreviation} className="committee-panel" delay={index * .06}><Link to={`/committees#${committee.abbreviation.toLowerCase()}`}><img src={committee.image} alt={`RijnMUN delegates representing ${committee.shortName}`} /><div className="panel-shade" /><div className="committee-panel-content"><span className="mono">Committee / {String(index + 1).padStart(2, "0")}</span><h3>{committee.abbreviation}</h3><p>{committee.shortName}</p><div className="committee-codes">{committee.issues.map(issue => <span key={issue.code}>{issue.code}</span>)}</div><ArrowRight /></div></Link></Reveal>)}</div>;
}

function Journey() {
  const content = useSiteContent();
  return <section className="journey"><SectionHeading label="The delegate journey" title={content.home.journeyHeading} aside={<p>Seven steps turn a first registration into three days of diplomacy, debate and new perspective.</p>} /><div className="journey-line">{journey.map((step, index) => <Reveal key={step} className="journey-step" delay={index * .05}><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b></Reveal>)}</div></section>;
}

function NewsGrid() {
  return <div className="news-grid">{news.map((article, index) => <Reveal key={article.title} className={`news-item ${index === 0 ? "featured" : ""}`} delay={index * .06}><Link to={article.href}><div className="news-image"><img src={article.image} alt="" /></div><p className="mono">{article.category} / {article.date}</p><h3>{article.title}</h3><p>{article.description}</p><span className="text-link">Read more <ArrowRight size={16} /></span></Link></Reveal>)}</div>;
}

function Home() {
  const content = useSiteContent();
  return <><Hero /><Countdown />{content.announcement.enabled && <Announcement />}<main><section id="about" className="about-home"><Reveal className="about-photo"><img src="/images/rijnmun-photo1.webp" alt="Two RijnMUN delegates preparing their committee work" /><blockquote>“Ideas.<br />Dialogue.<br />Action.”</blockquote></Reveal><Reveal className="about-copy"><p className="eyebrow">{content.home.aboutLabel}</p><h2>{content.home.aboutHeading}</h2><p>{content.home.aboutBodyOne}</p><p>{content.home.aboutBodyTwo}</p><ArrowLink to="/rijnmun-2026">Discover RijnMUN</ArrowLink></Reveal></section><Stats /><section className="committees-home"><SectionHeading light label="Committees" title={content.home.committeesHeading} aside={<ArrowLink to="/committees" className="text-link light">Explore all committees</ArrowLink>} /><CommitteeStrip /></section><Journey /><section className="news-home"><SectionHeading label="Latest news" title={content.home.newsHeading} aside={<ArrowLink to="/news">View all updates</ArrowLink>} /><NewsGrid /></section><SocialSection /><CtaBand /></main></>;
}

function Announcement() { const { announcement } = useSiteContent(); return <section className="announcement"><div><p className="eyebrow">{announcement.label}</p><h2>{announcement.title}</h2><p>{announcement.body}</p></div>{announcement.link && <ArrowLink to={announcement.link}>{announcement.linkLabel || "Learn more"}</ArrowLink>}</section>; }

function SocialSection() { const { social } = useSiteContent(); return <section className="social-section"><div><p className="eyebrow light">Follow RijnMUN</p><h2>Conference life, as it happens.</h2><p>Meet the community and follow announcements from the Secretariat.</p></div><div><a href={social.instagram} target="_blank" rel="noreferrer"><img src="/images/instagram-black.webp" alt="" /><span><small>Instagram</small><b>@rijn.mun</b></span><ExternalLink /></a><a href={social.tiktok} target="_blank" rel="noreferrer"><img src="/images/tiktok-black.webp" alt="" /><span><small>TikTok</small><b>@rijn_mun</b></span><ExternalLink /></a></div></section>; }

function CtaBand() { const content = useSiteContent(); return <section className="cta-band"><img src="/images/leiden-korenbeursbrug.webp" alt="Leiden city centre" /><div><p className="eyebrow light">RijnMUN 2026 · Oegstgeest</p><h2>{content.home.ctaHeading}</h2><p>{content.conference.dateLabel}</p></div><Link className="button button-primary" to="/registration">Register now <ArrowRight /></Link></section>; }

const pageMeta: Record<string, [string, string]> = {
  "/rijnmun-2026": ["General Information | RijnMUN 2026", "Learn about RijnMUN, a beginner-friendly Model United Nations conference in Oegstgeest."],
  "/committees": ["Committees & Issues | RijnMUN 2026", "Explore the RijnMUN 2026 committees, issues and research reports."],
  "/programme": ["Programme | RijnMUN 2026", "View the three-day RijnMUN 2026 conference programme."],
  "/board": ["Board of Directors | RijnMUN 2026", "Meet the student leadership behind RijnMUN 2026."],
  "/speakers": ["Guest Speakers & Advisors | RijnMUN 2026", "Guest speakers and advisors for RijnMUN 2026."],
  "/venue": ["Venue & Leiden | RijnMUN 2026", "Plan your visit to Rijnlands Lyceum Oegstgeest and Leiden."],
  "/registration": ["Registration | RijnMUN 2026", "Register a school delegation, individual delegate or student officer for RijnMUN 2026."],
  "/resources": ["Delegate Resources | RijnMUN 2026", "Download the RijnMUN delegate handbook, templates and preparation resources."],
  "/contact": ["Contact | RijnMUN 2026", "Contact the RijnMUN Secretariat in Oegstgeest."],
  "/archive": ["Photo Archive | RijnMUN", "Explore photographs from every edition of the RijnMUN conference."],
  "/webdashadmin": ["RijnMUN Webdash", "Secure Secretariat website management."],
};

function PageHero({ eyebrow, title, intro, image = "/images/rijnmun-photo3.webp" }: { eyebrow: string; title: string; intro: string; image?: string }) {
  return <section className="page-hero"><img src={image} alt="" /><div className="page-hero-shade" /><div><p className="eyebrow light">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></div></section>;
}

function GeneralInformation() {
  return <><PageHero eyebrow="RijnMUN 2026" title="A first step into diplomacy." intro="A three-day, beginner-friendly Model United Nations conference organised by students." /><main className="page-main"><section className="editorial-split"><SectionHeading label="What is MUN?" title="Represent a country. Debate the world." /><div className="prose"><p>Model United Nations is an educational simulation where students take on the role of a country’s representative and debate current global issues. Delegates research their country’s position, negotiate with others and work towards shared resolutions.</p><p>Debates are moderated by experienced student officers selected by the RijnMUN Board of Directors. Participants build public speaking, critical thinking and international-awareness skills in a formal but welcoming setting.</p></div></section><section className="feature-photo"><img src="/images/rijnmun-photo2.webp" alt="A committee session in progress at RijnMUN" /></section><section className="editorial-split pale"><SectionHeading label="Designed for beginners" title="Serious debate. Supported participation." /><div className="prose"><p>RijnMUN is hosted by students of Het Rijnlands Lyceum Oegstgeest and aimed at high-school delegates aged 14–18. Workshops and clear guidance help newcomers understand THIMUN procedure and take part with confidence.</p><div className="notice"><ShieldCheck /><p><b>Please note</b><br />RijnMUN does not provide accommodation. Delegates should bring a device, charger, pen, paper and lunch for Friday.</p></div><ArrowLink to="/resources">Prepare with delegate resources</ArrowLink></div></section><Journey /><CtaBand /></main></>;
}

function CommitteesPage() {
  const [active, setActive] = useState(0);
  const committee = committees[active];
  return <><PageHero eyebrow="RijnMUN 2026" title="Committees & issues." intro="Convergence: where perspectives unite for global progress." image="/images/rijnmun-photo2.webp" /><main className="page-main"><section className="committee-explorer"><div className="committee-index" role="tablist" aria-label="Select a committee">{committees.map((item, index) => <button id={item.abbreviation.toLowerCase()} key={item.abbreviation} role="tab" aria-selected={active === index} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.abbreviation}</b><small>{item.shortName}</small><ArrowRight /></button>)}</div><AnimatePresence mode="wait"><motion.article key={committee.abbreviation} className="committee-detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .35 }}><img src={committee.image} alt={`Delegates in a RijnMUN ${committee.name} session`} /><div><p className="eyebrow">Committee / {committee.abbreviation}</p><h2>{committee.name}</h2><p className="chairs">Chairs to be announced.</p>{committee.issues.map(issue => <div className="issue" key={issue.code}><span className="mono">Issue / {issue.code}</span><h3>{issue.title}</h3>{issue.report ? <a href={issue.report}>Open research report</a> : <span className="muted">Research report to be announced</span>}</div>)}</div></motion.article></AnimatePresence></section><section className="all-mobile-committees">{committees.map(c => <article key={c.abbreviation}><p className="eyebrow">{c.abbreviation}</p><h2>{c.name}</h2><p>Chairs to be announced.</p>{c.issues.map(i => <div className="issue" key={i.code}><span className="mono">Issue / {i.code}</span><h3>{i.title}</h3><span className="muted">Research report to be announced</span></div>)}</article>)}</section><section className="resources-callout"><div><p className="eyebrow">Delegate preparation</p><h2>Start with the issue. Arrive with a position.</h2></div><ArrowLink to="/resources">Open delegate resources</ArrowLink></section></main></>;
}

function ProgrammePage() {
  return <><PageHero eyebrow="20–22 November 2026" title="Programme of events." intro="Three days of workshops, committee sessions, debate and ceremony." image="/images/rijnmun-photo3.webp" /><main className="page-main"><section className="programme"><p className="programme-note"><Clock3 /> The detailed 2026 timetable has not yet been released. This page will update from the central programme data once timings are confirmed.</p>{programme.map((day, dayIndex) => <Reveal className="programme-day" key={day.day}><div className="day-title"><span>{day.day}</span><h2>{day.date}</h2></div><div className="events">{day.events.map((event, index) => <article key={index}><time>{event.time}</time><div><h3>{event.title}</h3><p>{event.note}</p></div></article>)}</div></Reveal>)}</section><CtaBand /></main></>;
}

function PeoplePage({ kind }: { kind: "board" | "speakers" }) {
  const isBoard = kind === "board";
  const people = isBoard ? board : speakers;
  return <><PageHero eyebrow="RijnMUN 2026" title={isBoard ? "Board of Directors." : "Guest speakers & advisors."} intro={isBoard ? "The student leadership organising RijnMUN 2026." : "Perspectives from diplomacy, education and international affairs."} image="/images/rijnmun-photo1.webp" /><main className="page-main"><section className="empty-state">{people.length === 0 ? <><div className="empty-mark">RM</div><p className="eyebrow">Announcement pending</p><h2>{isBoard ? "Board profiles will be announced soon." : "Guest speakers and advisors will be announced soon."}</h2><p>The layout is ready to display portraits and roles as soon as the Secretariat publishes them.</p><ArrowLink to="/contact">Contact the Secretariat</ArrowLink></> : null}</section></main></>;
}

function VenuePage() {
  const content = useSiteContent();
  return <><PageHero eyebrow="Venue & Leiden" title="Meet in Oegstgeest." intro="RijnMUN takes place at Het Rijnlands Lyceum Oegstgeest, close to the historic city of Leiden." image="/images/rlo_front.webp" /><main className="page-main"><section className="venue-address"><div><p className="eyebrow">Conference venue</p><h2>{content.conference.location}</h2><p>{content.conference.address}</p><a className="button button-primary" target="_blank" rel="noreferrer" href="https://maps.app.goo.gl/c1nDmYniANtAFs1x7">Open in Maps <ExternalLink /></a></div><img src="/images/rlo_front.webp" alt="Entrance of Het Rijnlands Lyceum Oegstgeest" /></section><section className="travel-grid"><article><span className="mono">Arrival / Car</span><h3>By car</h3><p>RLO is near Exit 7 Oegstgeest–Rijnsburg on the A44. Parking around the school is limited.</p></article><article><span className="mono">Arrival / Public transport</span><h3>By public transport</h3><p>The venue is about a ten-minute walk from the Leidsebuurt bus stop. From Leiden Centraal, the current site recommends buses 20, 21 or 57. Check live travel information before departure.</p><a href="https://9292.nl" target="_blank" rel="noreferrer">Plan with 9292 <ExternalLink size={16} /></a></article></section><section className="leiden"><img src="/images/leiden-uni-academiegebouw.webp" alt="Leiden University Academiegebouw" /><div><p className="eyebrow">About Leiden</p><h2>A city shaped by knowledge.</h2><p>Leiden is known for its historic centre and academic life. Leiden University, founded in 1575, is the oldest university in the Netherlands. International visitors can explore courtyards, city gates, gardens and windmills around the city.</p><a className="text-link" href="https://www.visitleiden.nl" target="_blank" rel="noreferrer">Explore Leiden <ExternalLink size={16} /></a></div></section></main></>;
}

function RegistrationPage() {
  const content = useSiteContent();
  return <><PageHero eyebrow={`Registration / ${conference.registrationStatus}`} title="Choose how you’ll take part." intro="Clear routes for school delegations, individual delegates, student officers and RLO students." image="/images/rijnmun-photo4.webp" /><main className="page-main"><section className="fee-band"><div><span>Delegate</span><strong>€{conference.fees.delegate}</strong></div><div><span>Student officer</span><strong>€{conference.fees.officer}</strong></div><div><span>Directors / visitors</span><strong>€{conference.fees.director}</strong></div><p>Fees include a badge and lunch on two conference days. No accommodation is provided.</p></section><section className="registration-list">{registrations.map((item, index) => { const link = content.forms[item.key as keyof typeof content.forms]; const isOpen = Boolean(link); return <Reveal key={item.key} className="registration-row" delay={index * .04}><span className="row-number">{String(index + 1).padStart(2, "0")}</span><div><span className={`status status-${isOpen ? "open" : "opening-soon"}`}><i />{isOpen ? "OPEN" : "OPENING SOON"}</span><h2>{item.title}</h2><p>{item.audience}</p></div><div className="registration-meta"><p>{item.fee}</p><p>{item.deadline}</p></div>{isOpen ? <a className="button button-primary" href={link} target="_blank" rel="noreferrer">Open form <ExternalLink /></a> : <a className="button button-primary" href={`mailto:${content.conference.email}?subject=${encodeURIComponent(`${item.title} registration`)}`}>Contact Secretariat <MailIcon /></a>}</Reveal>; })}</section><section className="registration-notes"><h2>Before you register</h2><ul><li><Check />RijnMUN welcomes students aged 14–18 and is designed with beginners in mind.</li><li><Check />Housing is not provided for delegates, staff or visitors.</li><li><Check />Guests with a gluten allergy are asked by the current conference guidance to bring their own lunch.</li></ul></section></main></>;
}

function ResourcesPage() {
  return <><PageHero eyebrow="Delegate resources" title="Arrive ready to debate." intro="Practical documents for research, writing resolutions and taking part in committee." /><main className="page-main"><section className="resource-list">{resources.map((resource, index) => <Reveal className="resource-row" key={resource.title} delay={index * .04}><FileText /><span className="mono">{String(index + 1).padStart(2, "0")} / {resource.type}</span><div><h2>{resource.title}</h2><p>{resource.description}</p></div><a href={resource.href} target={resource.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" aria-label={`Open ${resource.title}`}>{resource.href.endsWith("pdf") ? <Download /> : <ArrowRight />}</a></Reveal>)}</section></main></>;
}

function NewsPage() { return <><PageHero eyebrow="Latest news" title="From the Secretariat." intro="Committee announcements, registration updates and the RijnMUN archive." image="/images/rijnmun-photo2.webp" /><main className="page-main news-page"><NewsGrid /></main></>; }

function ContactPage() {
  const content = useSiteContent();
  return <><PageHero eyebrow="Contact" title="Talk to the Secretariat." intro="Questions about registration, committees or conference logistics are welcome." image="/images/rlo_front.webp" /><main className="page-main"><section className="contact-layout"><div><p className="eyebrow">Email</p><a className="contact-email" href={`mailto:${content.conference.email}`}>{content.conference.email}</a><p>For questions, concerns, registration amendments or general feedback.</p><div className="contact-social"><a href={content.social.instagram} target="_blank" rel="noreferrer"><img src="/images/instagram-black.webp" alt="" /> Instagram</a><a href={content.social.tiktok} target="_blank" rel="noreferrer"><img src="/images/tiktok-black.webp" alt="" /> TikTok</a></div></div><address><MapPin /><div><b>RijnMUN</b><br />{content.conference.location}<br />{content.conference.address}</div></address></section></main></>;
}

function MetaAndScroll() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const [title, description] = pageMeta[location.pathname] || ["RijnMUN 2026 | Model United Nations Oegstgeest", "RijnMUN is a beginner-friendly Model United Nations conference at Rijnlands Lyceum Oegstgeest."];
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
  }, [location.pathname]);
  return null;
}

function getVisualPath(element: Element) {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.tagName.toLowerCase() !== "body") {
    const tag = current.tagName.toLowerCase();
    const siblings = current.parentElement ? [...current.parentElement.children].filter((child) => child.tagName === current?.tagName) : [];
    parts.unshift(`${tag}:nth-of-type(${Math.max(1, siblings.indexOf(current) + 1)})`);
    current = current.parentElement;
  }
  return parts.join(">");
}

function VisualEditingBridge() {
  const location = useLocation();
  const content = useSiteContent();
  const preview = window.self !== window.top;
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!preview) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "rijnmun-editor-mode") setEditMode(event.data.mode === "edit");
      if (event.data?.type === "rijnmun-editor-selected") {
        document.querySelectorAll(".visual-selected").forEach((node) => node.classList.remove("visual-selected"));
        if (event.data.key) document.querySelector(`[data-visual-key="${CSS.escape(event.data.key)}"]`)?.classList.add("visual-selected");
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "rijnmun-preview-route", path: location.pathname }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [location.pathname, preview]);

  useEffect(() => {
    document.body.classList.toggle("visual-edit-mode", preview && editMode);
    const candidates = "h1,h2,h3,h4,p,li,a,button,span,b,strong,small,time,blockquote,address,figcaption,img";
    const scan = () => {
      document.querySelectorAll(candidates).forEach((node) => {
        const element = node as HTMLElement;
        const isImage = element instanceof HTMLImageElement;
        if (!isImage && element.children.length > 0) return;
        if (!isImage && !element.textContent?.trim()) return;
        const key = `${location.pathname}::${getVisualPath(element)}`;
        const override = content.visual[key];
        if (override?.type === "image" && isImage) {
          if (element.getAttribute("src") !== override.value) element.setAttribute("src", override.value);
          if (override.alt !== undefined) element.setAttribute("alt", override.alt);
        }
        if (override?.type === "text" && !isImage && element.textContent !== override.value) element.textContent = override.value;
        if (preview) element.dataset.visualKey = key;
      });
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    const onClick = (event: MouseEvent) => {
      if (!preview || !editMode) return;
      const target = (event.target as Element).closest<HTMLElement>("[data-visual-key]");
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      const image = target instanceof HTMLImageElement;
      window.parent.postMessage({ type: "rijnmun-preview-select", key: target.dataset.visualKey, fieldType: image ? "image" : "text", value: image ? target.getAttribute("src") : target.textContent, alt: image ? target.getAttribute("alt") : undefined, tag: target.tagName.toLowerCase(), path: location.pathname }, window.location.origin);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.body.classList.remove("visual-edit-mode");
    };
  }, [content.visual, editMode, location.pathname, preview]);
  return null;
}

function SiteRoutes() {
  const location = useLocation();
  if (location.pathname.startsWith("/webdashadmin")) return <><MetaAndScroll /><Routes><Route path="/webdashadmin" element={<AdminPage />} /><Route path="*" element={<Navigate to="/webdashadmin" replace />} /></Routes></>;
  return <><MetaAndScroll /><Header /><AnimatePresence mode="wait"><motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}><Routes location={location}><Route path="/" element={<Home />} /><Route path="/rijnmun-2026" element={<GeneralInformation />} /><Route path="/committees" element={<CommitteesPage />} /><Route path="/programme" element={<ProgrammePage />} /><Route path="/board" element={<PeoplePage kind="board" />} /><Route path="/speakers" element={<PeoplePage kind="speakers" />} /><Route path="/venue" element={<VenuePage />} /><Route path="/registration" element={<RegistrationPage />} /><Route path="/resources" element={<ResourcesPage />} /><Route path="/news" element={<NewsPage />} /><Route path="/archive" element={<ArchivePage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/rijnmun-2026/general-information" element={<Navigate to="/rijnmun-2026" replace />} /><Route path="/rijnmun-2026/committees-and-issues" element={<Navigate to="/committees" replace />} /><Route path="/rijnmun-2026/programme-of-events" element={<Navigate to="/programme" replace />} /><Route path="/rijnmun-2026/board-of-directors" element={<Navigate to="/board" replace />} /><Route path="/rijnmun-2026/speakers-and-advisors" element={<Navigate to="/speakers" replace />} /><Route path="/rijnmun-2026/venue" element={<Navigate to="/venue" replace />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes><Footer /></motion.div></AnimatePresence></>;
}

export function App() { return <BrowserRouter><SiteContentProvider><SiteRoutes /></SiteContentProvider></BrowserRouter>; }
