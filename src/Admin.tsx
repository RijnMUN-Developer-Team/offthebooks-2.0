import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, CheckCircle2, ExternalLink, Eye, EyeOff, FileText, Image as ImageIcon, Images, LayoutDashboard, Link2, Loader2,
  LogOut, Monitor, MousePointer2, Navigation, Plus, RotateCcw, Save, Share2, Smartphone, Trash2, Upload,
} from "lucide-react";
import { defaultSiteContent, mergeSiteContent, ProgrammeDay, ProgrammeEvent, SiteContent } from "./site-content";

type AlbumPhoto = { id: string; src: string; alt: string; caption: string };
type Album = { id: string; title: string; year: string; description: string; published: boolean; photos: AlbumPhoto[] };
type Tab = "overview" | "content" | "timetable" | "forms" | "albums" | "social";
type VisualSelection = { key: string; fieldType: "text" | "image"; value: string; alt?: string; tag: string; path: string };

const previewPages = [
  ["Homepage", "/"], ["General information", "/rijnmun-2026"], ["Committees", "/committees"],
  ["Programme", "/programme"], ["Board", "/board"], ["Speakers", "/speakers"], ["Venue", "/venue"],
  ["Registration", "/registration"], ["Resources", "/resources"], ["News", "/news"], ["Photo archive", "/archive"], ["Contact", "/contact"],
] as const;

const fields: Array<{ section: keyof SiteContent; key: string; label: string; multiline?: boolean }> = [
  { section: "conference", key: "dateLabel", label: "Conference dates" },
  { section: "conference", key: "location", label: "Venue name" },
  { section: "conference", key: "address", label: "Address" },
  { section: "conference", key: "email", label: "Public email" },
  { section: "home", key: "heroEyebrow", label: "Hero eyebrow" },
  { section: "home", key: "heroSubtitle", label: "Hero subtitle", multiline: true },
  { section: "home", key: "aboutLabel", label: "About label" },
  { section: "home", key: "aboutHeading", label: "About heading" },
  { section: "home", key: "aboutBodyOne", label: "About paragraph 1", multiline: true },
  { section: "home", key: "aboutBodyTwo", label: "About paragraph 2", multiline: true },
  { section: "home", key: "committeesHeading", label: "Committees heading", multiline: true },
  { section: "home", key: "journeyHeading", label: "Journey heading" },
  { section: "home", key: "newsHeading", label: "News heading" },
  { section: "home", key: "ctaHeading", label: "Closing CTA heading" },
  { section: "announcement", key: "label", label: "Announcement label" },
  { section: "announcement", key: "title", label: "Announcement title" },
  { section: "announcement", key: "body", label: "Announcement text", multiline: true },
  { section: "announcement", key: "linkLabel", label: "Announcement link label" },
  { section: "announcement", key: "link", label: "Announcement link" },
];

