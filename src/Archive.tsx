import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Images } from "lucide-react";
import { Link } from "react-router-dom";

type Photo = { id: string; src: string; alt: string; caption: string };
type Album = { id: string; title: string; year: string; description: string; photos: Photo[] };

export function ArchivePage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album | null>(null);
  useEffect(() => { fetch("/api/public/albums", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then(setAlbums).catch(() => setAlbums([])); }, []);
  if (active) return <AlbumView album={active} close={() => setActive(null)} />;
  return <main className="archive-page"><section className="archive-hero"><div><p className="eyebrow light">Past conferences</p><h1>The RijnMUN archive.</h1><p>Photographs from debate, lobbying, ceremonies and the collaborative moments in between.</p></div></section><section className="archive-intro"><p className="eyebrow">Conference history</p><h2>Every edition.<br />A new assembly.</h2><p>Explore RijnMUN through the photography teams who documented each conference.</p></section><section className="album-list">{albums.length ? albums.map((album) => <button key={album.id} onClick={() => setActive(album)}><div>{album.photos[0] ? <img src={album.photos[0].src} alt="" /> : <Images />}</div><span className="mono">Edition / {album.year}</span><h2>{album.title}</h2><p>{album.description}</p><b><Camera />View {album.photos.length} photos</b></button>) : <div className="archive-empty"><Images /><h2>Albums will appear here soon.</h2><p>The Secretariat can create editions and upload photographs in Webdash.</p></div>}</section></main>;
}

function AlbumView({ album, close }: { album: Album; close: () => void }) {
  return <main className="album-page"><header><button onClick={close}><ArrowLeft />All albums</button><Link to="/">RijnMUN</Link></header><section className="album-title"><p className="eyebrow">Edition / {album.year}</p><h1>{album.title}</h1><p>{album.description}</p><span>{album.photos.length} photographs</span></section><section className="photo-grid">{album.photos.map((photo, index) => <figure key={photo.id} className={index % 5 === 0 ? "wide" : ""}><img src={photo.src} alt={photo.alt} loading={index > 2 ? "lazy" : "eager"} /><figcaption><span>{String(index + 1).padStart(2, "0")}</span>{photo.caption}</figcaption></figure>)}</section></main>;
}
