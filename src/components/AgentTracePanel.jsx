"use client";

// ============================================================
// AgentTracePanel.jsx — Collapsible agent step log viewer
// ============================================================

import { useState } from "react";
import styles from "./AgentTracePanel.module.css";

const STEP_ICONS = {
  CRISIS_DETECTION: "🚨",
  INTENT_EXTRACTION: "🧠",
  PROVIDER_DISCOVERY: "🔍",
  RANKING: "📊",
  RECOMMENDATION: "✅",
  BARGAINING: "🤝",
  BOOKING: "📋",
  FOLLOW_UP: "⏰",
};

function TraceEntry({ entry, index }) {
  const [open, setOpen] = useState(false);
  const icon = STEP_ICONS[entry.step] || "⚙️";
  const confPercent = Math.round((entry.confidence || 0) * 100);

  return (
    <div className={styles.entry}>
      <button className={styles.entryHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.stepIcon}>{icon}</span>
        <span className={styles.stepName}>{entry.step}</span>
        <span className={styles.stepAgent}>{entry.agent}</span>
        <span className={styles.stepDuration}>{entry.duration_ms}ms</span>
        <span className={styles.chevron}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className={styles.entryBody}>
          <div className={styles.row}>
            <span className={styles.label}>Input:</span>
            <span className={styles.value}>{entry.input_summary}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Output:</span>
            <span className={styles.value}>{entry.output_summary}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Tools:</span>
            <span className={styles.value}>
              {entry.tools_used?.map((t) => (
                <span key={t} className={styles.toolBadge}>{t}</span>
              ))}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Reasoning:</span>
            <span className={styles.value}>{entry.reasoning}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Confidence:</span>
            <span className={styles.value}>
              <span className={styles.confBar}>
                <span
                  className={styles.confFill}
                  style={{
                    width: `${confPercent}%`,
                    background: confPercent >= 80 ? "#25D366" : confPercent >= 50 ? "#FFA500" : "#FF3B30",
                  }}
                />
              </span>
              <span className={styles.confNum}>{confPercent}%</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentTracePanel({ traces, isOpen, onToggle }) {
  return (
    <aside className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}>
      <button className={styles.toggleBtn} onClick={onToggle} id="trace-toggle-btn">
        {isOpen ? "◀ Agent Trace" : "▶"}
      </button>

      {isOpen && (
        <div className={styles.inner}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>⚡ Agent Trace</span>
            <span className={styles.panelSubtitle}>
              {traces.length} step{traces.length !== 1 ? "s" : ""} logged
            </span>
          </div>

          {traces.length === 0 ? (
            <div className={styles.empty}>
              <p>Pipeline steps will appear here as they execute...</p>
            </div>
          ) : (
            <div className={styles.entries}>
              {traces.map((entry, i) => (
                <TraceEntry key={`${entry.step}-${i}`} entry={entry} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