function api(path: string, init?: RequestInit) {
  return fetch(path, { credentials: "same-origin", ...init, headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers } });
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [savedContent, setSavedContent] = useState<SiteContent>(defaultSiteContent);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [contentResponse, albumResponse] = await Promise.all([api("/api/admin/content"), api("/api/admin/albums")]);
    if (contentResponse.status === 401 || albumResponse.status === 401) { setAuthenticated(false); return; }
    const rawContent = await contentResponse.json();
    const nextContent = mergeSiteContent(rawContent);
    setContent(nextContent); setSavedContent(nextContent); setAlbums(await albumResponse.json()); setAuthenticated(true);
  };
  useEffect(() => { api("/api/admin/session").then((response) => response.ok ? load() : setAuthenticated(false)).catch(() => setAuthenticated(false)); }, []);

  if (authenticated === null) return <div className="admin-loading"><Loader2 className="spin" /><span>Opening Webdash</span></div>;
  if (!authenticated) return <Login onSuccess={load} />;

  const save = async () => {
    setMessage("Saving…");
    const response = await api("/api/admin/content", { method: "PUT", body: JSON.stringify(content) });
    if (!response.ok) { setMessage("Could not save changes."); return; }
    setSavedContent(content); setMessage("Changes published to the website.");
    new BroadcastChannel("rijnmun-content").postMessage({ type: "saved" });
    window.setTimeout(() => setMessage(""), 3500);
  };
  const logout = async () => { await api("/api/admin/logout", { method: "POST" }); setAuthenticated(false); };
  const dirty = JSON.stringify(content) !== JSON.stringify(savedContent);

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><img src="/images/logo.webp" alt="" /><div><b>RIJNMUN</b><span>WEBDASH</span></div></div>
      <nav aria-label="Admin sections">
        <AdminNav current={tab} value="overview" icon={<LayoutDashboard />} label="Overview" setTab={setTab} />
        <AdminNav current={tab} value="content" icon={<FileText />} label="Visual content" setTab={setTab} />
        <AdminNav current={tab} value="timetable" icon={<CalendarDays />} label="Timetable" setTab={setTab} />
        <AdminNav current={tab} value="forms" icon={<Link2 />} label="Registration forms" setTab={setTab} />
        <AdminNav current={tab} value="albums" icon={<Images />} label="Photo albums" setTab={setTab} />
        <AdminNav current={tab} value="social" icon={<Share2 />} label="Social media" setTab={setTab} />
      </nav>
      <a href="/" target="_blank" rel="noreferrer"><Eye />View website</a>
      <button onClick={logout}><LogOut />Sign out</button>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><span>RijnMUN 2026</span><b>Secretariat workspace</b></div><div className="admin-save-state">{dirty ? "Unsaved changes" : "All changes saved"}<i className={dirty ? "dirty" : ""} /></div></header>
      {message && <div className="admin-toast"><CheckCircle2 />{message}</div>}
      {tab === "overview" && <Overview content={content} albums={albums} go={setTab} />}
      {tab === "content" && <WholeSiteVisualEditor content={content} setContent={setContent} save={save} dirty={dirty} />}
      {tab === "timetable" && <TimetableEditor content={content} setContent={setContent} save={save} dirty={dirty} />}
      {tab === "forms" && <FormsEditor content={content} setContent={setContent} save={save} dirty={dirty} />}
      {tab === "albums" && <AlbumsEditor albums={albums} reload={load} />}
      {tab === "social" && <SocialEditor content={content} setContent={setContent} save={save} dirty={dirty} />}
    </main>
  </div>;
}

function Login({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [show, setShow] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); setError(""); try { const response = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }); if (!response.ok) { const body = await response.json(); setError(body.error || "Unable to sign in"); } else await onSuccess(); } catch { setError("The admin server is not available. Start the site with npm start."); } finally { setLoading(false); } };
  return <main className="login-page"><section className="login-visual"><img src="/images/rijnmun-photo3.webp" alt="RijnMUN committee in session" /><div><img src="/images/logo.webp" alt="RijnMUN" /><p>Secretariat workspace</p><h1>Manage the conference. Keep delegates informed.</h1></div></section><section className="login-panel"><form onSubmit={submit}><p className="admin-kicker">RijnMUN Webdash</p><h2>Welcome back.</h2><p>Sign in to update the public website and conference archive.</p><label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label>Password<div className="password-field"><input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff /> : <Eye />}</button></div></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="admin-primary" disabled={loading}>{loading ? <Loader2 className="spin" /> : null}{loading ? "Signing in…" : "Sign in"}</button><a href="/">← Return to RijnMUN</a></form></section></main>;
}

function AdminNav({ current, value, icon, label, setTab }: { current: Tab; value: Tab; icon: React.ReactNode; label: string; setTab: (tab: Tab) => void }) { return <button className={current === value ? "active" : ""} onClick={() => setTab(value)}>{icon}<span>{label}</span></button>; }

function Overview({ content, albums, go }: { content: SiteContent; albums: Album[]; go: (tab: Tab) => void }) {
  const photoCount = albums.reduce((sum, album) => sum + album.photos.length, 0);
  const eventCount = content.programme.days.reduce((sum, day) => sum + day.events.length, 0);
  return <section className="admin-page"><div className="admin-page-heading"><p className="admin-kicker">Overview</p><h1>Good afternoon, Secretariat.</h1><p>Everything that changes often is managed from this workspace.</p></div><div className="admin-metrics"><article><span>Conference</span><strong>{content.conference.dateLabel}</strong><small>Public website</small></article><article><span>Photo archive</span><strong>{albums.length} albums</strong><small>{photoCount} published photos</small></article><article><span>Timetable</span><strong>{eventCount} events</strong><small>{content.programme.days.length} conference days</small></article></div><div className="admin-quick"><h2>Quick actions</h2><div><button onClick={() => go("content")}><FileText /><span><b>Edit website content</b><small>Open the live visual editor</small></span></button><button onClick={() => go("timetable")}><CalendarDays /><span><b>Update timetable</b><small>Edit days, times and sessions</small></span></button><button onClick={() => go("albums")}><Upload /><span><b>Upload conference photos</b><small>Add to an existing album</small></span></button><button onClick={() => go("forms")}><Link2 /><span><b>Update form links</b><small>Registration destinations</small></span></button></div></div></section>;
}

