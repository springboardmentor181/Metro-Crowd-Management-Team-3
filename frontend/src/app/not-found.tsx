import Link from "next/link";

export default function NotFound() {
  return <main className="login"><section className="card login-card"><div className="eyebrow">404 · Route unavailable</div><h1 style={{fontSize:34}}>This platform has moved on.</h1><p className="subtitle" style={{marginBottom:24}}>The requested MetroFlow screen does not exist or is no longer available.</p><Link className="btn primary" href="/dashboard">Return to operations</Link></section></main>;
}
