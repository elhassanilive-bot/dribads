import Link from "next/link";

export function AuthRequiredCard({ title, message, loginLabel, signupLabel, bullets = [] }) {
  return (
    <section className="dribads-card dribads-stack dribads-auth-cta">
      <div className="dribads-auth-cta-head">
        <span className="dribads-auth-cta-badge">Publisher Access</span>
        <h1 className="dribads-section-title">{title}</h1>
        <p className="dribads-note">{message}</p>
      </div>

      <div className="dribads-auth-preview" aria-hidden="true">
        <article className="dribads-auth-mini-card">
          <p>CTR</p>
          <strong>12.8%</strong>
        </article>
        <article className="dribads-auth-mini-card">
          <p>RPM</p>
          <strong>$4.72</strong>
        </article>
        <article className="dribads-auth-mini-card">
          <p>Revenue</p>
          <strong>$1,280</strong>
        </article>
      </div>

      {bullets.length ? (
        <ul className="dribads-list dribads-auth-list">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <div className="dribads-toolbar-actions dribads-auth-cta-actions">
        <Link href="/login" className="dribads-btn dribads-btn-primary dribads-auth-btn">
          {loginLabel}
        </Link>
        <Link href="/login?mode=signup" className="dribads-btn dribads-btn-ghost dribads-auth-btn">
          {signupLabel}
        </Link>
      </div>
    </section>
  );
}
