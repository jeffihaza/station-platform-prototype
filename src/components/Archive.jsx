import React, { useEffect, useState } from "react";

export default function Archive() {
  const [state, setState] = useState({ kind: "loading" });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArchive() {
      try {
        const res = await fetch("/api/archive/reposts");
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

    loadArchive();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleShow(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <section className="archiveShows">
      <h2 className="archiveHeading">RECENT BROADCASTS</h2>

      {state.kind === "loading" && (
        <p className="archiveMeta">Loading archive…</p>
      )}

      {state.kind === "error" && (
        <p className="archiveEmpty">Unable to load archive</p>
      )}

      {state.kind === "ready" && state.shows.length === 0 && (
        <p className="archiveEmpty">No Archived Shows</p>
      )}

      {state.kind === "ready" && state.shows.length > 0 && (
        <ul className="archiveList">
          {state.shows.map((show) => {
            const expanded = expandedId === show.id;

            return (
              <li key={show.id} className="archiveItem">
                <button
                  type="button"
                  className="archiveRow"
                  aria-expanded={expanded}
                  onClick={() => toggleShow(show.id)}
                >
                  {show.artworkUrl ? (
                    <img
                      className="archiveArtwork"
                      src={show.artworkUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className="archiveArtwork archiveArtworkPlaceholder" />
                  )}

                  <span className="archiveDetails">
                    <span className="archiveTitle">{show.title}</span>
                    {show.date && (
                      <span className="archiveMeta">{show.date}</span>
                    )}
                  </span>
                </button>

                {expanded && show.embedUrl && (
                  <div className="archiveEmbed">
                    <iframe
                      title={show.title}
                      src={show.embedUrl}
                      width="100%"
                      height="166"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
