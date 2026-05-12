import "./globals.css";

export const metadata = {
  title: "HaazirAI — Bol do, ho jaaye",
  description:
    "AI-powered service orchestrator for Pakistan's informal economy. Book plumbers, electricians, AC technicians, tutors and more — in Roman Urdu, English, or Urdu.",
  keywords: ["HaazirAI", "service booking", "Pakistan", "Roman Urdu", "AI orchestrator"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ur">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0D1117" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
