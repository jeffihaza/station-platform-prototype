
import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Radio, Play, Pause, Upload, Mic2, Headphones, CalendarDays,
  Signal, Lock, Library
} from "lucide-react";
import "./styles.css";


function makeDeck(audioContext, sourceNode) {
  const gain = audioContext.createGain();
  const low = audioContext.createBiquadFilter();
  const mid = audioContext.createBiquadFilter();
  const high = audioContext.createBiquadFilter();

  low.type = "lowshelf";
  low.frequency.value = 320;

  mid.type = "peaking";
  mid.frequency.value = 1200;
  mid.Q.value = 1;

  high.type = "highshelf";
  high.frequency.value = 3200;

  sourceNode.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(gain);

  return { gain, low, mid, high };
}

function App() {
  const [view, setView] = useState("station");
  return view === "station" ? <StationLanding setView={setView} /> : <CreatorBooth setView={setView} />;
}

function StationLanding({ setView }) {
  return (
    <main className="stationPage">
      <nav className="nav">
        <button className="wordmark" onClick={() => setView("station")}>
          123 RADIO
        </button>
        <div className="navLinks">
          <a>Live</a>
          <a>Schedule</a>
          <a>Archive</a>
          <button onClick={() => setView("booth")} className="navButton">
            DJ Login
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <div className="liveTag">
            <span></span> Live Soon
          </div>
          <h1>Independent radio, broadcasting from wherever the room is.</h1>
          <p>
            A remote-first radio station for listeners, residents, and guest DJs. Live programming,
            archives, and show information coming soon.
          </p>
          <div className="heroActions">
            <audio
              controls
              preload="none"
              style={{
                width: "100%",
                maxWidth: "480px",
                marginTop: "16px"
              }}
            >
              <source
                src="http://137.184.158.254/listen/123_radio/radio.mp3"
                type="audio/mpeg"
              />
            </audio>

            <button className="secondary" onClick={() => setView("booth")}>
              DJ Login
            </button>
          </div>
        </div>

        <div className="liveCard">
          <div className="artwork">
            <Signal size={58} />
          </div>
          <div className="cardMeta">
            <p>Channel 1</p>
            <h2>123 Radio Live Stream</h2>
            <span>Broadcasting live for the love.</span>
          </div>
        </div>
      </section>

      <section className="channelGrid">
        <div className="channel active">
          <p>Channel 1</p>
          <h3>Live Radio</h3>
          <span>Primary station feed</span>
        </div>
        <div className="channel">
          <p>Channel 2</p>
          <h3>Guest Stream</h3>
          <span>Remote creator takeovers</span>
        </div>
        <div className="channel">
          <p>Fallback</p>
          <h3>Station Automation</h3>
          <span>Scheduled playout when nobody is live</span>
        </div>
      </section>

      <section className="split">
        <div>
          <div className="sectionTitle">
            <CalendarDays size={21} />
            <h2>Coming Up</h2>
          </div>
          <div className="schedule emptyState">
            <h3>Schedule Coming Soon</h3>
            <p>Programming will appear here once shows are announced.</p>
          </div>
        </div>

        <aside className="creatorPanel">
          <Lock size={22} />
          <h2>DJ Login</h2>
          <p>
            Private creator access for remote broadcasting. DJs can load files, use an external audio interface,
            mix two decks, and eventually push the final feed into the station ingest.
          </p>
          <button className="primary full" onClick={() => setView("booth")}>
            DJ Login
          </button>
        </aside>
      </section>

      <section>
        <div className="sectionTitle">
          <Library size={21} />
          <h2>Archive</h2>
        </div>
        <div className="archiveGrid blankArchive">
          <article className="archiveCard emptyArchiveCard">
            <div className="miniArt">—</div>
            <h3>Archives Coming Soon</h3>
            <p>Past broadcasts will live here.</p>
            <span>Shows TBA</span>
          </article>
        </div>
      </section>

      <footer className="footer">
        <div>
          <h2>123 RADIO</h2>
          <p>Public site + remote DJ booth prototype.</p>
        </div>
        <button className="secondary" onClick={() => setView("booth")}>
          DJ Login
        </button>
      </footer>
    </main>
  );
}