function setNested(content: SiteContent, section: keyof SiteContent, key: string, value: string | boolean): SiteContent {
  return { ...content, [section]: { ...content[section], [key]: value } } as SiteContent;
}

function SaveBar({ save, dirty }: { save: () => void; dirty: boolean }) { return <div className="editor-save"><span>{dirty ? "You have unpublished changes." : "The website is up to date."}</span><button className="admin-primary" onClick={save} disabled={!dirty}><Save />Save & publish</button></div>; }

function TimetableEditor({ content, setContent, save, dirty }: { content: SiteContent; setContent: (value: SiteContent) => void; save: () => void; dirty: boolean }) {
  const setProgramme = (programme: SiteContent["programme"]) => setContent({ ...content, programme });
  const updateDay = (dayIndex: number, patch: Partial<ProgrammeDay>) => setProgramme({ ...content.programme, days: content.programme.days.map((day, index) => index === dayIndex ? { ...day, ...patch } : day) });
  const updateEvent = (dayIndex: number, eventIndex: number, patch: Partial<ProgrammeEvent>) => {
    const day = content.programme.days[dayIndex];
    updateDay(dayIndex, { events: day.events.map((event, index) => index === eventIndex ? { ...event, ...patch } : event) });
  };
  const addDay = () => setProgramme({ ...content.programme, days: [...content.programme.days, { id: crypto.randomUUID(), label: `DAY ${String(content.programme.days.length + 1).padStart(2, "0")}`, date: "Conference day", events: [] }] });
  const removeDay = (dayIndex: number) => setProgramme({ ...content.programme, days: content.programme.days.filter((_, index) => index !== dayIndex) });
  const addEvent = (dayIndex: number) => updateDay(dayIndex, { events: [...content.programme.days[dayIndex].events, { id: crypto.randomUUID(), time: "TBA", title: "New timetable item", note: "" }] });
  const removeEvent = (dayIndex: number, eventIndex: number) => updateDay(dayIndex, { events: content.programme.days[dayIndex].events.filter((_, index) => index !== eventIndex) });

  return <section className="admin-page timetable-editor"><div className="admin-page-heading heading-action"><div><p className="admin-kicker">Conference timetable</p><h1>Plan every conference day.</h1><p>Edit the notice, dates, times and session descriptions shown on the public Programme page.</p></div><a className="admin-secondary-link" href="/programme" target="_blank" rel="noreferrer"><ExternalLink />View programme</a></div><label className="timetable-notice"><span><b>Programme notice</b><small>Leave blank to hide the notice above the timetable.</small></span><textarea rows={3} value={content.programme.notice} onChange={(event) => setProgramme({ ...content.programme, notice: event.target.value })} /></label><div className="timetable-days">{content.programme.days.map((day, dayIndex) => <article className="timetable-day-card" key={day.id}><header><div><span>Conference day {dayIndex + 1}</span><h2>{day.date || "Untitled day"}</h2></div><button className="icon-danger" type="button" onClick={() => removeDay(dayIndex)} aria-label={`Remove ${day.date || `day ${dayIndex + 1}`}`}><Trash2 /></button></header><div className="day-fields"><label>Day label<input value={day.label} onChange={(event) => updateDay(dayIndex, { label: event.target.value })} /></label><label>Date heading<input value={day.date} onChange={(event) => updateDay(dayIndex, { date: event.target.value })} /></label></div><div className="timetable-events">{day.events.map((event, eventIndex) => <div className="timetable-event" key={event.id}><label>Time<input placeholder="09:00" value={event.time} onChange={(change) => updateEvent(dayIndex, eventIndex, { time: change.target.value })} /></label><label>Session title<input value={event.title} onChange={(change) => updateEvent(dayIndex, eventIndex, { title: change.target.value })} /></label><label className="event-note">Notes<textarea rows={2} value={event.note} onChange={(change) => updateEvent(dayIndex, eventIndex, { note: change.target.value })} /></label><button className="icon-danger event-remove" type="button" onClick={() => removeEvent(dayIndex, eventIndex)} aria-label={`Remove ${event.title}`}><Trash2 /></button></div>)}</div><button className="add-row-button" type="button" onClick={() => addEvent(dayIndex)}><Plus />Add timetable item</button></article>)}</div><button className="add-day-button" type="button" onClick={addDay}><Plus />Add conference day</button><SaveBar save={save} dirty={dirty} /></section>;
}

