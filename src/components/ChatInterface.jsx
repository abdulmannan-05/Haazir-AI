"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./ChatInterface.module.css";

function DoubleTickIcon() {
  return (
    <svg className={styles.blueTicks} viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L7 17l-5-5" />
      <path d="M22 10l-7.5 7.5L13 16" />
    </svg>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  const hasUrduScript = typeof msg.content === "string" && /[\u0600-\u06FF]/.test(msg.content);

  return (
    <div className={`${styles.bubbleWrapper} ${isUser ? styles.userWrapper : styles.botWrapper} ${styles.frostEnter}`}>
      {!isUser && <div className={styles.avatar}>H</div>}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
        {typeof msg.content === "string" ? (
          <p className={`${styles.bubbleText} ${hasUrduScript ? "urdu-text" : ""}`}>
            {msg.content}
          </p>
        ) : (
          msg.content
        )}
        <div className={styles.timestampRow}>
          <span className={styles.timestamp}>{msg.time}</span>
          {!isUser && <DoubleTickIcon />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className={`${styles.bubbleWrapper} ${styles.botWrapper} ${styles.frostEnter}`}>
      <div className={styles.avatar}>H</div>
      <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingBubble}`}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

export default function ChatInterface({ messages, isTyping, onSend, disabled, isCrisis }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.header} ${isCrisis ? styles.headerCrisis : ""}`}>
        <div className={`${styles.headerAvatar} ${isCrisis ? styles.avatarCrisis : ""}`}>H</div>
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>HaazirAI</span>
          <span className={`${styles.headerStatus} ${isCrisis ? styles.statusCrisis : ""}`}>
            {isCrisis ? "🚨 CRISIS MODE — Emergency response active" : "● Online — Bol do, ho jaaye"}
          </span>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={`${styles.emptyState} ${styles.frostEnter}`}>
            <p className={styles.emptyEmoji}>👋</p>
            <p className={styles.emptyTitle}>Assalam o Alaikum!</p>
            <p className={styles.emptySubtitle}>
              Koi bhi service chahiye? Type karo — Roman Urdu, English, ya Urdu mein.
            </p>
            <div className={styles.suggestions}>
              {[
                "Mujhe kal subah G-13 mein AC technician chahiye",
                "Plumber chahiye abhi — pipe burst ho gaya!",
                "AC wala book karo lekin 2000 se zyada nahi dena",
              ].map((s) => (
                <button
                  key={s}
                  className={styles.suggestionChip}
                  onClick={() => onSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className={`${styles.inputBar} ${isCrisis ? styles.inputBarCrisis : ""}`}>
        <textarea
          id="chat-input"
          className={styles.input}
          placeholder={isCrisis ? "🚨 Emergency — describe situation..." : "Type in Roman Urdu, English, or اردو..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
        <button
          id="send-btn"
          className={`${styles.sendBtn} ${isCrisis ? styles.sendBtnCrisis : ""}`}
          onClick={handleSend}
          disabled={!input.trim() || disabled}
        >
          {isCrisis ? "🚨" : "➤"}
        </button>
      </div>
    </div>
  );
}
