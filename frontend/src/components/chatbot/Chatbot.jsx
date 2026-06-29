import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  hot  : { label: 'Hot Lead',   emoji: '🔥', ring: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   badge: 'bg-red-100 text-red-700'   },
  good : { label: 'Good Fit',   emoji: '✅', ring: '#22c55e', bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700' },
  maybe: { label: 'Maybe',      emoji: '🤔', ring: '#f59e0b', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700'   },
  low  : { label: 'Low Fit',    emoji: '📋', ring: '#94a3b8', bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-600'   },
};

const DIMENSION_META = {
  problem_clarity    : { icon: '🎯', label: 'Problem Clarity',     max: 15 },
  mvp_maturity       : { icon: '🛠️', label: 'MVP Maturity',        max: 20 },
  traction           : { icon: '📈', label: 'Traction',            max: 25 },
  team_strength      : { icon: '👥', label: 'Team Strength',       max: 15 },
  funding_readiness  : { icon: '💰', label: 'Funding Readiness',   max: 10 },
  validation_evidence: { icon: '✅', label: 'Validation Evidence', max: 15 },
  thesis_alignment   : { icon: '🧠', label: 'Thesis Alignment',    max: 20 },
  stage_match        : { icon: '🎯', label: 'Stage Match',         max: 20 },
  cheque_fit         : { icon: '💵', label: 'Cheque Fit',          max: 15 },
  portfolio_experience:{ icon: '📂', label: 'Portfolio Exp.',      max: 15 },
  support_value      : { icon: '🤝', label: 'Support Value',       max: 15 },
  deployment_urgency : { icon: '⚡', label: 'Deployment Urgency',  max: 15 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS (inline — no extra deps)
// ─────────────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.88 5.63L19.5 10l-5.62 1.37L12 17l-1.88-5.63L4.5 10l5.62-1.37z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 msg-enter">
      <Avatar />
      <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-md px-4 py-3.5 shadow-card">
        <div className="flex gap-1.5 items-center">
          {[0, 160, 320].map(d => (
            <span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-dot"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ size = 'md' }) {
  const s = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <SparkleIcon />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOT MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
function BotMessage({ text, isFirst = false }) {
  return (
    <div className="flex items-end gap-3 msg-enter">
      <Avatar />
      <div className="max-w-[78%] md:max-w-sm">
        <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-md px-4 py-3 shadow-card">
          <p className="text-[14px] leading-[1.65] text-slate-700 whitespace-pre-line">{text}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
function UserMessage({ text }) {
  return (
    <div className="flex justify-end msg-enter">
      <div className="max-w-[78%] md:max-w-sm">
        <div className="bg-brand-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          <p className="text-[14px] leading-[1.65]">{text}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION CHIPS  — premium pill buttons with hover + selected states
// ─────────────────────────────────────────────────────────────────────────────
function OptionChips({ options, onSelect, multi = false }) {
  const [selected, setSelected] = useState([]);

  const toggle = (opt) => {
    if (!multi) { onSelect(opt); return; }
    setSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  return (
    <div className="msg-enter ml-12">
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium
                border transition-all duration-150 select-none
                ${active
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm scale-[0.98]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50'
                }
              `}
            >
              {active && <CheckIcon />}
              {opt}
            </button>
          );
        })}
      </div>
      {multi && selected.length > 0 && (
        <button
          onClick={() => { onSelect(selected.join(',')); setSelected([]); }}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition-all active:scale-[0.98]"
        >
          <CheckIcon />
          Confirm {selected.length} {selected.length === 1 ? 'selection' : 'selections'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR — thin, animated, lives inside the header
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ progress }) {
  return (
    <div className="h-[3px] bg-slate-100 w-full">
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-brand-400 to-brand-500 transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING  — animated SVG donut
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({ score, status }) {
  const [animated, setAnimated] = useState(0);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;
  const cfg = STATUS[status] || STATUS.low;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={cfg.ring} strokeWidth="9"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-slate-900 leading-none">{score}</span>
        <span className="text-[11px] text-slate-400 mt-1 font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RADAR CHART  — 6-axis spider chart
// ─────────────────────────────────────────────────────────────────────────────
function RadarChart({ breakdown }) {
  const entries = Object.entries(breakdown);
  if (entries.length < 3) return null;

  const cx = 110, cy = 110, R = 85;
  const n = entries.length;
  const angles = entries.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);

  const meta = entry => DIMENSION_META[entry[0]] || { max: 20, label: entry[0], icon: '•' };
  const pct  = entry => Math.min(entry[1] / meta(entry).max, 1);

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const radarPts = entries.map((e, i) => {
    const r = pct(e) * R;
    return { x: cx + r * Math.cos(angles[i]), y: cy + r * Math.sin(angles[i]) };
  });

  const gridPts = (level) =>
    angles.map(a => `${cx + level * R * Math.cos(a)},${cy + level * R * Math.sin(a)}`).join(' ');

  const radarPath = radarPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[240px] mx-auto">
      {/* Grid polygons */}
      {gridLevels.map(l => (
        <polygon key={l} points={gridPts(l)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <path d={radarPath} fill="rgba(46,58,255,0.12)" stroke="#2e3aff" strokeWidth="2" strokeLinejoin="round" />
      {/* Data dots */}
      {radarPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#2e3aff" stroke="white" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {entries.map((e, i) => {
        const labelR = R + 20;
        const lx = cx + labelR * Math.cos(angles[i]);
        const ly = cy + labelR * Math.sin(angles[i]);
        const m = meta(e);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#64748b" fontWeight="500">
            {m.icon} {m.label.split(' ')[0]}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE BREAKDOWN BARS
// ─────────────────────────────────────────────────────────────────────────────
function BreakdownBars({ breakdown }) {
  return (
    <div className="space-y-3">
      {Object.entries(breakdown).map(([key, val], idx) => {
        const meta = DIMENSION_META[key] || { icon: '•', label: key.replace(/_/g, ' '), max: 20 };
        const pct  = Math.min((val / meta.max) * 100, 100);
        const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#4a5eff' : pct >= 30 ? '#f59e0b' : '#ef4444';
        return (
          <div key={key} className="flex items-center gap-3" style={{ animationDelay: `${idx * 60}ms` }}>
            <span className="text-base w-5 flex-shrink-0">{meta.icon}</span>
            <span className="text-[12px] text-slate-500 w-28 flex-shrink-0 truncate">{meta.label}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color, transitionDelay: `${idx * 60}ms` }}
              />
            </div>
            <span className="text-[12px] font-mono font-medium text-slate-500 w-10 text-right flex-shrink-0">
              {val}/{meta.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETION SCREEN  — the premium result reveal
// ─────────────────────────────────────────────────────────────────────────────
function CompletionScreen({ score, status, breakdown, message, leadType }) {
  const cfg = STATUS[status] || STATUS.low;

  const strengths = Object.entries(breakdown || {}).filter(([k, v]) => {
    const meta = DIMENSION_META[k];
    return meta && (v / meta.max) >= 0.75;
  }).map(([k]) => DIMENSION_META[k]?.label || k);

  const weaknesses = Object.entries(breakdown || {}).filter(([k, v]) => {
    const meta = DIMENSION_META[k];
    return meta && (v / meta.max) < 0.4;
  }).map(([k]) => DIMENSION_META[k]?.label || k);

  const nextActions = {
    hot  : 'Schedule a founder discovery call.',
    good : 'Follow up with an introductory email.',
    maybe: 'Send a few follow-up questions to assess fit.',
    low  : 'Send a polite pass email and add to nurture sequence.',
  };

  return (
    <div className="animate-fadeIn px-2 pb-4">
      {/* Score reveal */}
      <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6 mb-4 text-center`}>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Overall Score
        </p>
        <div className="flex justify-center mb-4">
          <ScoreRing score={score} status={status} />
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${cfg.badge} mb-3`}>
          <span>{cfg.emoji}</span>
          <span>{cfg.label}</span>
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 space-y-4">
          {strengths.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-slate-800 mb-2">Strengths</p>
              <ul className="space-y-1.5">
                {strengths.slice(0, 4).map(s => (
                  <li key={s} className="text-[13px] text-slate-600 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-slate-800 mb-2">Needs Improvement</p>
              <ul className="space-y-1.5">
                {weaknesses.slice(0, 4).map(w => (
                  <li key={w} className="text-[13px] text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 font-bold mt-0.5">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Next action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Recommended Action</p>
        <p className="text-[14px] leading-relaxed font-medium">{nextActions[status]}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
function Landing({ onStart, loading, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(74,94,255,0.08) 0%, transparent 70%), #f8fafc' }}
    >
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-200 mb-5 animate-float">
            <SparkleIcon />
          </div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">LeadLens</h1>
          <p className="text-[14px] text-slate-500 mt-1.5 leading-relaxed">
            Intelligent qualification for founders & investors.<br/>Takes about 5 minutes.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {[
            {
              type : 'founder',
              emoji: '🚀',
              title: "I'm a Founder",
              sub  : 'Get qualified for Venturizer\'s programs',
              tag  : '~5 min · 20 questions',
              grad : 'from-brand-50 to-white',
              hover: 'hover:border-brand-300 hover:shadow-card-hover',
              btn  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200',
            },
            {
              type : 'investor',
              emoji: '💼',
              title: "I'm an Investor",
              sub  : 'Share your thesis and discover dealflow',
              tag  : '~4 min · 18 questions',
              grad : 'from-orange-50 to-white',
              hover: 'hover:border-orange-200 hover:shadow-card-hover',
              btn  : 'bg-accent-500 hover:bg-accent-600 shadow-orange-200',
            },
          ].map(c => (
            <button
              key={c.type}
              onClick={() => onStart(c.type)}
              disabled={loading}
              className={`
                w-full p-5 bg-gradient-to-br ${c.grad} rounded-2xl border border-slate-200/80
                text-left transition-all duration-200 shadow-card ${c.hover}
                disabled:opacity-60 disabled:cursor-not-allowed group
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-slate-900">{c.title}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{c.sub}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{c.tag}</p>
                </div>
                <div className={`
                  w-9 h-9 rounded-xl ${c.btn} text-white flex items-center justify-center
                  flex-shrink-0 shadow transition-transform duration-150 group-hover:translate-x-0.5
                `}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-5 text-[13px] text-slate-400">
            <span className="w-3 h-3 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
            Starting your session…
          </div>
        )}
        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 text-center">
            {error}
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400 mt-8">
          Your answers are secure and only used for qualification purposes.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT BAR  — the message composer
// ─────────────────────────────────────────────────────────────────────────────
function InputBar({ currentStep, onSend, onSkip, loading }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!loading) setTimeout(() => ref.current?.focus(), 80);
  }, [loading, currentStep?.step_key]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };
  const submit = () => {
    if (!value.trim() && currentStep?.required) return;
    onSend(value);
    setValue('');
  };

  if (!currentStep) return null;

  const placeholders = {
    email : 'your@email.com',
    phone : '+91 98765 43210',
    number: '0',
    url   : 'https://linkedin.com/in/you',
    text  : 'Type your answer…',
  };

  return (
    <div className="border-t border-slate-200/80 bg-white/90 backdrop-blur px-4 py-3">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <div className="flex-1 relative">
          <input
            ref={ref}
            type={currentStep.type === 'number' ? 'number' : currentStep.type === 'email' ? 'email' : 'text'}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholders[currentStep.type] || placeholders.text}
            className="
              w-full px-4 py-3 pr-16 rounded-xl border border-slate-200
              text-[14px] text-slate-800 placeholder-slate-400
              focus:outline-none focus:border-brand-400 focus:shadow-input-focus
              transition-all duration-150 bg-white
            "
          />
          {!currentStep.required && (
            <button
              onClick={() => { onSkip(); setValue(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
            >
              Skip
            </button>
          )}
        </div>
        <button
          onClick={submit}
          disabled={!value.trim() && currentStep.required}
          className="
            w-11 h-11 rounded-xl bg-brand-600 text-white
            flex items-center justify-center flex-shrink-0
            hover:bg-brand-700 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150 shadow-sm
          "
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT HEADER
// ─────────────────────────────────────────────────────────────────────────────
function ChatHeader({ leadType, progress, onBack }) {
  const steps = progress ? Math.round(progress / 5) : 0;
  return (
    <div>
      <header className="bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <SparkleIcon />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-slate-800">LeadLens</p>
          <p className="text-[11px] text-slate-400 capitalize">{leadType} qualification</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[11px] font-medium text-slate-500">
              {progress > 0 ? `Question ${Math.max(1, steps)} of ${leadType === 'founder' ? 20 : 18}` : 'Starting...'}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
        </div>
      </header>
      <ProgressBar progress={progress} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CHATBOT
// ─────────────────────────────────────────────────────────────────────────────
export default function Chatbot() {
  const [phase, setPhase]         = useState('landing');
  const [leadType, setLeadType]   = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [progress, setProgress]   = useState(0);
  const [completion, setCompletion] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const reset = () => {
    setPhase('landing'); setLeadType(null); setSessionId(null);
    setMessages([]); setCurrentStep(null); setProgress(0);
    setCompletion(null); setError(null);
  };

  const startSession = useCallback((type) => {
    setLeadType(type);
    setPhase('chatting');
    setSessionId('local_welcome');
    setMessages([
      { role: 'bot', text: `Welcome to LeadLens 👋\nI'll help understand your ${type === 'founder' ? 'startup' : 'investment profile'}.\n\nThe conversation takes around 4 minutes.\nYour progress is automatically saved.` },
      { role: 'bot', text: 'Ready to begin?' }
    ]);
    setCurrentStep({
      type: 'boolean',
      options: ['Yes'],
    });
    setProgress(0);
  }, []);

  const sendMessage = useCallback(async (value) => {
    if (loading) return;
    const display = Array.isArray(value) ? value.join(', ') : String(value);

    if (display.trim()) {
      setMessages(prev => [...prev, { role: 'user', text: display }]);
    }
    setLoading(true);
    setError(null);

    if (sessionId === 'local_welcome') {
      try {
        const data = await api.startSession(leadType);
        setSessionId(data.session_id);
        setCurrentStep(data);
        const intro = leadType === 'founder' 
          ? "Awesome! 🚀\nLet's begin by learning about your startup.\n\n" 
          : "Awesome! 🚀\nLet's begin by learning about your investment thesis.\n\n";
        setMessages(prev => [...prev, { role: 'bot', text: intro + data.question }]);
        setProgress(data.progress || 0);
      } catch {
        setError('Could not connect. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const data = await api.sendMessage(sessionId, value);

      if (data.completed) {
        setCompletion(data);
        setMessages(prev => [...prev, { role: 'bot', text: data.closing_message }]);
        setProgress(100);
        setCurrentStep(null);
        setPhase('done');
      } else {
        setCurrentStep(data);
        const fillers = ['Great!', 'Perfect.', 'Thanks for sharing that.', 'That\'s helpful.', 'Excellent.'];
        const filler = fillers[Math.floor(Math.random() * fillers.length)];
        setMessages(prev => [...prev, { role: 'bot', text: `${filler}\n\n${data.question}` }]);
        setProgress(data.progress || 0);
      }
    } catch (e) {
      if (e.status === 422) {
        setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
        setError(e.data?.error || 'Please check your answer and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading, leadType]);

  // ── LANDING ──────────────────────────────────────────────────────────────────
  if (phase === 'landing') {
    return <Landing onStart={startSession} loading={loading} error={error} />;
  }

  // ── CHAT ─────────────────────────────────────────────────────────────────────
  const showOptions = !loading && phase === 'chatting' && currentStep &&
    ['select', 'multiselect', 'boolean'].includes(currentStep.type);

  const showInput = !loading && phase === 'chatting' && currentStep &&
    !['select', 'multiselect', 'boolean'].includes(currentStep.type);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <ChatHeader
        leadType={leadType}
        progress={progress}
        onBack={reset}
      />

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg, i) => (
          msg.role === 'bot'
            ? <BotMessage key={i} text={msg.text} />
            : <UserMessage key={i} text={msg.text} />
        ))}

        {loading && <TypingIndicator />}

        {/* Option chips — appear below last bot message */}
        {showOptions && (
          <OptionChips
            options={currentStep.type === 'boolean' ? ['Yes', 'No'] : currentStep.options}
            onSelect={v => sendMessage(currentStep.type === 'boolean' ? v.toLowerCase() : v)}
            multi={currentStep.type === 'multiselect'}
          />
        )}

        {/* Completion */}
        {phase === 'done' && completion && (
          <CompletionScreen
            score={completion.score}
            status={completion.status}
            breakdown={completion.breakdown}
            message={completion.closing_message}
            leadType={leadType}
          />
        )}

        {/* Inline error */}
        {error && (
          <div className="ml-12 msg-enter">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {showInput && (
        <InputBar
          currentStep={currentStep}
          onSend={sendMessage}
          onSkip={() => sendMessage('')}
          loading={loading}
        />
      )}

      {/* Done footer */}
      {phase === 'done' && (
        <div className="border-t border-slate-200/80 bg-white/90 px-4 py-3 text-center">
          <button
            onClick={reset}
            className="text-[13px] text-brand-600 hover:text-brand-700 font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Start a new enquiry
          </button>
        </div>
      )}
    </div>
  );
}
