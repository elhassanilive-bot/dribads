import Link from "next/link";

export function DribadsFooter({ messages }) {
  const year = new Date().getFullYear();

  return (
    <footer className="dribads-footer">
      <div className="dribads-container dribads-footer-inner">
        <div>
          <p className="dribads-footer-brand">Dribads</p>
          <p className="dribads-footer-copy">{messages.description}</p>
        </div>

        <nav className="dribads-footer-links" aria-label={messages.linksAria}>
          {messages.links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="dribads-footer-rights">© {year} Dribads. {messages.rights}</p>
      </div>
    </footer>
  );
}
