"use client";

function maxValue(rows) {
  return rows.reduce((max, row) => Math.max(max, row.views, row.clicks), 1);
}

export function DashboardAnalytics({ data, messages }) {
  if (!data.length) {
    return <p className="dribads-muted">{messages.analytics.empty}</p>;
  }

  const max = maxValue(data);

  return (
    <div className="dribads-analytics">
      <h3 className="dribads-section-title">{messages.analytics.title}</h3>
      <div className="dribads-chart">
        {data.map((point) => {
          const viewsHeight = Math.round((point.views / max) * 100);
          const clicksHeight = Math.round((point.clicks / max) * 100);

          return (
            <div key={point.date} className="dribads-chart-group">
              <div className="dribads-chart-bars">
                <span className="bar views" style={{ height: `${viewsHeight}%` }} />
                <span className="bar clicks" style={{ height: `${clicksHeight}%` }} />
              </div>
              <span className="dribads-chart-label">{point.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
      <div className="dribads-chart-legend">
        <span className="legend views">{messages.analytics.views}</span>
        <span className="legend clicks">{messages.analytics.clicks}</span>
      </div>
    </div>
  );
}
