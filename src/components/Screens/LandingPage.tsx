import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Star, Globe, Menu, X } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

// ============================================================================
// REACTBITS ANIMATION ENGINE COMPONENTS
// ============================================================================

// 1. Click Spark Particle Effect
function ClickSpark() {
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>(
    [],
  );
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const id = Date.now() + Math.random();
      setSparks((prev) => [
        ...prev.slice(-15),
        { id, x: e.clientX, y: e.clientY },
      ]);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {sparks.map((spark) => (
        <motion.div
          key={spark.id}
          initial={{ opacity: 1, scale: 0.5 }}
          animate={{ opacity: 0, scale: 2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ left: spark.x - 20, top: spark.y - 20 }}
          className="absolute w-10 h-10 flex items-center justify-center"
        >
          <div className="absolute w-0.5 h-6 bg-[#ff90e8]" />
          <div className="absolute w-6 h-0.5 bg-[#8ce9ff]" />
          <div className="absolute w-3.5 h-3.5 rotate-45 border border-[#a3e635] stroke-[2]" />
        </motion.div>
      ))}
    </div>
  );
}

// 2. Decrypted Text Effect
function DecryptedText({ text = "", className = "" }) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

  useEffect(() => {
    if (!isHovered) {
      setDisplayText(text);
      return;
    }
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iterations) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join(""),
      );
      iterations += 1;
      if (iterations >= text.length) {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [isHovered, text]);

  return (
    <span
      className={`font-mono transition-colors duration-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayText}
    </span>
  );
}

// 3. Shiny Text Effect
function ShinyText({ text = "", className = "" }) {
  return (
    <span
      className={`relative inline-block overflow-hidden bg-clip-text text-transparent bg-gradient-to-r from-black via-zinc-400 to-black bg-[length:200%_auto] ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(120deg, #000 30%, #a1a1aa 50%, #000 70%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 3s linear infinite",
      }}
    >
      {text}
    </span>
  );
}

// 4. True Focus Effect
function TrueFocus({ sentence = "", className = "" }) {
  const words = sentence.split(" ");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <span className={`inline-flex flex-wrap gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          className={`transition-all duration-300 cursor-pointer ${
            hoveredIdx !== null && hoveredIdx !== i
              ? "blur-[3px] opacity-35 scale-95"
              : "blur-0 opacity-100 scale-100"
          }`}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

// 4.5. Tilted Card (Interactive 3D Glare Card)
interface TiltedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  bg?: string;
}

function TiltedCard({
  children,
  className = "",
  bg = "bg-white",
  ...props
}: TiltedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = containerRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = -((y - rect.height / 2) / rect.height) * 8;
    const rotateY = ((x - rect.width / 2) / rect.width) * 8;
    setRotate({ x: rotateX, y: rotateY });

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlare({ x: glareX, y: glareY, opacity: 0.25 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`border-2 border-black rounded-[32px] p-6 shadow-[6px_6px_0px_#000] transition-shadow duration-300 relative overflow-hidden select-none ${bg} ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: "transform 0.15s ease-out, shadow 0.15s ease-out",
      }}
      {...props}
    >
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          opacity: glare.opacity,
        }}
      />
      <div className="relative z-20">{children}</div>
    </div>
  );
}

// 5. Spotlight Card
interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  key?: React.Key;
}