function Deck({ name, side, onFile, onPlayPause, playing, onGain, onEq }) {
  return (
    <section className="deck">
      <div className="deckHeader">
        <div>
          <p className="eyebrow">{side}</p>
          <h2>{name}</h2>
        </div>
        <label className="upload">
          <Upload size={17} />
          Load Track
          <input type="file" accept="audio/*" onChange={onFile} />
        </label>
      </div>

      <button className="transport" onClick={onPlayPause}>
        {playing ? <Pause size={20} /> : <Play size={20} />}
        {playing ? "Pause" : "Play"}
      </button>

      <div className="controls">
        <label>Volume
          <input type="range" min="0" max="1" step="0.01" defaultValue="0.8" onChange={(e) => onGain(+e.target.value)} />
        </label>
        <label>Lows
          <input type="range" min="-24" max="24" step="1" defaultValue="0" onChange={(e) => onEq("low", +e.target.value)} />
        </label>
        <label>Mids
          <input type="range" min="-24" max="24" step="1" defaultValue="0" onChange={(e) => onEq("mid", +e.target.value)} />
        </label>
        <label>Highs
          <input type="range" min="-24" max="24" step="1" defaultValue="0" onChange={(e) => onEq("high", +e.target.value)} />
        </label>
      </div>
    </section>
  );
}

