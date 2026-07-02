import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, Zap, Wifi, Shield,
  Droplets, TrendingUp, Users, ArrowUpRight, Gamepad2, Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { bannerStore, siteSettingsStore, type Banner } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   THEME CONFIG — UNCHANGED
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
function GlassCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl', className)}
      style={style}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────────────────────── */
const DOTS = [
  { x: '7%',  y: '15%', s: 3, d: 0,   dur: 3.2 },
  { x: '80%', y: '10%', s: 2, d: 0.7, dur: 4.1 },
  { x: '18%', y: '75%', s: 4, d: 1.3, dur: 3.7 },
  { x: '60%', y: '82%', s: 2, d: 2.0, dur: 4.5 },
  { x: '45%', y: '8%',  s: 3, d: 0.4, dur: 3.0 },
  { x: '90%', y: '42%', s: 2, d: 1.8, dur: 4.0 },
  { x: '5%',  y: '50%', s: 2, d: 0.9, dur: 3.5 },
  { x: '55%', y: '92%', s: 3, d: 2.5, dur: 5.0 },
  { x: '33%', y: '28%', s: 2, d: 1.1, dur: 3.8 },
  { x: '88%', y: '65%', s: 3, d: 0.3, dur: 4.2 },
  { x: '25%', y: '45%', s: 2, d: 1.6, dur: 4.8 },
  { x: '70%', y: '30%', s: 2, d: 0.8, dur: 3.3 },
];
function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DOTS.map((p, i) => (
        <div key={i} className="absolute rounded-full animate-float opacity-40"
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
   PHONE MOCKUP — Premium realistic design
───────────────────────────────────────────────────────────── */
function PhoneMockup({ children, glowColor = '#34d399' }: { children: React.ReactNode; glowColor?: string }) {
  return (
    <div className="relative animate-float" style={{ animationDuration: '4s' }}>
      {/* Outer glow */}
      <div className="absolute -inset-6 rounded-[3.5rem] blur-3xl opacity-20"
        style={{ background: glowColor }} />
      {/* Phone body */}
      <div
        className="relative w-32 h-60 sm:w-40 sm:h-72 rounded-[2.5rem] overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #1e2235 0%, #0d0f1a 60%, #060810 100%)',
          border: '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px -20px ${glowColor}35`,
        }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full bg-black z-20" />
        {/* Top reflection */}
        <div className="absolute top-0 left-0 right-0 h-16 rounded-t-[2.5rem]"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)' }} />
        {/* Right edge highlight */}
        <div className="absolute right-0 top-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(255,255,255,0.02), rgba(255,255,255,0.12))' }} />
        {/* Screen content */}
        <div className="absolute inset-0 pt-7 px-2 pb-2 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BRAND FLOATING CARD — for operator/e-wallet logos
───────────────────────────────────────────────────────────── */
function BrandCard({
  imgSrc, name, color, pos, delay, dur, size = 'md',
}: {
  imgSrc: string; name: string; color: string;
  pos: string; delay: string; dur: string; size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'w-16 h-16 sm:w-18 sm:h-18' : size === 'sm' ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-14 h-14 sm:w-16 sm:h-16';
  const imgSize = size === 'lg' ? 32 : size === 'sm' ? 22 : 26;
  return (
    <div className={cn('absolute z-20 animate-float', pos)}
      style={{ animationDelay: delay, animationDuration: dur }}>
      <div
        className={cn(dim, 'rounded-2xl flex flex-col items-center justify-center shadow-xl backdrop-blur-md transition-transform duration-300 hover:scale-110 cursor-default')}
        style={{
          background: `linear-gradient(145deg, ${color}35, ${color}18)`,
          border: `1.5px solid ${color}55`,
          boxShadow: `0 8px 32px ${color}25, 0 0 20px ${color}15`,
        }}
      >
        <img
          src={imgSrc} alt={name}
          width={imgSize} height={imgSize}
          className="object-contain"
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.15))' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="text-[7px] font-semibold text-white/65 mt-0.5 leading-none">{name}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DENOM CARD — for PLN denomination / data packages
───────────────────────────────────────────────────────────── */
function DenomCard({
  amount, unit, color, pos, delay, dur,
}: {
  amount: string; unit: string; color: string;
  pos: string; delay: string; dur: string;
}) {
  return (
    <div className={cn('absolute z-20 animate-float', pos)}
      style={{ animationDelay: delay, animationDuration: dur }}>
      <div
        className="w-16 sm:w-18 px-2 py-2.5 rounded-2xl text-center backdrop-blur-md shadow-xl transition-transform hover:scale-105"
        style={{
          background: `linear-gradient(145deg, ${color}40, ${color}20)`,
          border: `1.5px solid ${color}60`,
          boxShadow: `0 8px 30px ${color}30, 0 0 20px ${color}15`,
        }}
      >
        <div className="font-black text-white leading-none text-sm sm:text-base">{amount}</div>
        <div className="text-[8px] text-white/60 mt-0.5 font-medium">{unit}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NOTIF CARD — floating success notification
───────────────────────────────────────────────────────────── */
function NotifCard({
  icon, title, sub, color, pos, delay,
}: {
  icon: React.ReactNode; title: string; sub: string;
  color: string; pos: string; delay: string;
}) {
  return (
    <div className={cn('absolute z-30 animate-float-slow', pos)} style={{ animationDelay: delay }}>
      <GlassCard className="px-3 py-2 min-w-[140px]"
        style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 20px ${color}18` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}28`, border: `1px solid ${color}55` }}>
            {icon}
          </div>
          <div>
            <div className="text-[10px] font-bold text-white leading-tight whitespace-nowrap">{title}</div>
            <div className="text-[8px] text-white/50 whitespace-nowrap">{sub}</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 1 — PULSA & E-WALLET
   Operator logo cards + premium phone mockup
───────────────────────────────────────────────────────────── */
const PULSA_PHONE_SERVICES = [
  { color: '#34d399', label: 'Pulsa' },
  { color: '#60a5fa', label: 'Data'  },
  { color: '#fbbf24', label: 'PLN'   },
  { color: '#f87171', label: 'BPJS'  },
];
const PULSA_TXS = [
  { label: 'Telkomsel 50rb', color: '#34d399' },
  { label: 'Indosat 100rb', color: '#34d399'  },
  { label: 'XL 25rb',        color: '#34d399' },
];

function PulsaPhoneScreen() {
  return (
    <div className="h-full flex flex-col gap-1.5">
      {/* Balance */}
      <div className="rounded-xl p-2"
        style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.28), rgba(20,184,166,0.14))', border: '1px solid rgba(52,211,153,0.22)' }}>
        <div className="text-[6px] text-emerald-400/80 font-semibold uppercase tracking-wide">Saldo</div>
        <div className="text-[12px] font-black text-white mt-0.5">Rp 250.000</div>
      </div>
      {/* Service icons */}
      <div className="grid grid-cols-4 gap-0.5">
        {PULSA_PHONE_SERVICES.map(({ color, label }, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center"
              style={{ background: `${color}22`, border: `1px solid ${color}40` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: color, opacity: 0.9 }} />
            </div>
            <span className="text-[5px] text-white/40">{label}</span>
          </div>
        ))}
      </div>
      {/* Transactions */}
      <div className="rounded-lg p-1.5 flex-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="text-[5px] text-white/30 mb-1.5 font-semibold uppercase tracking-wide">Terbaru</div>
        {PULSA_TXS.map((tx, i) => (
          <div key={i} className="flex justify-between items-center mb-1.5">
            <span className="text-[6px] text-white/55">{tx.label}</span>
            <CheckCircle style={{ color: tx.color, width: 7, height: 7 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PulsaVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#6ee7b7" />
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 rounded-full bg-emerald-400/15 blur-3xl animate-glow-pulse" />
      </div>
      {/* Light beam */}
      <div className="absolute top-0 left-1/4 w-1 h-full opacity-5 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #6ee7b7, transparent)', transform: 'skewX(-15deg)' }} />

      {/* Phone */}
      <div className="relative z-10 mr-2">
        <PhoneMockup glowColor="#34d399">
          <PulsaPhoneScreen />
        </PhoneMockup>
      </div>

      {/* Operator brand cards */}
      <BrandCard imgSrc="/images/payment/telkomsel-logo.svg" name="Telkomsel" color="#CC0000"
        pos="top-4 right-2 sm:right-4" delay="0s" dur="3.5s" size="lg" />
      <BrandCard imgSrc="/images/payment/axis-logo.svg" name="AXIS" color="#7B2D8B"
        pos="top-2 left-0" delay="0.8s" dur="4.2s" />
      <BrandCard imgSrc="/images/payment/indosat-logo.svg" name="Indosat" color="#FFB800"
        pos="bottom-14 right-1 sm:right-3" delay="1.4s" dur="3.8s" />
      <BrandCard imgSrc="/images/payment/xl-logo.svg" name="XL" color="#003DA5"
        pos="bottom-10 left-2" delay="2.0s" dur="4.5s" size="sm" />
      <BrandCard imgSrc="/images/payment/tri-logo.svg" name="Tri" color="#FF6600"
        pos="top-1/2 -translate-y-1/2 left-0" delay="1.0s" dur="4.0s" size="sm" />

      {/* Notification */}
      <NotifCard
        icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
        title="Transaksi Berhasil"
        sub="Rp 50.000 · Instan"
        color="#34d399"
        pos="bottom-3 right-0 sm:right-2"
        delay="0.5s"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 2 — GAME TOP UP
   Game denomination cards + gaming phone
───────────────────────────────────────────────────────────── */
const GAME_ITEMS = [
  { name: 'MLBB', label: '100 Diamond', color: '#f59e0b', pos: 'top-4 right-2',    delay: '0s',   dur: '3.5s' },
  { name: 'FF',   label: '210 Garena',  color: '#ef4444', pos: 'top-3 left-0',     delay: '0.7s', dur: '4.2s' },
  { name: 'PUBG', label: '60 UC',       color: '#60a5fa', pos: 'bottom-12 right-1',delay: '1.3s', dur: '3.8s' },
];
const GAME_TXS = [
  { label: 'MLBB 100 Diamond', color: '#f59e0b' },
  { label: 'FF 210 Garena',    color: '#ef4444' },
  { label: 'PUBG 60 UC',       color: '#60a5fa' },
];

function GamePhoneScreen() {
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="rounded-xl p-2"
        style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.28), rgba(139,92,246,0.14))', border: '1px solid rgba(192,132,252,0.22)' }}>
        <div className="text-[6px] text-purple-400/80 font-semibold uppercase tracking-wide">Game Wallet</div>
        <div className="text-[12px] font-black text-white mt-0.5 flex items-center gap-1">
          <span className="text-yellow-400">♦</span> 2.840
        </div>
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {[{ c: '#f59e0b', l: 'MLBB' }, { c: '#ef4444', l: 'FF' }, { c: '#60a5fa', l: 'PUBG' }].map((g, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[5px] font-black"
              style={{ background: `${g.c}28`, border: `1px solid ${g.c}50`, color: g.c }}>
              {g.l.slice(0, 2)}
            </div>
            <span className="text-[5px] text-white/40">{g.l}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-1.5 flex-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="text-[5px] text-white/30 mb-1.5 font-semibold uppercase tracking-wide">Top Up</div>
        {GAME_TXS.map((tx, i) => (
          <div key={i} className="flex justify-between items-center mb-1.5">
            <span className="text-[6px] text-white/55">{tx.label}</span>
            <CheckCircle style={{ color: tx.color, width: 7, height: 7 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GameVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#d8b4fe" />
      {/* Neon rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full pointer-events-none animate-neon-ring"
        style={{ border: '1px solid rgba(192,132,252,0.4)', boxShadow: '0 0 40px rgba(192,132,252,0.12)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none animate-neon-ring"
        style={{ border: '1px solid rgba(139,92,246,0.3)', animationDelay: '1s' }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-purple-500/15 blur-3xl animate-glow-pulse" />
      </div>

      {/* Phone */}
      <div className="relative z-10 mr-2">
        <PhoneMockup glowColor="#a78bfa">
          <GamePhoneScreen />
        </PhoneMockup>
      </div>

      {/* Game denomination cards */}
      {GAME_ITEMS.map((g, i) => (
        <div key={i} className={cn('absolute z-20 animate-float', g.pos)}
          style={{ animationDelay: g.delay, animationDuration: g.dur }}>
          <div className="px-2.5 py-2 rounded-xl backdrop-blur-md shadow-xl"
            style={{
              background: `linear-gradient(145deg, ${g.color}35, ${g.color}18)`,
              border: `1.5px solid ${g.color}55`,
              boxShadow: `0 8px 25px ${g.color}25`,
            }}>
            <div className="text-[9px] font-black text-white">{g.name}</div>
            <div className="text-[8px] font-medium" style={{ color: g.color }}>{g.label}</div>
          </div>
        </div>
      ))}

      {/* Diamond sparkle */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 animate-float"
        style={{ animationDelay: '1.5s', animationDuration: '3.8s' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md"
          style={{ background: 'rgba(251,191,36,0.22)', border: '1.5px solid rgba(251,191,36,0.45)' }}>
          <span className="text-yellow-400 text-lg font-black">♦</span>
        </div>
      </div>

      {/* Notification */}
      <NotifCard
        icon={<Gamepad2 className="w-4 h-4 text-purple-400" />}
        title="Top Up Berhasil!"
        sub="100 Diamond · Instan"
        color="#a78bfa"
        pos="bottom-3 right-0 sm:right-2"
        delay="0.8s"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 3 — PLN & PPOB
   Token denomination cards + utilities phone
───────────────────────────────────────────────────────────── */
const PLN_DENOMS = [
  { amount: '20',  unit: 'Ribu', color: '#22c55e', pos: 'top-5 right-4',     delay: '0s',   dur: '3.5s' },
  { amount: '50',  unit: 'Ribu', color: '#60a5fa', pos: 'top-3 left-1',      delay: '0.6s', dur: '4.0s' },
  { amount: '100', unit: 'Ribu', color: '#a78bfa', pos: 'bottom-12 right-2', delay: '1.2s', dur: '3.7s' },
  { amount: '200', unit: 'Ribu', color: '#fb923c', pos: 'bottom-8 left-2',   delay: '1.8s', dur: '4.3s' },
];
const PLN_PHONE_SERVICES = [
  { color: '#fbbf24', label: 'PLN'  },
  { color: '#60a5fa', label: 'PDAM' },
  { color: '#f87171', label: 'BPJS' },
  { color: '#34d399', label: 'TV'   },
];

function PlnPhoneScreen() {
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="rounded-xl p-2"
        style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.28), rgba(245,158,11,0.14))', border: '1px solid rgba(251,191,36,0.22)' }}>
        <div className="text-[6px] text-amber-400/80 font-semibold uppercase tracking-wide">PLN Prabayar</div>
        <div className="text-[12px] font-black text-white mt-0.5">No. Meter</div>
        <div className="text-[7px] text-amber-300/70 font-mono">53901234567</div>
      </div>
      <div className="grid grid-cols-4 gap-0.5">
        {PLN_PHONE_SERVICES.map(({ color, label }, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center"
              style={{ background: `${color}22`, border: `1px solid ${color}40` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: color, opacity: 0.9 }} />
            </div>
            <span className="text-[5px] text-white/40">{label}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-1.5 flex-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="text-[5px] text-white/30 mb-1.5 font-semibold uppercase tracking-wide">Riwayat Token</div>
        {[{ l: 'Token 50.000', a: '08-JUL' }, { l: 'Token 100.000', a: '01-JUL' }, { l: 'Token 20.000', a: '28-JUN' }].map((t, i) => (
          <div key={i} className="flex justify-between items-center mb-1.5">
            <span className="text-[6px] text-white/55">{t.l}</span>
            <span className="text-[5px] text-white/30">{t.a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlnVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#fde68a" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-52 h-52 rounded-full bg-amber-400/12 blur-3xl animate-glow-pulse" />
      </div>
      <div className="absolute top-0 right-1/4 w-1 h-full opacity-5 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #fde68a, transparent)', transform: 'skewX(-10deg)' }} />

      {/* Phone */}
      <div className="relative z-10 mr-2">
        <PhoneMockup glowColor="#fbbf24">
          <PlnPhoneScreen />
        </PhoneMockup>
      </div>

      {/* PLN Lightning badge */}
      <div className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-20 animate-float"
        style={{ animationDuration: '3.2s' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-md"
          style={{ background: 'rgba(251,191,36,0.25)', border: '1.5px solid rgba(251,191,36,0.55)', boxShadow: '0 0 20px rgba(251,191,36,0.3)' }}>
          <img src="/images/payment/pln-logo.svg" alt="PLN" width={24} height={24} className="object-contain" />
        </div>
      </div>

      {/* Token denomination cards */}
      {PLN_DENOMS.map((d, i) => (
        <DenomCard key={i} {...d} />
      ))}

      {/* Notification */}
      <NotifCard
        icon={<Zap className="w-4 h-4 text-amber-400" />}
        title="Token Berhasil!"
        sub="Rp 100.000 · Instan"
        color="#fbbf24"
        pos="bottom-3 right-0 sm:right-2"
        delay="1s"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 4 — RESELLER / SEMUA LAYANAN
   Feature benefit cards + dashboard phone
───────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: <Star className="w-4 h-4" />, label: 'Harga',    sub: 'Super Murah',    color: '#f59e0b', pos: 'top-4 left-1',     delay: '0s',   dur: '3.8s' },
  { icon: <TrendingUp className="w-4 h-4" />, label: 'Keuntungan', sub: 'Berlipat', color: '#34d399', pos: 'top-4 right-1',   delay: '0.5s', dur: '4.2s' },
  { icon: <Zap className="w-4 h-4" />, label: 'Transaksi', sub: 'Anti Ribet',     color: '#60a5fa', pos: 'bottom-12 left-1', delay: '1.0s', dur: '3.5s' },
  { icon: <Shield className="w-4 h-4" />, label: 'Support', sub: '24 Jam',        color: '#a78bfa', pos: 'bottom-12 right-1',delay: '1.5s', dur: '4.0s' },
];
const CHART_BARS = [35, 55, 42, 68, 58, 85, 76];
const CHART_LABELS = ['S', 'M', 'S', 'R', 'K', 'J', 'M'];

function ResellerPhoneScreen() {
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="rounded-xl p-2"
        style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.28), rgba(20,184,166,0.14))', border: '1px solid rgba(45,212,191,0.22)' }}>
        <div className="text-[6px] text-teal-400/80 font-semibold uppercase tracking-wide">Dashboard Reseller</div>
        <div className="text-[7px] text-white/50 mt-0.5">Saldo</div>
        <div className="text-[11px] font-black text-white">Rp 1.250.000</div>
      </div>
      {/* Mini chart */}
      <div className="rounded-lg p-1.5 flex-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="text-[5px] text-white/30 mb-1 font-semibold uppercase tracking-wide">Keuntungan Bulan Ini</div>
        <div className="text-[9px] font-black text-teal-400 mb-1.5">Rp 3.750.000</div>
        <div className="flex items-end gap-0.5 h-8 mb-1">
          {CHART_BARS.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: i === 5 ? 'linear-gradient(to top, #2dd4bf, #14b8a6)' : 'rgba(45,212,191,0.28)',
              }} />
          ))}
        </div>
        <div className="flex">
          {CHART_LABELS.map((d, i) => (
            <span key={i} className="flex-1 text-center text-[5px] text-white/30">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AllVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Particles color="#5eead4" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-52 h-52 rounded-full bg-teal-400/12 blur-3xl animate-glow-pulse" />
      </div>

      {/* Phone */}
      <div className="relative z-10">
        <PhoneMockup glowColor="#2dd4bf">
          <ResellerPhoneScreen />
        </PhoneMockup>
      </div>

      {/* Feature cards */}
      {FEATURES.map((f, i) => (
        <div key={i} className={cn('absolute z-20 animate-float', f.pos)}
          style={{ animationDelay: f.delay, animationDuration: f.dur }}>
          <GlassCard className="px-2.5 py-2 min-w-[70px]"
            style={{ boxShadow: `0 8px 24px rgba(0,0,0,0.3), 0 0 16px ${f.color}18` }}>
            <div className="flex flex-col items-start gap-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${f.color}25`, border: `1px solid ${f.color}45`, color: f.color }}>
                {f.icon}
              </div>
              <div>
                <div className="text-[9px] font-bold text-white leading-none">{f.label}</div>
                <div className="text-[7px] text-white/50">{f.sub}</div>
              </div>
            </div>
          </GlassCard>
        </div>
      ))}

      {/* Profit notification */}
      <NotifCard
        icon={<ArrowUpRight className="w-4 h-4 text-teal-400" />}
        title="Keuntungan Masuk"
        sub="+Rp 250.000"
        color="#2dd4bf"
        pos="bottom-3 left-0 sm:left-2"
        delay="0.8s"
      />

      {/* Reseller count badge */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 animate-float"
        style={{ animationDuration: '4.5s', animationDelay: '2s' }}>
        <GlassCard className="px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-white">2.400+</div>
              <div className="text-[7px] text-white/50">Reseller</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   THEME VISUAL ROUTER — UNCHANGED
───────────────────────────────────────────────────────────── */
function ThemeVisual({ theme }: { theme: Banner['theme'] }) {
  if (theme === 'pulsa') return <PulsaVisual />;
  if (theme === 'game')  return <GameVisual />;
  if (theme === 'pln')   return <PlnVisual />;
  return <AllVisual />;
}

/* ─────────────────────────────────────────────────────────────
   SLIDE CONTENT — UNCHANGED (logic & layout)
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
        <>
          {/* Background */}
          <div className={cn('absolute inset-0 bg-gradient-to-br', theme.bg)} />
          <div className="absolute inset-0" style={{ background: theme.glowBg }} />
          <div className="absolute inset-0 opacity-[0.02]"
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

                {/* Right — Premium visual */}
                <div
                  className={cn('hidden md:block flex-shrink-0 relative', active ? 'animate-fade-right' : '')}
                  style={{ width: '44%', height: 'clamp(280px, 45vw, 420px)' }}
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
   HERO SLIDER — main export, LOGIC UNCHANGED
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
