"use client";

// ============================================================
// ChatInterface.jsx — WhatsApp-style chat window
// ============================================================

import { useState, useRef, useEffect } from "react";
import styles from "./ChatInterface.module.css";

/**
 * Renders a single chat bubble.
 * @param {{ role: "user"|"bot", content: string|React.ReactNode, type: string }} msg
 */
function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`${styles.bubbleWrapper} ${isUser ? styles.userWrapper : styles.botWrapper}`}>
      {!isUser && (
        <div className={styles.avatar}>H</div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
        {typeof msg.content === "string" ? (
          <p className={styles.bubbleText}>{msg.content}</p>
        ) : (
          msg.content
        )}
        <span className={styles.timestamp}>{msg.time}</span>
      </div>
    </div>
  );
}

/**
 * Typing indicator ("HaazirAI is thinking...")
 */
function TypingIndicator() {
  return (
    <div className={`${styles.bubbleWrapper} ${styles.botWrapper}`}>
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
      {/* Header */}
      <div className={`${styles.header} ${isCrisis ? styles.headerCrisis : ""}`}>
        <div className={`${styles.headerAvatar} ${isCrisis ? styles.avatarCrisis : ""}`}>H</div>
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>HaazirAI</span>
          <span className={`${styles.headerStatus} ${isCrisis ? styles.statusCrisis : ""}`}>
            {isCrisis ? "🚨 CRISIS MODE — Emergency response active" : "● Online — Bol do, ho jaaye"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
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

      {/* Input Bar */}
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
