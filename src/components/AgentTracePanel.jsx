"use client";

import { useState, useEffect } from "react";
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

function IslamabadNeuralMap({ candidates = [] }) {
  const sectors = [
    { name: "Sector G-13", top: "65%", left: "22%" },
    { name: "Sector G-11", top: "45%", left: "50%" },
    { name: "Sector F-10", top: "25%", left: "78%" },
  ];

  const getCoord = (idx) => {
    const points = [
      { top: "60%", left: "28%" },
      { top: "70%", left: "16%" },
      { top: "40%", left: "56%" },
      { top: "52%", left: "44%" },
      { top: "20%", left: "84%" },
      { top: "32%", left: "72%" },
    ];
    return points[idx % points.length];
  };

  return (
    <div className={styles.mapContainer}>
      <div className={styles.mapHeader}>
        <span className={styles.mapTitle}>🛰️ ISLAMABAD NEURAL RADAR</span>
        <span className={styles.mapSub}>Minimalist Sector Scan</span>
      </div>
      <div className={styles.mapCanvas}>
        {sectors.map((sec) => (
          <div key={sec.name} className={styles.sectorLabel} style={{ top: sec.top, left: sec.left }}>
            <span className={styles.sectorDot} />
            {sec.name}
          </div>
        ))}

        {candidates.map((p, idx) => {
          const coord = getCoord(idx);
          return (
            <div
              key={p.id || idx}
              className={styles.candidateBeacon}
              style={{ top: coord.top, left: coord.left, animation: `beaconEnter 0.4s ease forwards`, animationDelay: `${idx * 0.08}s` }}
            >
              <span className={styles.beaconRipple} />
              <span className={styles.beaconCore} />
              <span className={styles.beaconTooltip}>{p.name.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TraceEntry({ entry, index, totalTraces }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (entry.step === "PROVIDER_DISCOVERY" || entry.step === "CRISIS_DETECTION") {
      setOpen(true);
    }
  }, [entry.step]);

  const icon = STEP_ICONS[entry.step] || "⚙️";
  const confPercent = Math.round((entry.confidence || 0) * 100);
  const hasCandidates = entry.candidates && entry.candidates.length > 0;

  return (
    <div className={styles.entryWrapper}>
      <div className={styles.entryMain}>
        <div className={styles.nodeColumn}>
          <div className={styles.nodeCircle}>{icon}</div>
          {index < totalTraces - 1 && (
            <div className={styles.neonTrack}>
              <div className={styles.neonGlowLine} style={{ animation: "growDown 0.4s ease-out forwards" }} />
            </div>
          )}
        </div>

        <div className={styles.entryContent}>
          <button className={styles.entryHeader} onClick={() => setOpen((o) => !o)}>
            <span className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.stepName}>{entry.step}</span>
            <span className={styles.stepAgent}>{entry.agent}</span>
            <span className={styles.stepDuration}>{entry.duration_ms}ms</span>
            <span className={styles.chevron}>{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div className={styles.entryBody} style={{ animation: "fadeInDown 0.3s ease-out forwards" }}>
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

              {hasCandidates && <IslamabadNeuralMap candidates={entry.candidates} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentTracePanel({ traces, isOpen, onToggle }) {
  return (
    <aside className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed} glass-panel`}>
      <button className={styles.toggleBtn} onClick={onToggle} id="trace-toggle-btn">
        {isOpen ? "◀ Neural Map" : "▶"}
      </button>

      {isOpen && (
        <div className={styles.inner}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>⚡ Neural Trace Map</span>
            <span className={styles.panelSubtitle}>
              {traces.length} node{traces.length !== 1 ? "s" : ""} logged
            </span>
          </div>

          {traces.length === 0 ? (
            <div className={styles.empty}>
              <p>Neural pipeline pathways will connect here as agents fire...</p>
            </div>
          ) : (
            <div className={styles.entries}>
              {traces.map((entry, i) => (
                <TraceEntry key={`${entry.step}-${i}`} entry={entry} index={i} totalTraces={traces.length} />
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
