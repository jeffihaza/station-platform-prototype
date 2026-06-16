import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";

const USERNAME_KEY = "radio_username";
const CHAT_CHANNEL = "123radio-chat";
const MAX_MESSAGE_LENGTH = 300;

function isNearBottom(element, threshold = 80) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}

function NameModal({ onJoin }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 32);
    if (trimmed.length < 2) {
      return;
    }
    localStorage.setItem(USERNAME_KEY, trimmed);
    onJoin(trimmed);
  }

  return (
    <div className="chatNameOverlay">
      <div className="chatNameModal">
        <h2>Choose a name</h2>
        <form onSubmit={handleSubmit}>
          <input
            className="chatNameInput"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={32}
            autoFocus
          />
          <button className="chatSendButton" type="submit" disabled={name.trim().length < 2}>
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Chat() {
  const [username, setUsername] = useState(
    () => localStorage.getItem(USERNAME_KEY) || ""
  );
  const [showNameModal, setShowNameModal] = useState(
    () => !localStorage.getItem(USERNAME_KEY)
  );
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);

  const messagesRef = useRef(null);
  const shouldStickRef = useRef(true);

  useEffect(() => {
    let pusher = null;

    async function init() {
      try {
        const [historyRes, configRes] = await Promise.all([
          fetch("/api/chat/history"),
          fetch("/api/chat/config")
        ]);

        if (!historyRes.ok || !configRes.ok) {
          setError("Chat unavailable.");
          return;
        }

        const history = await historyRes.json();
        const config = await configRes.json();

        setMessages(history.messages || []);

        pusher = new Pusher(config.key, {
          cluster: config.cluster
        });

        const channel = pusher.subscribe(CHAT_CHANNEL);
        channel.bind("new-message", (message) => {
          setMessages((current) => [...current, message]);
        });

        setReady(true);
      } catch {
        setError("Chat unavailable.");
      }
    }

    init();

    return () => {
      if (pusher) {
        pusher.unsubscribe(CHAT_CHANNEL);
        pusher.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const element = messagesRef.current;
    if (!element || !shouldStickRef.current) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [messages]);

  function handleScroll() {
    const element = messagesRef.current;
    if (!element) {
      return;
    }
    shouldStickRef.current = isNearBottom(element);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmed = draft.trim();
    if (!trimmed || !username || !ready) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message: trimmed })
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Could not send message.");
        return;
      }

      setDraft("");
      shouldStickRef.current = true;
    } catch {
      setError("Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <aside className="chatPanel">
      <div className="chatHeader">
        <p className="chatEyebrow">CHAT</p>
      </div>

      <div
        className="chatMessages"
        ref={messagesRef}
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div key={message.id} className="chatMessage">
            <span className="chatUsername">{message.username}:</span>
            <span className="chatMessageBody">{message.message}</span>
          </div>
        ))}
      </div>

      {username ? (
        <form className="chatComposer" onSubmit={handleSubmit}>
          <input
            className="chatInput"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Say something"
            disabled={sending || !ready}
          />
          <button
            className="chatSendButton"
            type="submit"
            disabled={sending || !ready || !draft.trim()}
          >
            Send
          </button>
        </form>
      ) : (
        <button
          className="chatJoinPrompt"
          type="button"
          onClick={() => setShowNameModal(true)}
        >
          Choose a name to chat
        </button>
      )}

      {error && <p className="chatError">{error}</p>}

      {showNameModal && (
        <NameModal
          onJoin={(name) => {
            setUsername(name);
            setShowNameModal(false);
          }}
        />
      )}
    </aside>
  );
}
