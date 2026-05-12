"use client";

// ============================================================
// LanguageDetector.jsx — Real-time input language badge
// ============================================================

import { useMemo } from "react";
import { detectLanguage, getLanguageLabel } from "@/utils/languageDetector";
import styles from "./LanguageDetector.module.css";

export default function LanguageDetector({ input }) {
  const lang = useMemo(() => detectLanguage(input || ""), [input]);
  const label = getLanguageLabel(lang);

  return (
    <span className={`${styles.badge} ${styles[lang.replace("_", "")]}`} title="Detected language">
      {label}
    </span>
  );
}
