import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, Zap, Wifi, Shield,
  Droplets, Diamond, TrendingUp, Users, Smartphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { bannerStore, siteSettingsStore, type Banner } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   THEME CONFIG
───────────────────────────────────────────────────────────── */
const THEME: Record<Banner['theme'], {
  bg: string;
  glowBg: string;
  badge: string;
  btn1: string;
  btn2: string;
  particle: string;
}> = {
  pulsa: {
    bg: 'from-emerald-950 via-green-900 to-teal-950',
    glowBg: 'radial-gradient(ellipse 70% 70% at 65% 50%, rgba(52,211,153,0.18) 0%, transparent 70%)',
    badge: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
    btn1: 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950',
    btn2: 'border-white/20 text-white bg-white/10 hover:bg-white/20',
    particle: '#6ee7b7',
  },
  game: {
    bg: 'from-purple-950 via-violet-900 to-indigo-950',
    glowBg: 'radial-gradient(ellipse 70% 70% at 65% 50%, rgba(192,132,252,0.2) 0%, transparent 70%)',
    badge: 'bg-purple-400/20 text-purple-300 border border-purple-400/30',
    btn1: 'bg-purple-400 hover:bg-purple-300 text-purple-950',
    btn2: 'border-white/20 text-white bg-white/10 hover:bg-white/20',
    particle: '#d8b4fe',
  },
  pln: {
    bg: 'from-orange-950 via-amber-900 to-yellow-950',
    glowBg: 'radial-gradient(ellipse 70% 70% at 65% 50%, rgba(251,191,36,0.18) 0%, transparent 70%)',
    badge: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
    btn1: 'bg-amber-400 hover:bg-amber-300 text-amber-950',
    btn2: 'border-white/20 text-white bg-white/10 hover:bg-white/20',
    particle: '#fde68a',
  },
  all: {
    bg: 'from-slate-950 via-teal-950 to-emerald-950',
    glowBg: 'radial-gradient(ellipse 70% 70% at 65% 50%, rgba(45,212,191,0.18) 0%, transparent 70%)',
    badge: 'bg-teal-400/20 text-teal-300 border border-teal-400/30',
    btn1: 'bg-teal-400 hover:bg-teal-300 text-teal-950',
    btn2: 'border-white/20 text-white bg-white/10 hover:bg-white/20',
    particle: '#5eead4',
  },
};

/* ─────────────────────────────────────────────────────────────
   GLASS CARD
───────────────────────────────────────────────────────────── */
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl', className)}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────────────────────── */
const DOTS = [
  { x: '8%',  y: '18%', s: 4, d: 0,   dur: 3.2 },
  { x: '78%', y: '12%', s: 3, d: 0.7, dur: 4.1 },
  { x: '20%', y: '72%', s: 5, d: 1.3, dur: 3.7 },
  { x: '65%', y: '80%', s: 3, d: 2.0, dur: 4.5 },
  { x: '45%', y: '5%',  s: 2, d: 0.4, dur: 3.0 },
  { x: '92%', y: '45%', s: 4, d: 1.8, dur: 4.0 },
  { x: '5%',  y: '55%', s: 3, d: 0.9, dur: 3.5 },
  { x: '55%', y: '90%', s: 2, d: 2.5, dur: 5.0 },
  { x: '35%', y: '30%', s: 2, d: 1.1, dur: 3.8 },
  { x: '85%', y: '62%', s: 3, d: 0.3, dur: 4.2 },
];

