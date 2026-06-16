import React, { useCallback, useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";

const USERNAME_KEY = "radio_username";
const CHAT_CHANNEL = "123radio-chat";
const MAX_MESSAGE_LENGTH = 300;

function isNearBottom(element, threshold = 80) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}

function NameModal({ onJoin, onClose }) {
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
    <div className="chatNameOverlay" onClick={onClose}>
      <div className="chatNameModal" onClick={(e) => e.stopPropagation()}>
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
  const [showNameModal, setShowNameModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);

  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const shouldStickRef = useRef(true);
  const pendingSendRef = useRef(false);

  const appendMessage = useCallback((message) => {
    if (!message?.id) {
      return;
    }

    setMessages((current) => {
      if (current.some((entry) => entry.id === message.id)) {
        return current;
      }
      return [...current, message];
    });
  }, []);

  useEffect(() => {
    let pusher = null;
    let channel = null;

    async function init() {
      try {
        const [historyRes, configRes] = await Promise.all([
          fetch("/api/chat/history"),
          fetch("/api/chat/config")
        ]);

        if (!historyRes.ok) {
          console.error("[chat] history failed:", historyRes.status);
          setError("Chat unavailable.");
          return;
        }

        if (!configRes.ok) {
          console.error("[chat] config failed:", configRes.status);
          setError("Chat unavailable.");
          return;
        }

        const history = await historyRes.json();
        const config = await configRes.json();

        setMessages(history.messages || []);

        if (!config.key || !config.cluster) {
          console.error("[chat] missing Pusher config:", config);
          setError("Chat unavailable.");
          return;
        }

        pusher = new Pusher(config.key, {
          cluster: config.cluster
        });

        pusher.connection.bind("error", (err) => {
          console.error("[chat] Pusher connection error:", err);
        });

        pusher.connection.bind("state_change", (states) => {
          if (states.current === "failed" || states.current === "unavailable") {
            console.error("[chat] Pusher connection state:", states.current);
          }
        });

        channel = pusher.subscribe(CHAT_CHANNEL);

        channel.bind("pusher:subscription_succeeded", () => {
          console.log("[chat] subscribed to", CHAT_CHANNEL);
        });

        channel.bind("pusher:subscription_error", (status) => {
          console.error("[chat] subscription error:", status);
        });

        channel.bind("new-message", (message) => {
          appendMessage(message);
        });

        setReady(true);
      } catch (err) {
        console.error("[chat] init failed:", err);
        setError("Chat unavailable.");
      }
    }

    init();

    return () => {
      if (channel) {
        channel.unbind_all();
      }
      if (pusher) {
        pusher.unsubscribe(CHAT_CHANNEL);
        pusher.disconnect();
      }
    };
  }, [appendMessage]);

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

  function promptForName(attemptSend = false) {
    pendingSendRef.current = attemptSend;
    setShowNameModal(true);
  }

  function handleInputFocus() {
    if (!username) {
      inputRef.current?.blur();
      promptForName(false);
    }
  }

  async function sendMessage(activeUsername) {
    const trimmed = draft.trim();
    if (!trimmed || !activeUsername || !ready) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: activeUsername, message: trimmed })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("[chat] send failed:", res.status, data);
        setError(data.error || "Could not send message.");
        return;
      }

      if (data.message) {
        appendMessage(data.message);
      }

      setDraft("");
      shouldStickRef.current = true;
    } catch (err) {
      console.error("[chat] send error:", err);
      setError("Could not send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!username) {
      promptForName(true);
      return;
    }

    await sendMessage(username);
  }

  async function handleNameJoin(name) {
    setUsername(name);
    setShowNameModal(false);

    if (pendingSendRef.current && draft.trim()) {
      pendingSendRef.current = false;
      await sendMessage(name);
      return;
    }

    inputRef.current?.focus();
  }

  return (
    <section className="chatPanel">
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

      <form className="chatComposer" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="chatInput"
          type="text"
          value={draft}
          onFocus={handleInputFocus}
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

      {error && <p className="chatError">{error}</p>}

      {showNameModal && (
        <NameModal
          onJoin={handleNameJoin}
          onClose={() => {
            pendingSendRef.current = false;
            setShowNameModal(false);
          }}
        />
      )}
    </section>
  );
}
