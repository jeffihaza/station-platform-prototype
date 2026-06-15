
import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Radio, Play, Pause, Upload, Mic2, Headphones, CalendarDays,
  Signal, Lock, Library
} from "lucide-react";
import "./styles.css";

import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";



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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StationLanding />} />
        <Route path="/dj" element={<CreatorBooth />} />
      </Routes>
    </BrowserRouter>
  );
}

function StationLanding() {
  return ( <main className="stationMinimal">
  
    <header className="minimalHeader">
      <div>123 RADIO</div>
  
      <button
        className="minimalLink"
        onClick={() => window.location.href="/dj"}
      >
        DJ LOGIN
      </button>
    </header>
  
  <section className="liveSection">

  <div className="liveLabel">
    LIVE NOW
  </div>

  <h1 className="liveDate">
    {new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).toUpperCase()}
  </h1>

  <p className="liveTrack">
    {currentTrack || "OFFLINE"}
  </p>

  <audio controls preload="none">
    <source
      src="https://radio.123radio.org/radio.mp3"
      type="audio/mpeg"
    />
  </audio>

</section>
  
    <section className="divider">
      ────────────────────────
    </section>
  
    <section>
  
      <h2>UPCOMING</h2>
  
      <ul className="simpleList">
        <li>7 PM — Jeff</li>
        <li>9 PM — Guest</li>
      </ul>
  
    </section>
  
    <section className="divider">
      ────────────────────────
    </section>
  
    <section>
  
      <h2>RECENT BROADCASTS</h2>
  
      <ul className="simpleList">
        <li>Room 001</li>
        <li>Room 002</li>
        <li>Room 003</li>
      </ul>
  
    </section>
  
  </main>
  
  
  );
  }
  

function Deck({ name, side, onFile, onPlayPause, playing, onGain, onEq }) {
  return (
    <section className="deck">
      <div className="deckHeader">
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
        const socket = new WebSocket("wss://broadcast.123radio.org");

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

  <header className="boothHeader">
    <button
      className="backButton"
      onClick={() => window.location.href="/"}
    >
      ← RETURN TO STATION
    </button>

    <h1>DJ BOOTH</h1>

    <div className={`statusLight ${broadcasting ? "live" : "offline"}`}>
      {broadcasting ? "● LIVE" : "○ OFFLINE"}
    </div>
  </header>

  <div className="deckGrid">

    <Deck
      name="DECK A"
      playing={playing.a}
      onFile={(e) => loadFile("a", e.target.files[0])}
      onPlayPause={() => togglePlay("a")}
      onGain={(v) => setDeckGain("a", v)}
      onEq={(band, v) => setDeckEq("a", band, v)}
    />

    <Deck
      name="DECK B"
      playing={playing.b}
      onFile={(e) => loadFile("b", e.target.files[0])}
      onPlayPause={() => togglePlay("b")}
      onGain={(v) => setDeckGain("b", v)}
      onEq={(band, v) => setDeckEq("b", band, v)}
    />

  </div>

  <section className="masterPanel">

    <h2>MASTER</h2>

    <label className="crossfade">
      Crossfade

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        defaultValue="0.5"
      />
    </label>

    <div className="masterActions">

      <button
        className={micOn ? "mic active" : "mic"}
        onClick={toggleMic}
      >
        {micOn ? "EXTERNAL INPUT ON" : "EXTERNAL INPUT"}
      </button>

      <button
        className={
          broadcasting
            ? "broadcastButton stop"
            : "broadcastButton"
        }
        onClick={fakeBroadcast}
      >
        {broadcasting ? "STOP BROADCAST" : "GO LIVE"}
      </button>

    </div>

    <div className="statusLine">
      {status}
    </div>

  </section>

</main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
