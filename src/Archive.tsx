import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Images } from "lucide-react";
import { Link } from "react-router-dom";

type Photo = { id: string; src: string; alt: string; caption: string };
type Album = { id: string; title: string; year: string; description: string; photos: Photo[] };

export function ArchivePage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setFailed(false);
    fetch("/api/public/albums", { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(value => { if (!Array.isArray(value)) throw new Error("Invalid albums"); if (current) setAlbums(value); })
      .catch(() => { if (current) setFailed(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt]);
  useEffect(() => { if (active) { window.scrollTo({ top: 0, behavior: "instant" }); document.querySelector<HTMLElement>(".album-title h1")?.focus({ preventScroll: true }); } }, [active]);
  if (active) return <AlbumView album={active} close={() => setActive(null)} />;
  return <main className="archive-page"><section className="archive-hero"><div><p className="eyebrow light">Past conferences</p><h1>The RijnMUN archive.</h1><p>Photographs from debate, lobbying, ceremonies and the collaborative moments in between.</p></div></section><section className="archive-intro"><p className="eyebrow">Conference history</p><h2>Every edition.<br />A new assembly.</h2><p>Explore RijnMUN through the photography teams who documented each conference.</p></section><section className="album-list" aria-busy={loading}>{albums.length ? albums.map((album) => <button key={album.id} onClick={() => setActive(album)}><div>{album.photos[0] ? <img src={album.photos[0].src} alt="" loading="lazy" decoding="async" /> : <Images />}</div><span className="mono">Edition / {album.year}</span><h2>{album.title}</h2><p>{album.description}</p><b><Camera />View {album.photos.length} photos</b></button>) : <div className="archive-empty"><Images /><h2>{loading ? "Loading conference albums…" : failed ? "The archive is temporarily unavailable." : "Albums will appear here soon."}</h2><p role="status">{loading ? "Gathering photographs from past editions." : failed ? "Please try again to load the conference photographs." : "Conference photographs will appear here once published by the Secretariat."}</p>{failed && <button className="button button-primary" onClick={() => setAttempt(value => value + 1)}>Try again</button>}</div>}</section></main>;
}

function AlbumView({ album, close }: { album: Album; close: () => void }) {
  return <main className="album-page"><header><button onClick={close}><ArrowLeft />All albums</button><Link to="/">RijnMUN</Link></header><section className="album-title"><p className="eyebrow">Edition / {album.year}</p><h1 tabIndex={-1}>{album.title}</h1><p>{album.description}</p><span>{album.photos.length} photographs</span></section><section className="photo-grid">{album.photos.map((photo, index) => <figure key={photo.id} className={index % 5 === 0 ? "wide" : ""}><img src={photo.src} alt={photo.alt} decoding="async" loading={index > 2 ? "lazy" : "eager"} /><figcaption><span>{String(index + 1).padStart(2, "0")}</span>{photo.caption}</figcaption></figure>)}</section></main>;
}
