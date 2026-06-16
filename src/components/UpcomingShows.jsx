import React, { useEffect, useState } from "react";

export default function UpcomingShows() {
  const [state, setState] = useState({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadShows() {
      try {
        const res = await fetch("/api/calendar/upcoming");
        const data = await res.json();

        if (cancelled) {
          return;
        }

        if (!res.ok || !data.ok) {
          setState({ kind: "error" });
          return;
        }

        setState({
          kind: "ready",
          shows: data.shows || []
        });
      } catch {
        if (!cancelled) {
          setState({ kind: "error" });
        }
      }
    }

    loadShows();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="upcomingShows">
      <div className="upcomingDivider" />

      <h2 className="upcomingHeading">UPCOMING SHOWS</h2>

      {state.kind === "loading" && (
        <p className="upcomingMeta">Loading schedule…</p>
      )}

      {state.kind === "error" && (
        <p className="upcomingEmpty">Unable to load schedule</p>
      )}

      {state.kind === "ready" && state.shows.length === 0 && (
        <p className="upcomingEmpty">No Upcoming Shows</p>
      )}

      {state.kind === "ready" && state.shows.length > 0 && (
        <ul className="upcomingList">
          {state.shows.map((show, index) => (
            <li key={`${show.title}-${show.date}-${index}`} className="upcomingItem">
              <p className="upcomingTitle">{show.title}</p>
              <p className="upcomingMeta">
                {show.date} · {show.startTime} – {show.endTime}
              </p>
              {show.description && (
                <p className="upcomingDescription">{show.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="upcomingDivider" />
    </section>
  );
}
