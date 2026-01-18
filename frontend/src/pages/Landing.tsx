import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// OPENQUEST LANDING PAGE - E2B INDUSTRIAL AESTHETIC
// Pure black, monospace typography, terminal windows, orange accents
// ═══════════════════════════════════════════════════════════════════════════════

const Landing = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  // Animated matrix values for the LLM window
  const matrixValues = [
    [".817", ".820", ".034", ".114", ".874"],
    [".070", ".061", ".810", ".077", ".384"],
    [".353", ".679", ".322", ".722", ".022"],
    [".744", ".034", ".053", ".604", ".119"],
    [".663", ".810", ".253", ".310", ".665"],
  ];

  // Terminal output lines for the OUTPUT window
  const outputLines = [
    { year: "2024", bars: 18, color: "#FF6B00" },
    { year: "2023", bars: 3, color: "#FF6B00" },
    { year: "2022", bars: 14, color: "#ffffff" },
    { year: "2021", bars: 6, color: "#FF6B00" },
    { year: "2020", bars: 16, color: "#ffffff" },
    { year: "2019", bars: 20, color: "#ffffff" },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-[#FF6B00]/30 font-mono">
      {/* Subtle grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ANNOUNCEMENT BAR */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-50 border-b border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-4">
          <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/60 tracking-wide">AI-POWERED REPOSITORY MATCHING</span>
            <span className="text-white/30">|</span>
            <a href="#features" className="text-[#FF6B00] hover:underline underline-offset-4 tracking-wide flex items-center gap-1">
              LEARN MORE →
            </a>
          </div>
          <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left Nav */}
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-[13px] text-white/60 hover:text-white tracking-widest uppercase transition-colors">
              PRODUCT
            </a>
            <a href="#how-it-works" className="text-[13px] text-white/60 hover:text-white tracking-widest uppercase transition-colors">
              HOW IT WORKS
            </a>
            <a href="#community" className="text-[13px] text-white/60 hover:text-white tracking-widest uppercase transition-colors">
              COMMUNITY
            </a>
          </nav>

          {/* Logo - Center */}
        <motion.div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="w-8 h-8 bg-[#FF6B00] flex items-center justify-center">
              <span className="text-black font-black text-lg">Q</span>
            </div>
        </motion.div>

          {/* Right Nav */}
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <div className="w-px h-4 bg-white/10" />
            <button 
              onClick={() => navigate("/login")}
              className="text-[13px] text-white/60 hover:text-white tracking-widest uppercase transition-colors"
            >
              SIGN IN
            </button>
            <button 
              onClick={() => navigate("/onboarding")}
              className="text-[13px] bg-white text-black px-5 py-2.5 tracking-widest uppercase hover:bg-white/90 transition-colors font-bold"
            >
              SIGN UP
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <main className="relative">
        <section className="relative z-10 pt-24 pb-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            {/* NEW Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 mb-8"
            >
              <span className="bg-[#FF6B00] text-black text-[10px] font-black px-2.5 py-1 tracking-widest">
                NEW
              </span>
              <a href="#ai" className="text-white/70 text-sm tracking-wide hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white/60 transition-all">
                INTRODUCING AI-POWERED ISSUE MATCHING
              </a>
          </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
            >
              OPEN SOURCE FOR
            </motion.h1>
          <motion.h1
              initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-8 relative inline-block"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
            >
              <span className="relative">
                <span className="absolute -inset-1 bg-gradient-to-r from-[#FF6B00]/20 to-transparent blur-xl" />
                <span className="relative text-[#FF6B00]">EVERYONE</span>
              </span>
          </motion.h1>

            {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed tracking-wide"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
              AI-powered recommendations for beginner-friendly repositories.
              <br />
              Find your first contribution, matched to your skills.
          </motion.p>

            {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button 
                onClick={() => navigate("/onboarding")}
                className="group relative bg-[#FF6B00] text-black px-10 py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[#FF8533] transition-all duration-300"
              >
                <span className="relative z-10">START FOR FREE</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="border border-white/20 text-white px-10 py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-white/5 hover:border-white/40 transition-all duration-300"
              >
                VIEW DASHBOARD
              </button>
            </motion.div>

            {/* Trusted By */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-20"
            >
              <p className="text-[11px] text-white/30 tracking-[0.4em] uppercase mb-8">TRUSTED BY CONTRIBUTORS AT</p>
              <div className="flex items-center justify-center gap-12 opacity-40">
                {["Microsoft", "Google", "Meta", "Vercel", "Supabase", "Railway"].map((company, i) => (
                  <motion.span 
                    key={company}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="text-sm tracking-widest text-white/60 font-medium"
                  >
                    {company}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TERMINAL WINDOWS SHOWCASE */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section className="relative z-10 pb-32 px-6">
          <div className="max-w-6xl mx-auto relative h-[400px]">
            
            {/* LLM PREFERENCE MATRIX - Left */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -2 }}
              animate={{ opacity: 1, x: 0, rotate: -2 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute left-0 top-12 w-[280px] bg-black border border-white/10 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
                  <span className="text-[10px] text-white/60 tracking-widest mx-2 font-bold">PREFERENCES</span>
                  <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
                </div>
              </div>
              <div className="p-4 font-mono text-[11px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 bg-[#FF6B00]/20 flex items-center justify-center">
                    <span className="text-[#FF6B00] text-[10px]">✶</span>
                  </div>
                  <span className="text-white/50">Skill Matrix</span>
                </div>
                <div className="space-y-1">
                  {matrixValues.map((row, i) => (
                    <div key={i} className="flex gap-1.5">
                      {row.map((val, j) => (
                        <span 
                          key={j} 
                          className={`${
                            (i === 0 && j === 2) || (i === 3 && j === 3) || (i === 4 && j === 4)
                              ? 'text-[#FF6B00]' 
                              : (i === 1 && j === 2) 
                                ? 'text-[#FF6B00]/60'
                                : 'text-white/40'
                          }`}
                        >
                          [{val}]
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
          </motion.div>

            {/* OPENQUEST SANDBOX - Center */}
          <motion.div
              initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="absolute left-1/2 -translate-x-1/2 top-0 w-[360px] bg-black border border-white/10 shadow-2xl shadow-[#FF6B00]/5"
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
                  <span className="text-[10px] text-white/60 tracking-widest mx-2 font-bold">OPENQUEST</span>
                  <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
                </div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                <p className="text-[11px] text-white/50 tracking-[0.3em] uppercase mb-6">MATCHING REPOS...</p>
                
                {/* ASCII Loading Animation */}
                <div className="font-mono text-[10px] text-white/30 space-y-1 text-center">
                  <div>┌─────────────────────────┐</div>
                  <div>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
                  <div>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#FF6B00]">✶</span>&nbsp;&nbsp;<span className="text-white/60">*</span>&nbsp;&nbsp;&nbsp;<span className="text-[#FF6B00]">✶</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
                  <div>│&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white/60">.</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white/60">.</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
                  <div>│&nbsp;&nbsp;&nbsp;<span className="text-[#FF6B00]">✶</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white/60">*</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#FF6B00]">✶</span>&nbsp;&nbsp;&nbsp;│</div>
                  <div>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
                  <div>└─────────────────────────┘</div>
                </div>
              </div>
            </motion.div>

            {/* OUTPUT - Right */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="absolute right-0 top-16 w-[300px] bg-black border border-white/10 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
                  <span className="text-[10px] text-white/60 tracking-widest mx-2 font-bold">CONTRIBUTIONS</span>
                  <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
                </div>
              </div>
              <div className="p-4 font-mono text-[11px] space-y-2">
                {outputLines.map((line, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 + i * 0.1 }}
                  >
                    <span className="text-white/40 w-10">{line.year}</span>
                    <div className="flex-1 flex items-center gap-0.5">
                      {Array.from({ length: line.bars }).map((_, j) => (
                        <div 
                          key={j} 
                          className="w-1.5 h-3"
                          style={{ backgroundColor: line.color, opacity: line.color === '#FF6B00' ? 1 : 0.4 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ASCII Decorations */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ delay: 1.5 }}
              className="absolute left-[30%] top-[60%] font-mono text-[10px] text-white/40"
            >
              ].....[<br />
              ].....[<br />
              ].....[
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ delay: 1.6 }}
              className="absolute right-[25%] top-[70%] font-mono text-[10px] text-white/40"
            >
              . ✶ . ✶ .<br />
              ✶ . ✶ . ✶<br />
              . ✶ . ✶ .
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* FEATURES SECTION */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section id="features" className="relative z-10 py-32 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <span className="text-[11px] text-[#FF6B00] tracking-[0.4em] uppercase mb-4 block">FEATURES</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                BUILT FOR <span className="text-[#FF6B00]">DEVELOPERS</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "◈",
                  title: "SKILL MATCHING",
                  description: "Our AI analyzes your programming skills and experience level to find repositories that match your expertise."
                },
                {
                  icon: "◇",
                  title: "ISSUE RANKING",
                  description: "Smart ranking system prioritizes beginner-friendly issues based on complexity, documentation, and community support."
                },
                {
                  icon: "◆",
                  title: "PROGRESS TRACKING",
                  description: "Track your contributions, earn XP, and level up as you grow from first-timer to experienced contributor."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`
                    relative p-8 border transition-all duration-500 cursor-default
                    ${hoveredFeature === i 
                      ? 'border-[#FF6B00]/50 bg-[#FF6B00]/5' 
                      : 'border-white/10 bg-white/[0.01] hover:border-white/20'}
                  `}
                >
                  {hoveredFeature === i && (
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#FF6B00]" />
                  )}
                  <span className="text-3xl text-[#FF6B00]/60 mb-6 block">{feature.icon}</span>
                  <h3 className="text-lg font-bold tracking-widest mb-4 text-white/90">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="relative z-10 py-32 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <span className="text-[11px] text-[#FF6B00] tracking-[0.4em] uppercase mb-4 block">PROCESS</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                THREE STEPS TO <span className="text-[#FF6B00]">CONTRIBUTE</span>
              </h2>
            </motion.div>

            <div className="space-y-0">
              {[
                { step: "01", title: "SET YOUR PREFERENCES", desc: "Tell us your skills, languages, and interests. Our AI learns what you're looking for." },
                { step: "02", title: "GET MATCHED", desc: "Receive personalized repository recommendations with beginner-friendly issues." },
                { step: "03", title: "START CONTRIBUTING", desc: "Pick an issue, make your first PR, and begin your open source journey." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-8 py-12 border-b border-white/5 last:border-0"
                >
                  <span className="text-5xl font-bold text-[#FF6B00]/20 tabular-nums">{item.step}</span>
                  <div>
                    <h3 className="text-xl font-bold tracking-widest mb-3 text-white/90">{item.title}</h3>
                    <p className="text-white/50 leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* CTA SECTION */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section className="relative z-10 py-32 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                READY TO <span className="text-[#FF6B00]">BEGIN</span>?
              </h2>
              <p className="text-white/50 text-lg mb-12 max-w-xl mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Join thousands of developers finding their perfect first contribution.
              </p>
              <button 
                onClick={() => navigate("/onboarding")}
                className="group relative bg-[#FF6B00] text-black px-12 py-5 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[#FF8533] transition-all duration-300"
              >
                <span className="relative z-10">GET STARTED FREE</span>
              </button>
          </motion.div>
        </div>
        </section>
      </main>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-[#FF6B00] flex items-center justify-center">
              <span className="text-black font-black text-xs">Q</span>
            </div>
            <span className="text-white/40 text-sm">© 2024 OpenQuest. Open Source.</span>
          </div>
          <div className="flex items-center gap-8 text-[11px] text-white/40 tracking-widest uppercase">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Community</a>
          </div>
          <div className="text-white/20 text-xs tracking-[0.3em]">✶✶✶</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