function VisualEditor({ content, setContent, save, dirty }: { content: SiteContent; setContent: (value: SiteContent) => void; save: () => void; dirty: boolean }) {
  const iframe = useRef<HTMLIFrameElement>(null); const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  useEffect(() => { iframe.current?.contentWindow?.postMessage({ type: "rijnmun-preview", content }, window.location.origin); }, [content]);
  return <section className="admin-page editor-page"><div className="admin-page-heading"><p className="admin-kicker">Visual content editor</p><h1>Edit the website in context.</h1><p>Changes appear in the live preview immediately. They become public only after saving.</p></div><div className="visual-editor"><div className="field-panel"><label className="toggle-row"><input type="checkbox" checked={content.announcement.enabled} onChange={(event) => setContent(setNested(content, "announcement", "enabled", event.target.checked))} /><span><b>Show homepage announcement</b><small>Display the Secretariat announcement below the countdown.</small></span></label>{fields.map((field) => <label key={`${field.section}.${field.key}`}>{field.label}{field.multiline ? <textarea rows={4} value={String((content[field.section] as unknown as Record<string, unknown>)[field.key] ?? "")} onChange={(event) => setContent(setNested(content, field.section, field.key, event.target.value))} /> : <input value={String((content[field.section] as unknown as Record<string, unknown>)[field.key] ?? "")} onChange={(event) => setContent(setNested(content, field.section, field.key, event.target.value))} />}</label>)}</div><div className="preview-panel"><div className="preview-toolbar"><span>Live homepage preview</span><div><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Desktop preview"><Monitor /></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Mobile preview"><Smartphone /></button></div></div><div className={`preview-frame ${device}`}><iframe ref={iframe} title="Live website preview" src="/?preview=1" onLoad={() => iframe.current?.contentWindow?.postMessage({ type: "rijnmun-preview", content }, window.location.origin)} /></div></div></div><SaveBar save={save} dirty={dirty} /></section>;
}

