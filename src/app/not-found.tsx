export default function NotFound() {
  return (
    <html lang="bn">
      <body>
        <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", background: "#fff", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-6rem", right: "-6rem", width: "18rem", height: "18rem", borderRadius: "50%", background: "#fef3c7", opacity: 0.4, filter: "blur(64px)" }} />
          <div style={{ position: "absolute", bottom: "-6rem", left: "-6rem", width: "18rem", height: "18rem", borderRadius: "50%", background: "#fffbeb", opacity: 0.6, filter: "blur(64px)" }} />

          <div style={{ position: "relative", textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
            <p style={{ fontSize: "5.5rem", fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1 }}>404</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937", margin: "0.75rem 0" }}>ওহো! পেজটি খুঁজে পাওয়া যায়নি</h1>
            <p style={{ color: "#6b7280", marginBottom: "2rem" }}>আপনি যে পেজটি খুঁজছেন তা সরানো হয়েছে অথবা কখনো ছিল না।</p>
            <a href="/bn" style={{ display: "inline-block", padding: "0.75rem 1.75rem", borderRadius: "0.75rem", background: "#d97706", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
              হোমে যান
            </a>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "2.5rem" }}>
              {[0, 1, 2, 3].map(i => (
                <span key={i} style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#fbbf24", animation: `bounce 1.4s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        `}</style>
      </body>
    </html>
  );
}