function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(163, 230, 53, 0.12)",
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden border-2 border-black rounded-3xl p-6 bg-white shadow-[5px_5px_0px_#000] ${className}`}
      {...props}
    >
      {isFocused && (
        <div
          className="absolute pointer-events-none rounded-full w-72 h-72 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
          style={{
            left: coords.x,
            top: coords.y,
            background: `radial-gradient(circle, ${spotlightColor} 0%, transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

// 6. Star Border Button Wrapper
interface StarBorderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function StarBorderButton({
  children,
  onClick,
  className = "",
}: StarBorderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative group overflow-hidden rounded-xl border-2 border-black p-0.5 bg-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#ffd43f] via-[#ff90e8] to-[#8ce9ff] animate-spin [animation-duration:5s] opacity-80 group-hover:opacity-100" />
      <div className="relative bg-white text-black font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-[10px] z-10 transition-colors group-hover:bg-[#a3e635]">
        {children}
      </div>
    </button>
  );
}

// 7. Count Up Dynamic Numbers
function CountUp({
  end = 100,
  duration = 1.5,
  delay = 0,
  prefix = "",
  suffix = "",
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min(
        (timestamp - startTimestamp) / (duration * 1000),
        1,
      );
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    const timer = setTimeout(() => {
      window.requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [end, duration, delay]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// 8. Interactive Dot Field Background
interface Dot {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
}

function InteractiveDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Dot[] = [];
    const spacing = 45; // Dot density spacing
    const attractionRadius = 140;
    const ease = 0.08;
    const force = 0.15; // Subtle magnetic force

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots();
    };

    const initDots = () => {
      dots = [];
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing + spacing / 2;
          const y = r * spacing + spacing / 2;
          dots.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    resizeCanvas();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        let dx = 0;
        let dy = 0;

        if (mouse.active) {
          const mdx = mouse.x - dot.x;
          const mdy = mouse.y - dot.y;
          const distance = Math.sqrt(mdx * mdx + mdy * mdy);

          if (distance < attractionRadius) {
            // Magnetic attraction/displacement: Pull dots slightly towards cursor
            const factor = (attractionRadius - distance) / attractionRadius;
            dx = mdx * factor * force;
            dy = mdy * factor * force;
          }
        }

        // Target position
        const targetX = dot.originX + dx;
        const targetY = dot.originY + dy;

        // Smooth physics interpolation
        dot.vx += (targetX - dot.x) * ease;
        dot.vy += (targetY - dot.y) * ease;
        dot.vx *= 0.82; // Friction
        dot.vy *= 0.82;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Draw dot (subtle slate-black color with very low opacity)
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}

// ============================================================================
// PREMIUM FALLBACK IMAGE ENGINE
// ============================================================================

interface PremiumImageProps {
  src: string;
  alt: string;
  className?: string;
  type?: "ferrari" | "porsche" | "rivian" | "tech" | "dashboard";
}

function PremiumImage({
  src,
  alt,
  className = "",
  type = "tech",
}: PremiumImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const renderFallbackSvg = () => {
    switch (type) {
      case "ferrari":
        return (
          <svg
            viewBox="0 0 200 100"
            className="w-full h-full p-6 bg-[#fff8ec] stroke-black stroke-[2] fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="200" height="100" rx="12" fill="#fff8ec" />
            <path
              d="M20 70 C 40 70, 50 45, 80 45 L 140 45 C 160 45, 170 55, 180 70 Z"
              fill="#ef4444"
              className="fill-red-600"
            />
            <line x1="20" y1="70" x2="180" y2="70" />
            <circle cx="55" cy="70" r="14" fill="#ffd43f" />
            <circle cx="55" cy="70" r="6" fill="#000" />
            <circle cx="145" cy="70" r="14" fill="#ffd43f" />
            <circle cx="145" cy="70" r="6" fill="#000" />
            <path d="M90 48 L 130 48 M 100 56 L 120 56" />
            <text
              x="10"
              y="25"
              className="font-mono text-[9px] font-black fill-black tracking-widest"
            >
              FERRARI SCHEMA
            </text>
          </svg>
        );
      case "porsche":
        return (
          <svg
            viewBox="0 0 200 100"
            className="w-full h-full p-6 bg-[#f5f5f5] stroke-black stroke-[2] fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="200" height="100" rx="12" fill="#f5f5f5" />
            <path
              d="M15 68 C 30 68, 45 42, 75 42 L 150 42 C 165 42, 175 52, 185 68 Z"
              fill="#71717a"
              className="fill-zinc-500"
            />
            <line x1="15" y1="68" x2="185" y2="68" />
            <circle cx="50" cy="68" r="14" fill="#ff90e8" />
            <circle cx="50" cy="68" r="6" fill="#000" />
            <circle cx="150" cy="68" r="14" fill="#ff90e8" />
            <circle cx="150" cy="68" r="6" fill="#000" />
            <path d="M100 45 L 140 45 M 105 52 L 130 52" />
            <text
              x="10"
              y="25"
              className="font-mono text-[9px] font-black fill-black tracking-widest"
            >
              PORSCHE SCHEMA
            </text>
          </svg>
        );
      case "rivian":
        return (
          <svg
            viewBox="0 0 200 100"
            className="w-full h-full p-6 bg-[#f0f9ff] stroke-black stroke-[2] fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="200" height="100" rx="12" fill="#f0f9ff" />
            <rect
              x="25"
              y="40"
              width="150"
              height="28"
              rx="6"
              fill="#0d9488"
              className="fill-teal-600"
            />
            <line x1="20" y1="68" x2="180" y2="68" />
            <circle cx="55" cy="68" r="14" fill="#a3e635" />
            <circle cx="55" cy="68" r="6" fill="#000" />
            <circle cx="145" cy="68" r="14" fill="#a3e635" />
            <circle cx="145" cy="68" r="6" fill="#000" />
            <text
              x="10"
              y="25"
              className="font-mono text-[9px] font-black fill-black tracking-widest"
            >
              RIVIAN SCHEMA
            </text>
          </svg>
        );
      case "dashboard":
        return (
          <svg
            viewBox="0 0 200 120"
            className="w-full h-full p-6 bg-[#fffaf5] stroke-black stroke-[2] fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="200" height="120" rx="16" fill="#fffaf5" />
            <circle cx="100" cy="70" r="40" strokeDasharray="5 3" />
            <line
              x1="100"
              y1="70"
              x2="130"
              y2="45"
              className="stroke-red-600 stroke-[3]"
            />
            <circle cx="100" cy="70" r="6" fill="#000" />
            <path d="M20 110 L 180 110" />
            <path d="M40 30 L 60 30 M 140 30 L 160 30" />
            <text
              x="15"
              y="22"
              className="font-mono text-[8px] font-black fill-black tracking-widest"
            >
              LIDAR CALIBRATION
            </text>
          </svg>
        );
      case "tech":
      default:
        return (
          <svg
            viewBox="0 0 200 120"
            className="w-full h-full p-6 bg-[#fdfdfd] stroke-black stroke-[2] fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="200" height="120" rx="16" fill="#fdfdfd" />
            <path d="M20 20 L 180 20 L 180 100 L 20 100 Z" />
            <line x1="20" y1="60" x2="180" y2="60" strokeDasharray="4 4" />
            <line x1="100" y1="20" x2="100" y2="100" strokeDasharray="4 4" />
            <circle cx="100" cy="60" r="24" className="fill-[#ffd43f]/20" />
            <text
              x="25"
              y="15"
              className="font-mono text-[8px] font-black fill-black tracking-widest"
            >
              METRIC RADAR SYSTEM
            </text>
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative w-full h-full bg-[#fcf9f2] overflow-hidden flex items-center justify-center ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      {!loaded && !error && (
        <div className="absolute inset-0 bg-[#fff8ec] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-[9px] font-black uppercase tracking-widest">
              LOADING OPTICS...
            </span>
          </div>
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 w-full h-full">
          {renderFallbackSvg()}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover object-center transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

// ============================================================================
// INTERACTIVE DEPOT TELEMETRY SIMULATOR
// ============================================================================

interface DepotSimulatorProps {
  language: string;
}

function DepotSimulator({ language }: DepotSimulatorProps) {
  const [activeCar, setActiveCar] = useState<"ferrari" | "porsche" | "rivian">("ferrari");
  const [simState, setSimState] = useState<"idle" | "scanning" | "calibrating" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [gateStatus, setGateStatus] = useState<"LOCKED" | "RELEASING" | "OPEN">("LOCKED");
  const [targetLimit, setTargetLimit] = useState(0);

  const vehicleImages = {
    ferrari: "https://i.pinimg.com/1200x/a4/c0/ac/a4c0ac666836ed49bd0374db80cfca34.jpg",
    porsche: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
    rivian: "https://i.pinimg.com/1200x/fa/be/cd/fabecd19f39018460d1c7452bdaced55.jpg"
  };

  const simDict = {
    en: {
      title: "LIVE DEPOT TELEMETRY SIMULATOR",
      subtitle: "Test our automated edge calibration ledger in real-time.",
      selectCar: "Select Vehicle Type",
      startBtn: "Initialize Secure Handshake",
      resetBtn: "Reset Simulator Node",
      scanning: "SCANNING VEHICLE CHASSIS...",
      calibrating: "CALIBRATING TELEMETRY LIMITS...",
      gateStatus: "GATE BARRIER STATUS",
      sysLogs: "System Operations Live Feed",
      locked: "LOCKED",
      releasing: "RELEASING...",
      open: "GATE RELEASED",
      ready: "SIMULATOR READY",
      done: "CYCLE COMPLETE",
      aligned: "ALIGNED"
    },
    id: {
      title: "SIMULATOR TELEMETRI DEPOT UTAMA",
      subtitle: "Uji coba otomatisasi ledger kalibrasi edge kami secara real-time.",
      selectCar: "Pilih Jenis Kendaraan",
      startBtn: "Mulai Jabat Tangan Sistem",
      resetBtn: "Reset Simulator Node",
      scanning: "MEMINDAI CASIS KENDARAAN...",
      calibrating: "KALIBRASI BATAS TELEMETRI...",
      gateStatus: "STATUS PALANG PINTU GERBANG",
      sysLogs: "Log Operasional Sistem Utama",
      locked: "TERKUNCI",
      releasing: "MEMBUKA GERBANG...",
      open: "GERBANG LEPAS / TERBUKA",
      ready: "SIMULATOR SIAP",
      done: "SIKLUS SELESAI",
      aligned: "TERSELARAS"
    }
  }[language === "id" ? "id" : "en"];

  const startSimulation = () => {
    if (simState !== "idle") return;
    
    setSimState("scanning");
    setGateStatus("LOCKED");
    setProgress(0);
    
    const limit = activeCar === "ferrari" ? 100 : activeCar === "porsche" ? 98.5 : 95.0;
    setTargetLimit(limit);

    const logLines = language === "id" ? [
      "[0.00s] 🟢 MEMULAI JABAT TANGAN JARINGAN DEPOT...",
      "[0.40s] 🛰️ MENGAKTIFKAN PEMINDAI POSISI SENSOR LIDAR...",
      "[1.00s] 🚗 KENDARAAN TERDETEKSI: " + activeCar.toUpperCase() + " GT",
      "[1.60s] 🔐 MELAKUKAN OTORISASI LEDGER KE SUPABASE RLS...",
      "[2.40s] ⚡ MENYINKRONKAN DATA KALIBRASI TELEMETRI...",
      "[3.20s] 🔓 OTORISASI BERHASIL: MELEPAS KUNCI GERBANG...",
      "[4.00s] ✅ OPERASI SELESAI. KENDARAAN DAPAT MELAJU AMAN!"
    ] : [
      "[0.00s] 🟢 INITIATING SYSTEM HANDSHAKE...",
      "[0.40s] 🛰️ ACTIVATE LIDAR POSITION SCANNER...",
      "[1.00s] 🚗 VEHICLE IDENTIFIED: " + activeCar.toUpperCase() + " GT",
      "[1.60s] 🔐 AUTHORIZING SECURE LEDGER VIA SUPABASE RLS...",
      "[2.40s] ⚡ SYNCHRONIZING REAL-TIME TELEMETRY DATA...",
      "[3.20s] 🔓 AUTHENTICATED: RELEASING GATE BARRIER...",
      "[4.00s] ✅ CORE CYCLE RESOLVED. SAFE VEHICLE DISPATCH!"
    ];

    setLogs([logLines[0], logLines[1]]);

    // Step 2: Car Detected (1000ms)
    setTimeout(() => {
      setLogs(prev => [...prev, logLines[2]]);
      setProgress(25);
    }, 1000);

    // Step 3: Auth Ledger (1800ms)
    setTimeout(() => {
      setSimState("calibrating");
      setLogs(prev => [...prev, logLines[3]]);
      setProgress(50);
    }, 1800);

    // Step 4: Calibrating progress sync (2600ms)
    setTimeout(() => {
      setLogs(prev => [...prev, logLines[4]]);
      let currentProgress = 50;
      const interval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress >= limit) {
          clearInterval(interval);
          setProgress(limit);
        } else {
          setProgress(Math.floor(currentProgress));
        }
      }, 50);
    }, 2600);

    // Step 5: Gate Release (3400ms)
    setTimeout(() => {
      setGateStatus("RELEASING");
      setLogs(prev => [...prev, logLines[5]]);
      setTimeout(() => {
        setGateStatus("OPEN");
      }, 4000);
    }, 3400);

    // Step 6: Complete (4200ms)
    setTimeout(() => {
      setSimState("complete");
      setLogs(prev => [...prev, logLines[6]]);
    }, 4200);
  };

  const resetSimulator = () => {
    setSimState("idle");
    setProgress(0);
    setLogs([]);
    setGateStatus("LOCKED");
  };

  return (
    <div className="bg-white border-4 border-black rounded-[32px] p-6 sm:p-10 shadow-[10px_10px_0px_#000] relative overflow-hidden text-left">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .laser-sweep-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 4px;
          background: #a3e635;
          box-shadow: 0 0 8px #a3e635, 0 0 15px #a3e635;
          animation: sweep 2s infinite linear;
        }
      `}} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Control Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-black text-[#a3e635] bg-black border-2 border-black rounded-lg px-2.5 py-1 uppercase tracking-widest inline-block shadow-[1.5px_1.5px_0px_#000] mb-3">
              {simState === "idle" ? simDict.ready : simState === "complete" ? simDict.done : simState.toUpperCase()}
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-black leading-tight uppercase">
              {simDict.title}
            </h3>
            <p className="text-xs text-zinc-650 font-bold mt-2">
              {simDict.subtitle}
            </p>
          </div>

          {/* Selector */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
              {simDict.selectCar}
            </span>
            <div className="flex gap-2">
              {(["ferrari", "porsche", "rivian"] as const).map((car) => (
                <button
                  key={car}
                  disabled={simState !== "idle"}
                  onClick={() => setActiveCar(car)}
                  className={`flex-1 py-2 text-center border-2 border-black text-xs font-bold rounded-xl uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] cursor-pointer ${
                    activeCar === car
                      ? "bg-[#ffd43f] text-black shadow-[3px_3px_0px_#000]"
                      : "bg-white text-black hover:bg-zinc-50 disabled:opacity-50"
                  }`}
                >
                  {car}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={startSimulation}
              disabled={simState !== "idle"}
              className="flex-1 py-3 px-4 bg-[#a3e635] text-black hover:bg-lime-400 disabled:bg-zinc-200 border-2 border-black rounded-xl font-bold text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] disabled:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:translate-none transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {simDict.startBtn}
            </button>
            {simState !== "idle" && (
              <button
                onClick={resetSimulator}
                className="py-3 px-4 bg-white text-black hover:bg-zinc-50 border-2 border-black rounded-xl font-bold text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right Dashboard Visualization */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card Image Scanning Display */}
          <div className="bg-[#fff8ec] border-2 border-black rounded-2xl p-4 flex flex-col justify-between relative shadow-[4px_4px_0px_#000] overflow-hidden min-h-[220px]">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              LIDAR SCANNER OPTICS
            </span>
            <div className="w-full flex-1 aspect-[16/10] border-2 border-black rounded-xl overflow-hidden relative shadow-[2px_2px_0px_#000]">
              <img
                src={vehicleImages[activeCar]}
                alt="Simulated luxury vehicle scan"
                className="w-full h-full object-cover"
              />
              {/* Sliding scanning line when active */}
              {simState === "scanning" && <div className="laser-sweep-line" />}
              {simState === "scanning" && (
                <div className="absolute inset-0 bg-[#a3e635]/15 flex items-center justify-center">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[#a3e635] bg-black/80 px-2.5 py-1 border-2 border-black rounded-lg animate-pulse shadow-md">
                    {simDict.scanning}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Telemetry LEDGER Status Panel */}
          <div className="flex flex-col gap-4">
            {/* Progress Telemetry */}
            <div className="bg-[#fff8ec] border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] flex flex-col justify-between flex-1">
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                  TELEMETRY CAPACITY SYNC
                </span>
                <span className="font-display font-black text-3xl text-black block mt-2">
                  {progress}% <span className="text-xs text-zinc-500 font-mono tracking-normal">{simState === "calibrating" ? simDict.calibrating : simDict.aligned}</span>
                </span>
              </div>
              <div className="w-full bg-zinc-200 h-4 border-2 border-black rounded-full overflow-hidden mt-3 relative shadow-[1px_1px_0px_#000]">
                <div
                  className="bg-[#ffd43f] h-full border-r-2 border-black transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Gate Status Panel */}
            <div className={`border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] flex flex-col justify-between flex-1 transition-all duration-300 ${
              gateStatus === "OPEN" ? "bg-lime-50" : gateStatus === "RELEASING" ? "bg-amber-50" : "bg-red-50/50"
            }`}>
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                  {simDict.gateStatus}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-black shadow-[1px_1px_0px_#000] ${
                    gateStatus === "OPEN" ? "bg-[#a3e635] animate-ping" : gateStatus === "RELEASING" ? "bg-[#ffd43f] animate-pulse" : "bg-red-600"
                  }`} />
                  <span className="font-display font-black text-sm uppercase text-black">
                    {gateStatus === "OPEN" ? simDict.open : gateStatus === "RELEASING" ? simDict.releasing : simDict.locked}
                  </span>
                </div>
              </div>
              <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-2">
                ACTIVE_NODE: GATE_BARRIER_OS
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Console Terminal */}
        <div className="lg:col-span-12">
          <div className="bg-black text-[#a3e635] font-mono text-[9px] sm:text-xs border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_#000] min-h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
              <span className="font-bold tracking-widest uppercase">
                ⚙️ {simDict.sysLogs}
              </span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[100px] text-left">
              {logs.length === 0 ? (
                <div className="text-zinc-500 italic">
                  [SYSTEM IDLE] Waiting for jabat tangan handshake link...
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE SCREEN COMPONENT
// ============================================================================

export function LandingPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useTranslation();

  // Scroll logic
  const [scrollY, setScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Vehicle Selection
  const [selectedVehicle, setSelectedVehicle] = useState<
    "ferrari" | "porsche" | "rivian"
  >("ferrari");

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);
      if (currentScroll > lastScrollY && currentScroll > 80) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScroll);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Dictionary translations
  const dict = {
    en: {
      navSignIn: "Sign In",
      navLaunch: "Launch App",
      badgeText: "★ THE FUTURE OF HIGH-PERFORMANCE DEPOT OS ★",
      heroSub:
        "Experience next-generation mechanical depot calibrations. Authenticate vehicles instantly, synchronize telemetry limits, and release optical gate barriers automatically.",
      ctaLaunch: "Launch Apparatus",
      ctaSpecs: "Read Blueprints",
      driverLogsTitle: "Operational Dispatch Logs",
      ctaHeadline: "READY TO INITIALIZE YOUR DEPOT CORE?",
      ctaSubText:
        "Establish a zero-cost terminal handshake link. Instant secure deployment.",
      footerText:
        "SFRT - SMART FUEL REFUELLING TECHNOLOGY. EXPERIMENTAL AUTOMOTIVE PORTFOLIO.",
    },
    id: {
      navSignIn: "Masuk",
      navLaunch: "Luncurkan Portal",
      badgeText: "★ DEPO PENGISIAN MOBILITAS MASA DEPAN ★",
      heroSub:
        "Rasakan masa depan stasiun pengisian otomatis. Validasi identitas kendaraan, kalibrasi sensor, dan lepaskan penghalang gerbang tanpa operator.",
      ctaLaunch: "Luncurkan Portal",
      ctaSpecs: "Lihat Cetak Biru",
      driverLogsTitle: "Log Operasional Pengemudi",
      ctaHeadline: "SIAP MEMULAI INTEGRASI DEPOT ANDA?",
      ctaSubText:
        "Mulai koneksi jabat tangan terminal aman. Proses otorisasi instan.",
      footerText:
        "SFRT - SMART FUEL REFUELLING TECHNOLOGY. PORTOFOLIO MOBILITAS FUTURISTIK.",
    },
  }[language === "id" ? "id" : "en"];

  const vehicleImages = {
    ferrari:
      "https://images.unsplash.com/photo-1592853625527-7c1fe89156e0?auto=format&fit=crop&w=1000&q=80",
    porsche:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80",
    rivian:
      "https://images.unsplash.com/photo-1605558158359-e85790d1f63d?auto=format&fit=crop&w=1000&q=80",
  };

  const testimonials = [
    {
      name: "Arya Wijaya",
      role: "Logistics Lead",
      text: "RFID auth validation speed beats traditional cashier handshakes by 98%. System is extremely clean.",
      avatar: "Y",
      color: "bg-[#ffd43f]/10",
    },
    {
      name: "Clara Setyo",
      role: "EV Fleet Dispatcher",
      text: "Dynamic DC charging and RON metering calibration in a unified screen. Aesthetic feels premium.",
      avatar: "N",
      color: "bg-[#ff90e8]/10",
    },
    {
      name: "Marcus Aurelius",
      role: "Tesla Model S Fleet",
      text: "Zero manual intervention. Access barrier opens automatically on plate scan verification.",
      avatar: "R",
      color: "bg-[#8ce9ff]/10",
    },
    {
      name: "Nabila Putri",
      role: "Cargo Dispatch Manager",
      text: "LIDAR sweeps avoid nozzle friction. Truly zero-maintenance depot architecture.",
      avatar: "D",
      color: "bg-[#a3e635]/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-black overflow-x-hidden font-sans relative selection:bg-black selection:text-white">
      {/* Click Spark Overlay (Active Sparking wherever the user clicks) */}
      <ClickSpark />

      {/* Interactive cursor-reactive particle field background */}
      <InteractiveDotField />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.25]">
        <motion.div
          animate={{
            scale: [1, 1.15, 0.95, 1],
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[8%] left-[5%] w-[450px] h-[450px] bg-[#ff90e8]/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 0.9, 1.1, 1],
            x: [0, -30, 20, 0],
            y: [0, 20, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[15%] right-[5%] w-[500px] h-[500px] bg-[#8ce9ff]/30 rounded-full blur-[110px]"
        />
      </div>

      {/* FLOATING HEADER NAVBAR */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 20
            ? "py-3 px-6 md:px-12 bg-white/95 backdrop-blur-md border-b-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.1)]"
            : "py-6 px-6 md:px-12 bg-transparent border-b-2 border-transparent"
        }`}
      >
        <div className="max-w-[1300px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border-2 border-black rounded-xl flex items-center justify-center font-display font-black text-white text-lg shadow-[2px_2px_0px_rgba(0,0,0,0.25)]">
              SF
            </div>
            <div className="text-left font-black tracking-wide text-black uppercase leading-none">
              <span className="font-display text-base block">SFRT</span>
              <span className="text-[7px] block tracking-widest text-zinc-555 mt-1">
                Autonomous Systems
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="flex items-center gap-2 text-xs font-bold uppercase text-black hover:bg-zinc-100 border-2 border-black px-4 py-2 rounded-xl bg-white shadow-[2px_2px_0px_#000] cursor-pointer transition-all"
            >
              <Globe className="w-4 h-4 text-black" />
              {language === "id" ? "English" : "Bahasa"}
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="text-xs font-bold uppercase text-black hover:underline tracking-widest cursor-pointer"
            >
              {dict.navSignIn}
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="py-3 px-6 bg-[#a3e635] text-black hover:bg-lime-400 font-bold text-xs border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 tracking-wider transition-all uppercase cursor-pointer"
            >
              {dict.navLaunch}
            </button>
          </div>

          {/* Mobile menu triggers */}
          <div className="flex md:hidden items-center gap-2.5">
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="w-9 h-9 rounded-xl border-2 border-black bg-white flex items-center justify-center text-black font-bold shadow-[2px_2px_0px_#000]"
            >
              <Globe className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl border-2 border-black bg-white flex items-center justify-center text-black shadow-[2px_2px_0px_#000]"
            >
              {mobileMenuOpen ? (
                <X className="w-4.5 h-4.5" />
              ) : (
                <Menu className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[72px] z-40 bg-[#fffaf5] border-b-2 border-black p-6 flex flex-col gap-4 shadow-xl md:hidden text-left"
          >
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/auth");
              }}
              className="w-full py-3.5 text-center border-2 border-black bg-white text-black text-xs font-bold rounded-xl uppercase tracking-widest shadow-[3px_3px_0px_#000]"
            >
              {dict.navSignIn}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/auth");
              }}
              className="w-full py-3.5 text-center bg-[#a3e635] border-2 border-black text-black text-xs font-bold rounded-xl shadow-[3px_3px_0px_#000] uppercase tracking-widest"
            >
              {dict.navLaunch}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="max-w-[1300px] mx-auto px-6 pt-28 md:pt-40 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
        {/* Left Editorial Text Column */}
        <div className="lg:col-span-6 text-left space-y-8">
          <div className="inline-flex items-center gap-2.5 bg-[#ffd43f] border-2 border-black px-4 py-2 rounded-2xl text-[9px] font-black tracking-widest text-black uppercase shadow-[2.5px_2.5px_0px_#000]">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            {/* ReactBits: ShinyText integrated on high performance badge banner */}
            <ShinyText
              text={dict.badgeText}
              className="font-mono text-[9px] font-black"
            />
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] text-black">
              <span className="block">THE FUTURE OF</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-600">
                REFUELING.
              </span>
            </h1>
            <p className="font-sans text-xs sm:text-sm md:text-base text-zinc-700 leading-relaxed max-w-lg font-medium">
              {dict.heroSub}
            </p>
          </div>

          {/* Action CTAs: Star Border custom button wrapper */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <StarBorderButton onClick={() => navigate("/auth")}>
              <span className="flex items-center gap-2">
                {dict.ctaLaunch}
                <ArrowRight className="w-4 h-4" />
              </span>
            </StarBorderButton>

            <a
              href="#story-anchor"
              className="py-4 px-8 bg-white border-2 border-black text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 tracking-wider uppercase transition-all"
            >
              {dict.ctaSpecs}
            </a>
          </div>
        </div>

        {/* Right Columns: Giant Supercar Image Collage Layout */}
        <div className="lg:col-span-6 relative w-full flex items-center justify-center pt-8 lg:pt-0">
          <TiltedCard
            className="w-full max-w-[500px] bg-white relative z-10"
            bg="bg-white"
          >
            {/* Paint Selector Controls */}
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-4 mb-4">
              {/* ReactBits: DecryptedText on Active Depot Selection Header */}
              <span className="font-mono text-[10px] font-bold text-zinc-550 uppercase tracking-widest cursor-pointer">
                <DecryptedText text="ACTIVE DEPOT CONFIG" />
              </span>
              <div className="flex gap-2">
                {[
                  { id: "ferrari", code: "bg-red-600" },
                  { id: "porsche", code: "bg-zinc-400" },
                  { id: "rivian", code: "bg-teal-600" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedVehicle(item.id as any)}
                    className={`w-5.5 h-5.5 rounded-full border-2 border-black cursor-pointer shadow-[1.5px_1.5px_0px_#000] transition-all hover:scale-110 ${item.code} ${
                      selectedVehicle === item.id
                        ? "ring-2 ring-black ring-offset-2"
                        : ""
                    }`}
                    aria-label={`Select ${item.id}`}
                  />
                ))}
              </div>
            </div>

            {/* High-End Supercar Real Image Composition with Fallback Support */}
            <div className="w-full aspect-[16/10] border-2 border-black rounded-2xl overflow-hidden relative shadow-[3px_3px_0px_#000]">
              <PremiumImage
                src={vehicleImages[selectedVehicle]}
                alt={`${selectedVehicle} luxury automotive`}
                type={selectedVehicle}
                className="w-full h-full"
              />
              <div className="absolute top-3 left-3 bg-[#a3e635] border-2 border-black rounded-lg px-2.5 py-1 text-[8px] font-black uppercase shadow-[1.5px_1.5px_0px_#000]">
                ACTIVE_NODE
              </div>
            </div>

            {/* Telemetry metrics overlays */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#fff8ec] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000] text-left">
                <span className="font-mono text-[8px] text-zinc-500 block uppercase tracking-wider">
                  Identified chassis
                </span>
                <span className="font-display font-black text-xs text-black block mt-1 uppercase">
                  {selectedVehicle} GT
                </span>
              </div>
              <div className="bg-[#fff8ec] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000] text-left">
                <span className="font-mono text-[8px] text-zinc-500 block uppercase tracking-wider">
                  Refuel target limit
                </span>
                {/* ReactBits: CountUp animation for refueling limit */}
                <span className="font-display font-black text-xs text-black block mt-1">
                  <CountUp end={98} suffix=".5% ALIGNED" />
                </span>
              </div>
            </div>
          </TiltedCard>

        </div>
      </section>

      {/* PREMIUM HORIZONTAL SCROLL LIST OF CAR BRANDS (INFINITE AUTOMATED MARQUEE) */}
      <section className="py-6 border-y-2 border-black bg-white overflow-hidden relative z-10">
        <div className="relative w-full flex overflow-x-hidden select-none">
          {/* Shadow overlays for a premium editorial fade effect */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

          <div className="marquee-track flex gap-5 py-4 px-2">
            {[
              "ASTON MARTIN",
              "LAMBORGHINI",
              "MERCEDES BENZ",
              "ROLLS ROYCE",
              "FERRARI",
              "TESLA",
              "RIVIAN",
              "PORSCHE",
            ].concat([
              "ASTON MARTIN",
              "LAMBORGHINI",
              "MERCEDES BENZ",
              "ROLLS ROYCE",
              "FERRARI",
              "TESLA",
              "RIVIAN",
              "PORSCHE",
            ]).map((brand, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center h-[90px] min-w-[280px] px-8 flex-shrink-0 whitespace-nowrap bg-[#ffd43f] border-4 border-black rounded-2xl font-black uppercase text-sm sm:text-base tracking-widest shadow-[4px_4px_0px_#000] transition-all duration-300 hover:scale-105 hover:shadow-[8px_8px_0px_#000] cursor-pointer"
              >
                ★ {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL STORYTELLING SECTIONS */}
      <section
        className="max-w-[1300px] mx-auto px-6 py-20 space-y-24 relative z-10"
        id="story-anchor"
      >
        {/* Story Section 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 relative">
            <div className="border-2 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_#000] aspect-[16/10] bg-white">
              <PremiumImage
                src="https://images.unsplash.com/photo-1592853625527-7c1fe89156e0?auto=format&fit=crop&w=1200&q=80"
                alt="Ferrari calibration showcase"
                type="ferrari"
                className="w-full h-full"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#a3e635] border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] text-left">
              <span className="text-[8px] font-mono text-black uppercase block tracking-wider">
                LIDAR Scan speed
              </span>
              <span className="text-xs font-black text-black block mt-0.5">
                0.12s RESPONSE
              </span>
            </div>
          </div>
          <div className="lg:col-span-6 text-left space-y-5 lg:pl-4">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">
              01 / CALIBRATION LOGIC
            </span>
            {/* ReactBits: TrueFocus implemented in Section 1 Heading */}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1] text-black">
              <TrueFocus sentence="MILLIMETRIC LASER GUIDANCE SYSTEM" />
            </h2>
            <p className="font-sans text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
              We leverage custom-tuned LIDAR positioning sweeps that coordinate
              mechanical nozzle entry configurations down to the millimetre.
              Completely contact-free.
            </p>
          </div>
        </div>

        {/* Story Section 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 text-left space-y-5 lg:pr-4 lg:order-1 order-2">
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">
              02 / ROUTING LEDGERS
            </span>
            {/* ReactBits: TrueFocus implemented in Section 2 Heading */}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1] text-black">
              <TrueFocus sentence="AUTONOMOUS GATE AUTHORIZATION PROTOCOL" />
            </h2>
            <p className="font-sans text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
              Secure identity transponders map account credentials directly to
              active RLS database ledgers, releasing optical terminal barrier
              gates automatically under 0.8 seconds.
            </p>
          </div>
          <div className="lg:col-span-6 lg:order-2 order-1 relative">
            <div className="border-2 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_#000] aspect-[16/10] bg-white">
              <PremiumImage
                src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80"
                alt="Autonomous digital map console"
                type="dashboard"
                className="w-full h-full"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#ffd43f] border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] text-left">
              <span className="text-[8px] font-mono text-black uppercase block tracking-wider">
                Gateway latency
              </span>
              <span className="text-xs font-black text-black block mt-0.5">
                0.8s AUTH TIME
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEPOT TELEMETRY SIMULATOR */}
      <section className="max-w-[1300px] mx-auto px-6 py-16 relative z-10 border-t-2 border-black">
        <DepotSimulator language={language} />
      </section>

      {/* PREMIUM TESTIMONIAL GRID (ReactBits SpotlightCard Integrated) */}
      <section className="py-20 border-t-2 border-black bg-white overflow-hidden relative z-10">
        <div className="max-w-[1300px] mx-auto px-6 text-center space-y-3 mb-12">
          <span className="text-[10px] font-bold text-zinc-555 uppercase tracking-widest block">
            System Diagnostics
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-black">
            {dict.driverLogsTitle}
          </h2>
        </div>

        {/* Responsive Grid System using SpotlightCard for an interactive glare/light hover follow effect */}
        <div className="max-w-[1300px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((test, index) => (
              <SpotlightCard
                key={index}
                className={`${test.color} border-2 border-black`}
                spotlightColor="rgba(255, 144, 232, 0.15)"
              >
                <div className="flex flex-col justify-between h-full text-left">
                  <div className="space-y-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-black stroke-black"
                        />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-black leading-relaxed font-bold">
                      "{test.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-black/10 mt-6">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {test.avatar}
                    </div>
                    <div>
                      <span className="text-xs font-black text-black block leading-none">
                        {test.name}
                      </span>
                      <span className="text-[8px] text-zinc-700 block mt-1 leading-none uppercase font-bold tracking-wider">
                        {test.role}
                      </span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION (CTA) */}
      <section className="max-w-[1300px] mx-auto px-6 py-20 text-center relative z-10 border-t-2 border-black">
        <div className="bg-[#fff8ec] border-2 border-black rounded-[32px] p-10 sm:p-16 space-y-6 shadow-[10px_10px_0px_#000] relative overflow-hidden max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,144,232,0.06)_0%,transparent_70%)] pointer-events-none" />

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-black leading-none">
            {dict.ctaHeadline}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-650 leading-relaxed max-w-sm mx-auto font-bold">
            {dict.ctaSubText}
          </p>

          <div className="pt-2">
            <StarBorderButton onClick={() => navigate("/auth")}>
              <span className="flex items-center gap-2">
                {dict.ctaLaunch}
                <ArrowRight className="w-4 h-4" />
              </span>
            </StarBorderButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-2 border-black py-10 relative z-10 text-center select-none bg-white">
        <p className="text-[9px] text-black/75 tracking-wider uppercase font-bold">
          {dict.footerText}
        </p>
      </footer>
    </div>
  );
}