function CreatorBooth({ setView }) {
  const ctxRef = useRef(null);
  const audioEls = useRef({ a: null, b: null });
  const deckRefs = useRef({ a: null, b: null });
  const masterRef = useRef(null);
  const destRef = useRef(null);
  const micRef = useRef(null);
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const [playing, setPlaying] = useState({ a: false, b: false });
  const [micOn, setMicOn] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [status, setStatus] = useState("Offline / local preview");
  

  function ensureAudio() {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      const destination = ctx.createMediaStreamDestination();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      master.connect(destination);
      ctxRef.current = ctx;
      masterRef.current = master;
      destRef.current = destination;
    }
    return ctxRef.current;
  }

  function loadFile(deck, file) {
    const ctx = ensureAudio();
    if (!file) return;

    if (!audioEls.current[deck]) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      const source = ctx.createMediaElementSource(audio);
      const deckChain = makeDeck(ctx, source);
      deckChain.gain.connect(masterRef.current);
      audioEls.current[deck] = audio;
      deckRefs.current[deck] = deckChain;
    }

    audioEls.current[deck].src = URL.createObjectURL(file);
    audioEls.current[deck].load();
    setStatus(`${deck.toUpperCase()} loaded: ${file.name}`);
  }

  async function togglePlay(deck) {
    const ctx = ensureAudio();
    await ctx.resume();
    const audio = audioEls.current[deck];
    if (!audio) {
      setStatus(`Load a track into Deck ${deck.toUpperCase()} first.`);
      return;
    }

    if (audio.paused) {
      await audio.play();
      setPlaying((p) => ({ ...p, [deck]: true }));
    } else {
      audio.pause();
      setPlaying((p) => ({ ...p, [deck]: false }));
    }
  }

  function setDeckGain(deck, value) {
    const chain = deckRefs.current[deck];
    if (chain) chain.gain.gain.value = value;
  }

  function setDeckEq(deck, band, value) {
    const chain = deckRefs.current[deck];
    if (!chain) return;
    if (band === "low") chain.low.gain.value = value;
    if (band === "mid") chain.mid.gain.value = value;
    if (band === "high") chain.high.gain.value = value;
  }

  function crossfade(value) {
    const a = deckRefs.current.a;
    const b = deckRefs.current.b;
    const x = +value;
    if (a) a.gain.gain.value = Math.cos(x * Math.PI / 2);
    if (b) b.gain.gain.value = Math.cos((1 - x) * Math.PI / 2);
  }

  async function toggleMic() {
    const ctx = ensureAudio();
    await ctx.resume();

    if (micOn && micRef.current) {
      micRef.current.stream.getTracks().forEach((t) => t.stop());
      micRef.current.node.disconnect();
      micRef.current = null;
      setMicOn(false);
      setStatus("External input off");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const node = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = 0.85;
    node.connect(gain);
    gain.connect(masterRef.current);
    micRef.current = { stream, node, gain };
    setMicOn(true);
    setStatus("External input live");
  }

  async function fakeBroadcast() {
    ensureAudio();

    if (!broadcasting) {
      try {
        const socket = new WebSocket("ws://broadcast.123radio.org:8080");

        socketRef.current = socket;

        socket.onopen = () => {
          const recorder = new MediaRecorder(
            destRef.current.stream,
            {
              mimeType: "audio/webm"
            }
          );

          recorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (
              e.data.size > 0 &&
              socket.readyState === WebSocket.OPEN
            ) {
              socket.send(e.data);
            }
          };

          recorder.start(250);

          setBroadcasting(true);
          setStatus("Connected to 123 Radio ingest");
        };

        socket.onerror = (err) => {
          console.error(err);
          setStatus("WebSocket connection failed");
        };

        socket.onclose = () => {
          setStatus("Socket disconnected");
        };
      } catch (err) {
        console.error(err);
        setStatus("Connection error");
      }
    } else {
      recorderRef.current?.stop();
      socketRef.current?.close();

      setBroadcasting(false);
      setStatus("Broadcast stopped");
    }
  }

  return (
    <main className="boothPage">
      <header className="topbar">
        <button className="backButton" onClick={() => setView("station")}>← 123 Radio</button>
        <div className="brand">
          <Radio />
          <div>
            <h1>DJ Booth</h1>
            <p>Remote broadcast console</p>
          </div>
        </div>
        <div className={broadcasting ? "livePill onAir" : "livePill"}>{broadcasting ? "ON AIR SIM" : "LOCAL PREVIEW"}</div>
      </header>

      <div className="grid">
        <Deck name="Deck A" side="Source One" playing={playing.a}
          onFile={(e) => loadFile("a", e.target.files[0])}
          onPlayPause={() => togglePlay("a")}
          onGain={(v) => setDeckGain("a", v)}
          onEq={(band, v) => setDeckEq("a", band, v)}
        />

        <section className="mixer">
          <p className="eyebrow">Mixer</p>
          <h2>Master Control</h2>

          <label className="crossfader">
            Crossfade
            <input type="range" min="0" max="1" step="0.01" defaultValue="0.5" onChange={(e) => crossfade(e.target.value)} />
            <div className="ab"><span>A</span><span>B</span></div>
          </label>

          <button className={micOn ? "mic active" : "mic"} onClick={toggleMic}>
            <Mic2 size={18} />
            {micOn ? "External Input On" : "External Input"}
          </button>

          <button className={broadcasting ? "broadcastButton stop" : "broadcastButton"} onClick={fakeBroadcast}>
            <Headphones size={18} />
            {broadcasting ? "Stop Broadcast" : "Go Live"}
          </button>

          <div className="status">
            <span>Status</span>
            <strong>{status}</strong>
          </div>

          <div className="note">
            The master mix is routed to a browser MediaStreamDestination. The next production step is sending this stream to a WebRTC ingest server, then encoding to Icecast or LibreTime.
          </div>
        </section>

        <Deck name="Deck B" side="Source Two" playing={playing.b}
          onFile={(e) => loadFile("b", e.target.files[0])}
          onPlayPause={() => togglePlay("b")}
          onGain={(v) => setDeckGain("b", v)}
          onEq={(band, v) => setDeckEq("b", band, v)}
        />
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
