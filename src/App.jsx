
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
  
      <h1 className="liveHost">
        Christine
      </h1>
  
      <p className="liveLocation">
        Broadcasting from Ridgewood
      </p>
  
      <p className="liveMeta">
        Started 1:07 PM · 12 listeners
      </p>
  
      <audio
        controls
        preload="none"
      >
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

<main className="booth">

  <header className="boothHeader">
    <button
      className="minimalLink"
      onClick={() => window.location.href="/"}
    >
      ← RETURN TO STATION
    </button>

    <div className="boothTitle">
      DJ BOOTH
    </div>
  </header>

  <section className="statusPanel">

    <div className={`statusLight ${broadcasting ? "live" : "offline"}`}>
      {broadcasting ? "● LIVE" : "○ OFFLINE"}
    </div>

    <div className="statusText">
      {status}
    </div>

  </section>

  <section className="masterPanel">

    <h2>MASTER</h2>

    <label>Crossfade</label>

    {/* existing crossfade slider */}

    <div className="masterActions">

      <button
        className="externalButton"
        onClick={toggleExternalInput}
      >
        EXTERNAL INPUT
      </button>

      <button
        className="goLiveButton"
        onClick={fakeBroadcast}
      >
        {broadcasting ? "END BROADCAST" : "GO LIVE"}
      </button>

    </div>

  </section>

  <section className="deckGrid">

    <section className="deck">

      <h2>DECK A</h2>

      <div className="trackName">
        {deckATrack?.name || "No track loaded"}
      </div>

      {/* existing file picker */}

      {/* existing play button */}

      {/* existing EQ controls */}

    </section>

    <section className="deck">

      <h2>DECK B</h2>

      <div className="trackName">
        {deckBTrack?.name || "No track loaded"}
      </div>

      {/* existing file picker */}

      {/* existing play button */}

      {/* existing EQ controls */}

    </section>

  </section>

</main>

createRoot(document.getElementById("root")).render(<App />);