function WholeSiteVisualEditor({ content, setContent, save, dirty }: { content: SiteContent; setContent: (value: SiteContent) => void; save: () => void; dirty: boolean }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [mode, setMode] = useState<"browse" | "edit">("edit");
  const [currentPath, setCurrentPath] = useState("/");
  const [selection, setSelection] = useState<VisualSelection | null>(null);
  const [uploading, setUploading] = useState(false);
  const previewStage = useRef<HTMLDivElement>(null);
  const [previewBounds, setPreviewBounds] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    if (!previewStage.current) return;
    const measure = () => {
      const bounds = previewStage.current?.getBoundingClientRect();
      if (bounds) setPreviewBounds({ width: bounds.width, height: bounds.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(previewStage.current);
    return () => observer.disconnect();
  }, []);

  const previewBaseWidth = device === "desktop" ? 1420 : 390;
  const previewInset = 24;
  const previewScale = Math.min(1, Math.max(.2, (previewBounds.width - previewInset) / previewBaseWidth));
  const previewVisibleHeight = Math.max(320, previewBounds.height - previewInset);

  const postToPreview = () => {
    iframe.current?.contentWindow?.postMessage({ type: "rijnmun-preview", content }, window.location.origin);
    iframe.current?.contentWindow?.postMessage({ type: "rijnmun-editor-mode", mode }, window.location.origin);
  };
  useEffect(postToPreview, [content, mode]);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "rijnmun-preview-route") {
        setCurrentPath(event.data.path || "/");
        iframe.current?.contentWindow?.postMessage({ type: "rijnmun-preview", content }, window.location.origin);
        iframe.current?.contentWindow?.postMessage({ type: "rijnmun-editor-mode", mode }, window.location.origin);
      }
      if (event.data?.type === "rijnmun-preview-select") {
        const next = event.data as VisualSelection & { type: string };
        setSelection({ key: next.key, fieldType: next.fieldType, value: next.value || "", alt: next.alt || "", tag: next.tag, path: next.path });
        iframe.current?.contentWindow?.postMessage({ type: "rijnmun-editor-selected", key: next.key }, window.location.origin);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [content, mode]);

  const openPage = (path: string) => {
    setCurrentPath(path); setSelection(null);
    if (iframe.current) iframe.current.src = `${path}?preview=1`;
  };
  const updateSelection = (value: string, alt = selection?.alt) => {
    if (!selection) return;
    const nextSelection = { ...selection, value, alt };
    setSelection(nextSelection);
    setContent({ ...content, visual: { ...content.visual, [selection.key]: { type: selection.fieldType, value, ...(selection.fieldType === "image" ? { alt } : {}) } } });
  };
  const resetSelection = () => {
    if (!selection) return;
    const visual = { ...content.visual }; delete visual[selection.key];
    setContent({ ...content, visual }); setSelection(null);
    window.setTimeout(() => iframe.current?.contentWindow?.location.reload(), 0);
  };
  const uploadImage = async (files: FileList | null) => {
    if (!selection || !files?.[0]) return;
    setUploading(true);
    const data = new FormData(); data.append("asset", files[0]);
    const response = await api("/api/admin/assets", { method: "POST", body: data });
    if (response.ok) { const result = await response.json(); updateSelection(result.src, selection.alt); }
    setUploading(false);
  };

  return <section className="admin-page editor-page whole-site-editor">
    <div className="admin-page-heading"><p className="admin-kicker">Whole-site visual editor</p><h1>Edit every page in context.</h1><p>Browse the website normally, switch to Select content, then click any highlighted text or image to edit it. Changes stay private until you publish.</p></div>
    <div className="whole-editor-layout">
      <aside className="visual-inspector">
        <div className="inspector-title"><MousePointer2 /><div><b>{selection ? `Edit ${selection.fieldType}` : "Select content"}</b><small>{selection ? `${selection.path} · ${selection.tag}` : "Click highlighted content in the preview"}</small></div></div>
        {selection ? <div className="selection-editor">
          {selection.fieldType === "text" ? <label>Text<textarea rows={8} value={selection.value} onChange={(event) => updateSelection(event.target.value)} /></label> : <><div className="selected-image"><img src={selection.value} alt="Selected website asset" /></div><label>Image URL<input value={selection.value} onChange={(event) => updateSelection(event.target.value)} /></label><label>Alternative text<input value={selection.alt || ""} onChange={(event) => updateSelection(selection.value, event.target.value)} /></label><label className="inspector-upload">{uploading ? <Loader2 className="spin" /> : <Upload />} {uploading ? "Uploading…" : "Upload replacement"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => uploadImage(event.target.files)} /></label></>}
          <button className="reset-override" onClick={resetSelection}><RotateCcw />Restore original</button>
        </div> : <div className="inspector-empty"><MousePointer2 /><p>Choose <b>Select content</b>, then click a text block or photograph on any page.</p><span>Use Browse mode whenever you want links and page controls to behave normally.</span></div>}
        <details className="global-settings"><summary>Global website settings</summary><label className="toggle-row"><input type="checkbox" checked={content.announcement.enabled} onChange={(event) => setContent(setNested(content, "announcement", "enabled", event.target.checked))} /><span><b>Show homepage announcement</b><small>Visible below the countdown</small></span></label>{fields.map((field) => <label key={`${field.section}.${field.key}`}>{field.label}{field.multiline ? <textarea rows={3} value={String((content[field.section] as unknown as Record<string, unknown>)[field.key] ?? "")} onChange={(event) => setContent(setNested(content, field.section, field.key, event.target.value))} /> : <input value={String((content[field.section] as unknown as Record<string, unknown>)[field.key] ?? "")} onChange={(event) => setContent(setNested(content, field.section, field.key, event.target.value))} />}</label>)}</details>
      </aside>
      <div className="preview-panel whole-preview">
        <div className="whole-preview-toolbar">
          <label><span>Page</span><select value={currentPath} onChange={(event) => openPage(event.target.value)}>{previewPages.map(([label, path]) => <option key={path} value={path}>{label}</option>)}</select></label>
          <div className="interaction-switch"><button className={mode === "browse" ? "active" : ""} onClick={() => setMode("browse")}><Navigation />Browse</button><button className={mode === "edit" ? "active" : ""} onClick={() => setMode("edit")}><MousePointer2 />Select content</button></div>
          <div className="device-switch"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Desktop preview"><Monitor /></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Mobile preview"><Smartphone /></button><a href={currentPath} target="_blank" rel="noreferrer" aria-label="Open page in a new tab"><ExternalLink /></a></div>
        </div>
        <div ref={previewStage} className={`preview-frame whole ${device}`}><div className="preview-canvas" style={{ width: previewBaseWidth * previewScale, height: previewVisibleHeight }}><iframe ref={iframe} title="Whole website live preview" src="/?preview=1" onLoad={postToPreview} style={{ width: previewBaseWidth, height: previewVisibleHeight / previewScale, transform: `scale(${previewScale})` }} /></div></div>
      </div>
    </div>
    <SaveBar save={save} dirty={dirty} />
  </section>;
}