function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DOTS.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float opacity-50"
          style={{
            left: p.x, top: p.y,
            width: p.s, height: p.s,
            backgroundColor: color,
            animationDelay: `${p.d}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 1 — PULSA & E-WALLET (green)
───────────────────────────────────────────────────────────── */
const WALLETS = [
  { abbr: 'G', label: 'GoPay',  color: '#22c55e', bg: 'rgba(34,197,94,0.18)',   border: 'rgba(34,197,94,0.35)',   pos: 'top-6 right-6',    delay: '0.5s', dur: '3.5s' },
  { abbr: 'O', label: 'OVO',    color: '#a78bfa', bg: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.35)', pos: 'top-4 left-4',     delay: '1.0s', dur: '4.0s' },
  { abbr: 'D', label: 'DANA',   color: '#60a5fa', bg: 'rgba(96,165,250,0.18)',  border: 'rgba(96,165,250,0.35)',  pos: 'bottom-10 right-4', delay: '1.5s', dur: '3.8s' },
  { abbr: 'S', label: 'SpPay',  color: '#fb923c', bg: 'rgba(251,146,60,0.18)',  border: 'rgba(251,146,60,0.35)',  pos: 'bottom-8 left-6',  delay: '2.0s', dur: '4.2s' },
];
const PHONE_SERVICES = [
  { Icon: Smartphone, color: '#34d399', label: 'Pulsa' },
  { Icon: Wifi,       color: '#60a5fa', label: 'Data'  },
  { Icon: Zap,        color: '#fbbf24', label: 'PLN'   },
  { Icon: Shield,     color: '#f87171', label: 'BPJS'  },
];

function PulsaVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#6ee7b7" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-emerald-400/20 blur-3xl animate-glow-pulse" />
      </div>

      {/* Phone mockup */}
      <div className="relative z-10 animate-float" style={{ animationDuration: '4s' }}>
        <div
          className="w-28 h-52 sm:w-32 sm:h-60 rounded-[2rem] relative overflow-hidden border border-white/10 shadow-2xl"
          style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-4 rounded-b-2xl bg-slate-900 z-10" />
          <div className="absolute inset-0 flex flex-col pt-5 px-2.5 pb-2">
            <div className="rounded-xl p-2 mb-2"
              style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.25), rgba(20,184,166,0.12))', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div className="text-[7px] text-emerald-400/80 font-medium mb-0.5">Saldo</div>
              <div className="text-[11px] font-black text-white">Rp 250.000</div>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {PHONE_SERVICES.map(({ Icon, color, label }, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon style={{ color, width: 10, height: 10 }} />
                  </div>
                  <span className="text-[5px] text-white/40">{label}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-1.5 flex-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[6px] text-white/30 mb-1 font-semibold uppercase tracking-wide">Terbaru</div>
              {['Top Up GoPay', 'Pulsa Telkomsel', 'Token PLN'].map((tx, i) => (
                <div key={i} className="flex justify-between items-center mb-1">
                  <span className="text-[6px] text-white/60">{tx}</span>
                  <CheckCircle style={{ color: '#34d399', width: 7, height: 7 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating e-wallet cards */}
      {WALLETS.map((w, i) => (
        <div key={i} className={cn('absolute z-20 animate-float', w.pos)}
          style={{ animationDelay: w.delay, animationDuration: w.dur }}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg backdrop-blur-md"
            style={{ background: w.bg, border: `1px solid ${w.border}` }}>
            <div className="text-sm font-black leading-none" style={{ color: w.color }}>{w.abbr}</div>
            <div className="text-[7px] text-white/55 mt-0.5">{w.label}</div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-3 right-1 z-30 animate-float-slow" style={{ animationDelay: '0.8s' }}>
        <GlassCard className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(52,211,153,0.2)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-white leading-tight">Transaksi Berhasil</div>
              <div className="text-[9px] text-white/55">Rp 50.000 · Instan</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 2 — TOP UP GAME (purple)
───────────────────────────────────────────────────────────── */
const GAME_CARDS = [
  { abbr: 'ML',   color: '#f59e0b', pos: 'top-6 right-4',    delay: '0s',   dur: '3.5s' },
  { abbr: 'FF',   color: '#ef4444', pos: 'top-4 left-3',     delay: '0.6s', dur: '4.0s' },
  { abbr: 'PUBG', color: '#60a5fa', pos: 'bottom-8 right-6', delay: '1.2s', dur: '3.8s' },
];

function GameVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#d8b4fe" />

      {/* Neon glow rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full pointer-events-none animate-neon-ring"
        style={{ border: '1px solid rgba(192,132,252,0.4)', boxShadow: '0 0 40px rgba(192,132,252,0.15)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none animate-neon-ring"
        style={{ border: '1px solid rgba(139,92,246,0.3)', animationDelay: '1s' }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-44 h-44 rounded-full bg-purple-500/20 blur-3xl animate-glow-pulse" />
      </div>

      {/* Controller SVG — unique gradient IDs to prevent DOM conflicts */}
      <div className="relative z-10 animate-float" style={{ animationDuration: '4s' }}>
        <svg viewBox="0 0 200 130" className="w-44 h-28 sm:w-56 sm:h-36 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gameCtrlBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3730a3" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="gameCtrlShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M42 42 Q22 42 16 62 Q10 86 26 102 Q42 116 56 106 L80 82 L120 82 L144 106 Q158 116 174 102 Q190 86 184 62 Q178 42 158 42 L138 36 Q118 26 100 26 Q82 26 62 36 Z"
            fill="url(#gameCtrlBody)" stroke="rgba(109,40,217,0.5)" strokeWidth="1.5" />
          <path d="M42 42 Q22 42 16 62 L184 62 Q178 42 158 42 L138 36 Q118 26 100 26 Q82 26 62 36 Z"
            fill="url(#gameCtrlShine)" />
          {/* D-pad */}
          <rect x="34" y="57" width="7" height="22" rx="2" fill="#6d28d9" opacity="0.85" />
          <rect x="26" y="65" width="23" height="7" rx="2" fill="#6d28d9" opacity="0.85" />
          {/* ABXY */}
          <circle cx="147" cy="55" r="5.5" fill="#ef4444" opacity="0.9" />
          <circle cx="160" cy="66" r="5.5" fill="#f59e0b" opacity="0.9" />
          <circle cx="147" cy="77" r="5.5" fill="#22c55e" opacity="0.9" />
          <circle cx="134" cy="66" r="5.5" fill="#60a5fa" opacity="0.9" />
          {/* Analog sticks */}
          <circle cx="70" cy="82" r="11" fill="#312e81" stroke="#6d28d9" strokeWidth="1.5" />
          <circle cx="70" cy="82" r="5" fill="#4c1d95" />
          <circle cx="130" cy="82" r="11" fill="#312e81" stroke="#6d28d9" strokeWidth="1.5" />
          <circle cx="130" cy="82" r="5" fill="#4c1d95" />
          {/* Bumpers */}
          <rect x="34" y="34" width="36" height="9" rx="4.5" fill="#4c1d95" opacity="0.75" />
          <rect x="130" y="34" width="36" height="9" rx="4.5" fill="#4c1d95" opacity="0.75" />
          {/* Center */}
          <circle cx="100" cy="64" r="9" fill="#312e81" stroke="#6d28d9" strokeWidth="1.5" />
          <text x="100" y="68" textAnchor="middle" fill="#a78bfa" fontSize="7" fontWeight="bold" fontFamily="system-ui">SC</text>
        </svg>
      </div>

      {/* Game title cards */}
      {GAME_CARDS.map((g, i) => (
        <div key={i} className={cn('absolute z-20 animate-float', g.pos)}
          style={{ animationDelay: g.delay, animationDuration: g.dur }}>
          <GlassCard className="px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: `${g.color}22`, border: `1px solid ${g.color}40` }}>
                <Diamond style={{ color: g.color, width: 10, height: 10 }} />
              </div>
              <span className="text-[10px] font-bold text-white whitespace-nowrap">{g.abbr}</span>
            </div>
          </GlassCard>
        </div>
      ))}

      <div className="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 z-20 animate-float"
        style={{ animationDelay: '1.2s', animationDuration: '3.5s' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md"
          style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.35)' }}>
          <Diamond className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      <div className="absolute bottom-6 left-5 z-20 animate-float" style={{ animationDelay: '1.8s', animationDuration: '4.2s' }}>
        <GlassCard className="px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-yellow-400/30 border border-yellow-400/50 flex items-center justify-center">
              <span className="text-[7px] font-black text-yellow-400">$</span>
            </div>
            <span className="text-[9px] text-white/80 font-semibold">Coin</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 3 — PPOB (orange/amber)
───────────────────────────────────────────────────────────── */
const UTILITIES = [
  { Icon: Zap,      label: 'PLN',     color: '#fbbf24', bg: 'rgba(251,191,36,0.18)',  border: 'rgba(251,191,36,0.35)',  delay: '0s',   dur: '3.4s' },
  { Icon: Droplets, label: 'PDAM',    color: '#60a5fa', bg: 'rgba(96,165,250,0.18)',  border: 'rgba(96,165,250,0.35)',  delay: '0.5s', dur: '4.0s' },
  { Icon: Wifi,     label: 'Internet', color: '#34d399', bg: 'rgba(52,211,153,0.18)', border: 'rgba(52,211,153,0.35)', delay: '1.0s', dur: '3.7s' },
  { Icon: Shield,   label: 'BPJS',    color: '#f87171', bg: 'rgba(248,113,113,0.18)', border: 'rgba(248,113,113,0.35)', delay: '1.5s', dur: '4.3s' },
];
const BILL_ITEMS = [
  { label: 'PLN', amount: '150.000' },
  { label: 'BPJS', amount: '42.500' },
  { label: 'PDAM', amount: '35.000' },
];

function PlnVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#fde68a" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-amber-400/15 blur-3xl animate-glow-pulse" />
      </div>

      {/* 2×2 utility icon grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        {UTILITIES.map(({ Icon, label, color, bg, border, delay, dur }, i) => (
          <div key={i} className="animate-float" style={{ animationDelay: delay, animationDuration: dur }}>
            <GlassCard className="w-20 sm:w-24 px-2 sm:px-3 py-3 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon style={{ color, width: 20, height: 20 }} />
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-white/80">{label}</span>
            </GlassCard>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-1 z-30 animate-float-slow" style={{ animationDelay: '1s' }}>
        <GlassCard className="px-3 py-2.5 min-w-[130px]">
          <div className="text-[9px] font-bold text-white mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            Tagihan Dibayar
          </div>
          {BILL_ITEMS.map((item, i) => (
            <div key={i} className="flex justify-between items-center mb-1">
              <span className="text-[8px] text-white/50">{item.label}</span>
              <span className="text-[8px] text-white/80">Rp {item.amount}</span>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 4 — RESELLER (teal/blue)
───────────────────────────────────────────────────────────── */
const CHART_BARS = [35, 58, 45, 72, 60, 88, 78];
const CHART_LABELS = ['S', 'M', 'S', 'R', 'K', 'J', 'M'];

// Network data — explicit typed arrays (no inline destructuring casts)
const NET_LINES = [
  { x1: 40, y1: 40, x2: 15, y2: 20 },
  { x1: 40, y1: 40, x2: 65, y2: 15 },
  { x1: 40, y1: 40, x2: 10, y2: 60 },
  { x1: 40, y1: 40, x2: 70, y2: 58 },
  { x1: 40, y1: 40, x2: 40, y2: 72 },
  { x1: 15, y1: 20, x2: 65, y2: 15 },
];
const NET_NODES = [
  { cx: 40, cy: 40 },
  { cx: 15, cy: 20 },
  { cx: 65, cy: 15 },
  { cx: 10, cy: 60 },
  { cx: 70, cy: 58 },
  { cx: 40, cy: 72 },
];

function AllVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#5eead4" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-teal-400/15 blur-3xl animate-glow-pulse" />
      </div>

      {/* Dashboard chart card */}
      <div className="relative z-10 animate-float-slow">
        <GlassCard className="p-4 w-44 sm:w-52">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white">Penjualan Reseller</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="flex items-end gap-1.5 h-14 mb-2">
            {CHART_BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 5
                    ? 'linear-gradient(to top, #2dd4bf, #14b8a6)'
                    : 'rgba(45,212,191,0.28)',
                }} />
            ))}
          </div>
          <div className="flex">
            {CHART_LABELS.map((d, i) => (
              <span key={i} className="flex-1 text-center text-[7px] text-white/35">{d}</span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Stats cards */}
      <div className="absolute top-6 right-3 sm:right-6 z-20 animate-float"
        style={{ animationDelay: '0.7s', animationDuration: '3.8s' }}>
        <GlassCard className="px-3 py-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-white">+30%</div>
              <div className="text-[8px] text-white/50">Komisi</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="absolute bottom-8 right-2 sm:right-5 z-20 animate-float"
        style={{ animationDelay: '1.4s', animationDuration: '4.2s' }}>
        <GlassCard className="px-3 py-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-white">2.400+</div>
              <div className="text-[8px] text-white/50">Reseller</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Network visualization — explicit data, no complex destructuring */}
      <div className="absolute top-10 left-3 sm:left-5 z-20 opacity-70 animate-float"
        style={{ animationDelay: '2s', animationDuration: '5s' }}>
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {NET_LINES.map((seg, i) => (
            <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
              stroke="#2dd4bf" strokeWidth="0.8" opacity="0.3" />
          ))}
          {NET_NODES.map((node, i) => (
            <g key={i}>
              <circle cx={node.cx} cy={node.cy} r={6} fill="#2dd4bf" opacity="0.12" />
              <circle cx={node.cx} cy={node.cy} r={3} fill="#2dd4bf" opacity="0.85" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   THEME VISUAL ROUTER
───────────────────────────────────────────────────────────── */
function ThemeVisual({ theme }: { theme: Banner['theme'] }) {
  if (theme === 'pulsa') return <PulsaVisual />;
  if (theme === 'game')  return <GameVisual />;
  if (theme === 'pln')   return <PlnVisual />;
  return <AllVisual />;
}

/* ─────────────────────────────────────────────────────────────
   SLIDE CONTENT
───────────────────────────────────────────────────────────── */
function SlideContent({ banner, active, settings }: {
  banner: Banner;
  active: boolean;
  settings: { whatsapp: string };
}) {
  const theme = THEME[banner.theme] ?? THEME.pulsa;
  const hasImage = !!banner.imageDataUrl;
  const clickUrl = banner.bannerLink || banner.button1Link || '';
  const isExternal = clickUrl.startsWith('http') || clickUrl.startsWith('//');
  const waLink = banner.button2Link || `https://wa.me/${settings.whatsapp}`;

  return (
    <div className={cn(
      'absolute inset-0 transition-all duration-700',
      active ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02] pointer-events-none'
    )}>
      {hasImage ? (
        /* ── Custom image banner — fullscreen, no text overlay ── */
        <>
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <img
            src={banner.imageDataUrl}
            alt={banner.title || 'Banner promo'}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          {clickUrl && (
            isExternal ? (
              <a href={clickUrl} target="_blank" rel="noopener noreferrer"
                className="absolute inset-0 z-10 cursor-pointer"
                aria-label={banner.title || 'Lihat promo'} />
            ) : (
              <Link to={clickUrl} className="absolute inset-0 z-10 cursor-pointer"
                aria-label={banner.title || 'Lihat promo'} />
            )
          )}
        </>
      ) : (
        /* ── Premium 2-column gradient banner ── */
        <>
          {/* Background layers */}
          <div className={cn('absolute inset-0 bg-gradient-to-br', theme.bg)} />
          <div className="absolute inset-0" style={{ background: theme.glowBg }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="w-full px-4 sm:px-6 lg:px-12">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">

                {/* Left — CMS text */}
                <div className={cn('flex-1 flex flex-col justify-center min-w-0', active ? 'animate-fade-left' : '')}>
                  {banner.badge && (
                    <span className={cn('inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 w-fit tracking-widest uppercase', theme.badge)}>
                      {banner.badge}
                    </span>
                  )}
                  <h1 className="text-gradient-white text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-3 drop-shadow">
                    {banner.title}
                  </h1>
                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed max-w-lg">
                    {banner.subtitle}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {banner.button1Text && (
                      <Button asChild className={cn('rounded-xl font-bold h-11 px-6 btn-glow shadow-lg', theme.btn1)}>
                        <Link to={banner.button1Link || '/products'}>{banner.button1Text}</Link>
                      </Button>
                    )}
                    {banner.button2Text && (
                      <Button asChild variant="outline" className={cn('rounded-xl font-bold h-11 px-6', theme.btn2)}>
                        <a href={waLink} target="_blank" rel="noopener noreferrer">{banner.button2Text}</a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right — SVG visual illustration */}
                <div
                  className={cn('hidden md:block flex-shrink-0 relative', active ? 'animate-fade-right' : '')}
                  style={{ width: '42%', height: 'clamp(260px, 45vw, 420px)' }}
                >
                  <ThemeVisual theme={banner.theme} />
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO SLIDER — main export
───────────────────────────────────────────────────────────── */
export default function HeroSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState(siteSettingsStore.get());
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const load = () => {
      const all = bannerStore.get();
      const active = all.filter(b => b.active).sort((a, b) => a.order - b.order);
      return active.length > 0 ? active : all.slice(0, 1);
    };
    setBanners(load());
    const u1 = subscribeToStore('banners', () => { setBanners(load()); setCurrent(0); });
    const u2 = subscribeToStore('siteSettings', () => setSettings(siteSettingsStore.get()));
    return () => { u1(); u2(); };
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % (banners.length || 1)), [banners.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % (banners.length || 1)), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [banners.length, paused, next]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
    touchStart.current = null;
  };

  if (banners.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: 'clamp(360px, 65vw, 580px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, i) => (
        <SlideContent key={banner.id} banner={banner} active={i === current} settings={settings} />
      ))}

      {banners.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10 shadow-md"
            aria-label="Slide sebelumnya">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10 shadow-md"
            aria-label="Slide berikutnya">
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn(
                  'transition-all duration-300 rounded-full shadow-md',
                  i === current ? 'w-7 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/65'
                )}
                aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
