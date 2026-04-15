import Link from "next/link";

function buildHref(pathname, appSlug) {
  if (!appSlug || appSlug === "all") return pathname;
  return `${pathname}?app=${encodeURIComponent(appSlug)}`;
}

export function AppSelector({ pathname, selectedApp = "all", apps = [], messages }) {
  const normalizedApps = (apps || []).filter((app) => app?.slug && app.slug !== "web");
  const selectedLabel =
    selectedApp === "all"
      ? messages.all
      : normalizedApps.find((app) => app.slug === selectedApp)?.name || messages.all;

  return (
    <div className="dribads-app-selector" aria-label={messages.label}>
      <span className="dribads-app-selector-label">{messages.label}</span>
      <details className="dribads-app-dropdown">
        <summary className="dribads-app-dropdown-summary">
          <span className="dribads-app-dropdown-title">{messages.label}</span>
          <span className="dribads-app-dropdown-value">{selectedLabel}</span>
        </summary>
        <div className="dribads-app-dropdown-menu" role="list">
          <Link href={buildHref(pathname, "all")} className={selectedApp === "all" ? "is-active" : ""}>
            {messages.all}
          </Link>
          {normalizedApps.map((app) => (
            <Link
              key={app.id || app.slug}
              href={buildHref(pathname, app.slug)}
              className={selectedApp === app.slug ? "is-active" : ""}
            >
              {app.name}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