function FormsEditor({ content, setContent, save, dirty }: { content: SiteContent; setContent: (value: SiteContent) => void; save: () => void; dirty: boolean }) {
  const formLabels: Record<keyof SiteContent["forms"], string> = { school: "School delegation form", individual: "Individual delegate form", officer: "Student officer form", rlo: "RLO student form" };
  return <section className="admin-page"><div className="admin-page-heading"><p className="admin-kicker">Registration forms</p><h1>Send every applicant to the right place.</h1><p>Leave a link empty to show an “opening soon” state on the public registration page.</p></div><div className="settings-sheet">{Object.entries(formLabels).map(([key, label]) => <label key={key}><span><b>{label}</b><small>Public registration destination</small></span><input type="url" placeholder="https://forms.gle/…" value={content.forms[key as keyof SiteContent["forms"]]} onChange={(event) => setContent(setNested(content, "forms", key, event.target.value))} /></label>)}</div><SaveBar save={save} dirty={dirty} /></section>;
}

function SocialEditor({ content, setContent, save, dirty }: { content: SiteContent; setContent: (value: SiteContent) => void; save: () => void; dirty: boolean }) {
  return <section className="admin-page"><div className="admin-page-heading"><p className="admin-kicker">Social media</p><h1>Keep the community connected.</h1><p>These destinations power the homepage social section, footer and contact page.</p></div><div className="settings-sheet"><label><span><b>Instagram</b><small>@rijn.mun</small></span><input type="url" value={content.social.instagram} onChange={(event) => setContent(setNested(content, "social", "instagram", event.target.value))} /></label><label><span><b>TikTok</b><small>@rijn_mun</small></span><input type="url" value={content.social.tiktok} onChange={(event) => setContent(setNested(content, "social", "tiktok", event.target.value))} /></label></div><SaveBar save={save} dirty={dirty} /></section>;
}

function AlbumsEditor({ albums, reload }: { albums: Album[]; reload: () => Promise<void> }) {
  const [creating, setCreating] = useState(false); const [uploading, setUploading] = useState("");
  const create = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const response = await api("/api/admin/albums", { method: "POST", body: JSON.stringify({ title: data.get("title"), year: data.get("year"), description: data.get("description") }) }); if (response.ok) { setCreating(false); await reload(); } };
  const uploadPhotos = async (albumId: string, files: FileList | null) => { if (!files?.length) return; setUploading(albumId); const data = new FormData(); [...files].forEach((file) => data.append("photos", file)); await api(`/api/admin/albums/${albumId}/photos`, { method: "POST", body: data }); setUploading(""); await reload(); };
  return <section className="admin-page"><div className="admin-page-heading heading-action"><div><p className="admin-kicker">Photo archive</p><h1>Conference albums.</h1><p>Create an edition and publish its photographs to the public archive.</p></div><button className="admin-primary" onClick={() => setCreating(!creating)}><Plus />New album</button></div>{creating && <form className="new-album" onSubmit={create}><label>Album title<input name="title" placeholder="RijnMUN 2026" required /></label><label>Conference year<input name="year" inputMode="numeric" pattern="[0-9]{4}" placeholder="2026" required /></label><label className="wide">Description<textarea name="description" rows={3} placeholder="A short introduction to this edition." /></label><div className="wide"><button type="button" onClick={() => setCreating(false)}>Cancel</button><button className="admin-primary">Create album</button></div></form>}<div className="album-admin-list">{albums.map((album) => <article key={album.id}><div className="album-cover">{album.photos[0] ? <img src={album.photos[0].src} alt="" /> : <Images />}<span>{album.photos.length} photos</span></div><div><span className="album-year">{album.year}</span><h2>{album.title}</h2><p>{album.description}</p><small>{album.published ? "Published" : "Hidden"}</small></div><label className="upload-button">{uploading === album.id ? <Loader2 className="spin" /> : <Upload />}<span>{uploading === album.id ? "Uploading…" : "Upload photos"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => uploadPhotos(album.id, event.target.files)} /></label></article>)}</div></section>;
}
