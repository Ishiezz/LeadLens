import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  hot  : { label: 'Hot',   emoji: '🔥', dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',     bar: '#ef4444' },
  good : { label: 'Good',  emoji: '✅', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: '#22c55e' },
  maybe: { label: 'Maybe', emoji: '🤔', dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',   bar: '#f59e0b' },
  low  : { label: 'Low',   emoji: '📋', dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 border-slate-200',   bar: '#94a3b8' },
};

const DIMENSION_META = {
  problem_clarity    : { icon: '🎯', label: 'Problem Clarity',     max: 15 },
  mvp_maturity       : { icon: '🛠️', label: 'MVP Maturity',        max: 20 },
  traction           : { icon: '📈', label: 'Traction',            max: 25 },
  team_strength      : { icon: '👥', label: 'Team Strength',       max: 15 },
  funding_readiness  : { icon: '💰', label: 'Funding Readiness',   max: 10 },
  validation_evidence: { icon: '✅', label: 'Validation',          max: 15 },
  thesis_alignment   : { icon: '🧠', label: 'Thesis Alignment',    max: 20 },
  stage_match        : { icon: '🎯', label: 'Stage Match',         max: 20 },
  cheque_fit         : { icon: '💵', label: 'Cheque Fit',          max: 15 },
  portfolio_experience:{ icon: '📂', label: 'Portfolio',           max: 15 },
  support_value      : { icon: '🤝', label: 'Support Value',       max: 15 },
  deployment_urgency : { icon: '⚡', label: 'Urgency',             max: 15 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-14 mb-2" />
      <Skeleton className="h-2.5 w-28" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      {[60, 40, 80, 50, 40].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={`h-3.5 w-${w === 60 ? '32' : w === 80 ? '24' : '16'}`} style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const CloseIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevronIcon = ({ dir = 'right' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {dir === 'right' && <path d="M9 18l6-6-6-6"/>}
    {dir === 'left'  && <path d="M15 18l-6-6 6-6"/>}
    {dir === 'down'  && <path d="M6 9l6 6 6-6"/>}
  </svg>
);
const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const NoteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.88 5.63L19.5 10l-5.62 1.37L12 17l-1.88-5.63L4.5 10l5.62-1.37z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'md' }) {
  const cfg = STATUS[status] || STATUS.low;
  const p = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${p} ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, trend, accent = false }) {
  return (
    <div className={`
      bg-white rounded-2xl border shadow-card p-5 transition-all duration-200 hover:shadow-card-hover
      ${accent ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-white' : 'border-slate-200'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-[28px] font-bold leading-none tracking-tight ${accent ? 'text-brand-700' : 'text-slate-900'}`}>
        {value ?? <Skeleton className="h-8 w-12" />}
      </p>
      {sub && <p className="text-[12px] text-slate-400 mt-1.5">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            {trend >= 0
              ? <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              : <path d="M12 22l-3.09-6.26L2 14.73l5-4.87-1.18-6.88L12 6.23l6.18-3.25L17 9.86 22 14.73l-6.91 1.01L12 22z"/>
            }
          </svg>
          {Math.abs(trend)}% this week
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL CHART
// ─────────────────────────────────────────────────────────────────────────────
function FunnelChart({ funnel }) {
  if (!funnel) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <Skeleton key={i} className="h-8" />)}
    </div>
  );
  const total   = Number(funnel.total_sessions) || 1;
  const done    = Number(funnel.completed) || 0;
  const abandon = Number(funnel.abandoned) || 0;
  const rate    = Math.round((done / total) * 100);

  const bars = [
    { label: 'Sessions Started', val: total, pct: 100,              color: 'bg-brand-100', text: 'text-brand-700' },
    { label: 'Completed',        val: done,  pct: (done/total)*100, color: 'bg-brand-500', text: 'text-white'     },
    { label: 'Abandoned',        val: abandon, pct: (abandon/total)*100, color: 'bg-slate-200', text: 'text-slate-600' },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[13px] font-semibold text-slate-700">Completion Funnel</p>
        <span className={`text-[12px] font-bold ${rate >= 60 ? 'text-emerald-600' : rate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
          {rate}% completion
        </span>
      </div>
      <div className="space-y-2.5">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-slate-500">{b.label}</span>
              <span className="text-[11px] font-semibold text-slate-600">{b.val}</span>
            </div>
            <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${b.color} rounded-lg flex items-center px-2 transition-all duration-700`}
                style={{ width: `${Math.max(b.pct, 4)}%` }}
              >
                {b.pct > 20 && <span className={`text-[10px] font-semibold ${b.text}`}>{Math.round(b.pct)}%</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI RADAR (for modal)
// ─────────────────────────────────────────────────────────────────────────────
function MiniRadar({ breakdown }) {
  const entries = Object.entries(breakdown || {});
  if (entries.length < 3) return null;
  const cx = 70, cy = 70, R = 52;
  const n = entries.length;
  const angles = entries.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);
  const meta = e => DIMENSION_META[e[0]] || { max: 20 };
  const pts = entries.map((e, i) => {
    const r = Math.min(e[1] / meta(e).max, 1) * R;
    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  });
  const gridPts = lv => angles.map(a => `${cx + lv * R * Math.cos(a)},${cy + lv * R * Math.sin(a)}`).join(' ');

  return (
    <svg viewBox="0 0 140 140" className="w-full">
      {[0.33, 0.66, 1].map(l => <polygon key={l} points={gridPts(l)} fill="none" stroke="#e2e8f0" strokeWidth="1" />)}
      {angles.map((a, i) => <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="#e2e8f0" strokeWidth="1" />)}
      <polygon points={pts.join(' ')} fill="rgba(46,58,255,0.15)" stroke="#2e3aff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING (small)
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRingSmall({ score, status }) {
  const cfg = STATUS[status] || STATUS.low;
  const r = 24, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center w-16 h-16">
      <svg width="64" height="64" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={cfg.bar} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <span className="absolute text-[14px] font-bold text-slate-800">{score}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAD ROW
// ─────────────────────────────────────────────────────────────────────────────
function LeadRow({ lead, onClick, compareMode, isSelected, onToggleSelect }) {
  const cfg = STATUS[lead.status] || STATUS.low;
  return (
    <tr
      onClick={() => compareMode ? onToggleSelect(lead) : onClick(lead)}
      className="group cursor-pointer border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
    >
      {/* Avatar or Checkbox */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {compareMode ? (
            <input 
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(lead)}
              onClick={e => e.stopPropagation()}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-[13px] font-semibold text-slate-600">
                {lead.full_name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-slate-800 group-hover:text-brand-600 transition-colors leading-tight">
              {lead.full_name}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{lead.email}</p>
          </div>
        </div>
      </td>
      {/* Type */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
          lead.type === 'founder'
            ? 'bg-brand-50 text-brand-700'
            : 'bg-orange-50 text-orange-700'
        }`}>
          {lead.type === 'founder' ? '🚀' : '💼'}
          {lead.type === 'founder' ? 'Founder' : 'Investor'}
        </span>
      </td>
      {/* Score */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${lead.score}%`, backgroundColor: cfg.bar }}
            />
          </div>
          <span className="text-[13px] font-bold font-mono text-slate-700 tabular-nums">{lead.score}</span>
        </div>
      </td>
      {/* Status */}
      <td className="px-4 py-3.5">
        <StatusBadge status={lead.status} size="sm" />
      </td>
      {/* Date */}
      <td className="px-4 py-3.5">
        <span className="text-[11px] text-slate-400">
          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
        </span>
      </td>
      {/* Action */}
      <td className="px-4 py-3.5">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
          <ChevronIcon dir="right" />
        </span>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITY/MATCH ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function getMatchScore(founder, investor) {
  let score = 0;
  const reasons = [];

  // 1. Sector Focus Alignment (Max 40 points)
  const preferredSectors = investor.preferred_sectors || [];
  const industry = founder.industry;
  const isAgnostic = preferredSectors.some(s => s.toLowerCase().includes('agnostic'));

  if (isAgnostic) {
    score += 40;
    reasons.push('Sector Agnostic (40 pts)');
  } else if (industry && preferredSectors.some(s => s.toLowerCase() === industry.toLowerCase())) {
    score += 40;
    reasons.push('Sector Match (40 pts)');
  } else if (industry && preferredSectors.some(s => {
    const keywords = s.toLowerCase().split(/[\s/]+/);
    return keywords.some(k => k.length > 2 && industry.toLowerCase().includes(k));
  })) {
    score += 20;
    reasons.push('Partial Sector Match (20 pts)');
  } else {
    reasons.push('No Sector Match (0 pts)');
  }

  // 2. Stage Focus Alignment (Max 30 points)
  const stageFocus = investor.stage_focus || [];
  const founderStage = founder.funding_stage;

  const mapStages = (stage) => {
    if (!stage) return [];
    const lower = stage.toLowerCase();
    if (lower.includes('pre-seed')) return ['pre-seed'];
    if (lower.includes('seed')) return ['seed'];
    if (lower.includes('series a')) return ['series a'];
    if (lower.includes('series b')) return ['series b+'];
    if (lower.includes('bootstrapped') || lower.includes('family')) return ['pre-seed', 'seed'];
    return [];
  };

  const investorTargetStages = stageFocus.flatMap(s => mapStages(s));
  const founderStages = mapStages(founderStage);
  const stageOverlap = founderStages.some(fs => investorTargetStages.includes(fs));

  if (stageOverlap) {
    score += 30;
    reasons.push('Stage Aligned (30 pts)');
  } else {
    reasons.push('Stage Mismatch (0 pts)');
  }

  // 3. Cheque Size Fit (Max 30 points)
  const typicalCheque = Number(investor.typical_cheque_usd) || 0;
  const minCheque = Number(investor.min_cheque_usd) || 0;
  const maxCheque = Number(investor.max_cheque_usd) || 0;
  const amountRaising = Number(founder.amount_raising_usd) || 0;

  if (amountRaising > 0 && typicalCheque > 0) {
    const isWithinRange = (minCheque > 0 && maxCheque > 0 && amountRaising >= minCheque && amountRaising <= maxCheque);
    const isWithinTypical = (amountRaising >= typicalCheque * 0.5 && amountRaising <= typicalCheque * 2);

    if (isWithinRange || isWithinTypical) {
      score += 30;
      reasons.push('Cheque Size Fit (30 pts)');
    } else if (amountRaising < typicalCheque * 5) {
      score += 15;
      reasons.push('Cheque Size Partial Fit (15 pts)');
    } else {
      reasons.push('Cheque Size Mismatch (0 pts)');
    }
  } else {
    score += 15;
    reasons.push('Cheque Data Incomplete (15 pts)');
  }

  return { score, reasons };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUGGESTED MATCH PANEL
// ─────────────────────────────────────────────────────────────────────────────
function MatchSuggestions({ leads, onOpenLead }) {
  const [isOpen, setIsOpen] = useState(true);

  const matches = React.useMemo(() => {
    const founders = leads.filter(l => l.type === 'founder');
    const investors = leads.filter(l => l.type === 'investor');
    const list = [];
    founders.forEach(f => {
      investors.forEach(i => {
        const res = getMatchScore(f, i);
        if (res.score >= 50) {
          list.push({ founder: f, investor: i, score: res.score, reasons: res.reasons });
        }
      });
    });
    return list.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [leads]);

  if (matches.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden transition-all animate-fadeIn">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px]">🤝</span>
          <p className="text-[13px] font-bold text-slate-800">Suggested Partner Matches</p>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
            {matches.length} Match{matches.length > 1 ? 'es' : ''}
          </span>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-slate-500`}>
          <ChevronIcon dir="down" />
        </div>
      </button>

      {isOpen && (
        <div className="p-5 divide-y divide-slate-100">
          {matches.map((m, idx) => (
            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-4 flex-1">
                {/* Founder Card */}
                <div 
                  onClick={() => onOpenLead(m.founder)}
                  className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-brand-300 hover:bg-white cursor-pointer transition-all group"
                >
                  <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">🚀 Founder / Startup</p>
                  <p className="text-[13px] font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{m.founder.full_name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{m.founder.startup_name} · <span className="text-slate-400">{m.founder.industry}</span></p>
                </div>

                {/* Match indicator */}
                <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm">
                    <span className="text-[12px] font-bold text-emerald-700">{m.score}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">MATCH</span>
                </div>

                {/* Investor Card */}
                <div 
                  onClick={() => onOpenLead(m.investor)}
                  className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-brand-300 hover:bg-white cursor-pointer transition-all group"
                >
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">💼 Investor / Firm</p>
                  <p className="text-[13px] font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{m.investor.full_name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{m.investor.firm_name} · <span className="text-slate-400">${Number(m.investor.typical_cheque_usd).toLocaleString()} cheque</span></p>
                </div>
              </div>

              {/* Match reasons */}
              <div className="flex flex-wrap gap-1.5 md:max-w-xs justify-end">
                {m.reasons.map((r, i) => {
                  const isPositive = !r.includes('No ') && !r.includes('Mismatch') && !r.includes('Incomplete');
                  if (!isPositive) return null;
                  return (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      ✓ {r.split(' (')[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARE RADAR (for overlays)
// ─────────────────────────────────────────────────────────────────────────────
function CompareRadar({ breakdownA, breakdownB }) {
  const entriesA = Object.entries(breakdownA || {});
  
  if (entriesA.length < 3) return null;
  const cx = 70, cy = 70, R = 52;
  const n = entriesA.length;
  const angles = entriesA.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);
  const meta = e => DIMENSION_META[e[0]] || { max: 20 };

  const ptsA = entriesA.map((e, i) => {
    const r = Math.min(e[1] / meta(e).max, 1) * R;
    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  });

  const ptsB = entriesA.map((e, i) => {
    const val = breakdownB[e[0]] || 0;
    const r = Math.min(val / meta(e).max, 1) * R;
    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
  });

  const gridPts = lv => angles.map(a => `${cx + lv * R * Math.cos(a)},${cy + lv * R * Math.sin(a)}`).join(' ');

  return (
    <svg viewBox="0 0 140 140" className="w-full">
      {[0.33, 0.66, 1].map(l => <polygon key={l} points={gridPts(l)} fill="none" stroke="#e2e8f0" strokeWidth="1" />)}
      {angles.map((a, i) => <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="#e2e8f0" strokeWidth="1" />)}

      {/* Lead A - Blue */}
      <polygon points={ptsA.join(' ')} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Lead B - Amber */}
      <polygon points={ptsB.join(' ')} fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Mini dots */}
      {ptsA.map((p, i) => {
        const [x, y] = p.split(',');
        return <circle key={`a-${i}`} cx={x} cy={y} r="2" fill="#3b82f6" />;
      })}
      {ptsB.map((p, i) => {
        const [x, y] = p.split(',');
        return <circle key={`b-${i}`} cx={x} cy={y} r="2" fill="#f59e0b" />;
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARE MODAL (side-by-side)
// ─────────────────────────────────────────────────────────────────────────────
function CompareModal({ leadA, leadB, onClose }) {
  const breakdownA = leadA.score_breakdown || {};
  const breakdownB = leadB.score_breakdown || {};
  const sameType = leadA.type === leadB.type;

  const fieldsToCompare = sameType 
    ? (leadA.type === 'founder' 
      ? [
          { key: 'startup_name', label: 'Startup Name' },
          { key: 'industry', label: 'Industry' },
          { key: 'funding_stage', label: 'Funding Stage' },
          { key: 'amount_raising_usd', label: 'Raising (USD)', isCurrency: true },
          { key: 'mvp_status', label: 'MVP Status' },
          { key: 'active_users', label: 'Active Users' },
          { key: 'monthly_revenue', label: 'MRR (USD)', isCurrency: true },
          { key: 'growth_rate_pct', label: 'Growth Rate', isPct: true },
          { key: 'team_size', label: 'Team Size' },
          { key: 'has_technical_cofounder', label: 'Technical Co-founder', isBool: true },
          { key: 'has_paying_customers', label: 'Paying Customers', isBool: true },
        ]
      : [
          { key: 'firm_name', label: 'Firm Name' },
          { key: 'typical_cheque_usd', label: 'Typical Cheque', isCurrency: true },
          { key: 'min_cheque_usd', label: 'Min Cheque', isCurrency: true },
          { key: 'max_cheque_usd', label: 'Max Cheque', isCurrency: true },
          { key: 'stage_focus', label: 'Stage Focus', isArray: true },
          { key: 'preferred_sectors', label: 'Preferred Sectors', isArray: true },
          { key: 'portfolio_size', label: 'Portfolio Size' },
          { key: 'geography_focus', label: 'Geography Focus', isArray: true },
          { key: 'support_type', label: 'Support Value', isArray: true },
          { key: 'involvement_level', label: 'Involvement Level' },
          { key: 'deployment_timeline', label: 'Deployment Timeline' },
        ])
    : [
        { key: 'startup_name', label: 'Startup / Firm Name', otherKey: 'firm_name' },
        { key: 'industry', label: 'Industry / Preferred Sectors', otherKey: 'preferred_sectors', isArrayB: true },
        { key: 'funding_stage', label: 'Stage / Focus Stages', otherKey: 'stage_focus', isArrayB: true },
        { key: 'amount_raising_usd', label: 'Raising / Typical Cheque', otherKey: 'typical_cheque_usd', isCurrency: true },
      ];

  const fmtVal = (val, opt = {}) => {
    if (val === null || val === undefined) return '—';
    if (opt.isBool) return val ? 'Yes' : 'No';
    if (opt.isArray) return Array.isArray(val) ? val.join(', ') : String(val);
    if (opt.isCurrency) return `$${Number(val).toLocaleString()}`;
    if (opt.isPct) return `${val}%`;
    return String(val);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-modal overflow-hidden flex flex-col animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Lead Comparison</h2>
            <p className="text-[12px] text-slate-500">Comparing {leadA.full_name} and {leadB.full_name}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 bg-white border border-slate-200 shadow-sm"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Cards */}
          <div className="grid grid-cols-2 gap-6">
            {[leadA, leadB].map((l, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: idx === 1 ? '#f59e0b' : '#3b82f6' }} />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <span className="text-[15px] font-bold text-slate-700">{l.full_name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-800 leading-tight">{l.full_name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{l.email}</p>
                    </div>
                  </div>
                  <ScoreRingSmall score={l.score} status={l.status} />
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={l.status} size="sm" />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    l.type === 'founder' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {l.type === 'founder' ? '🚀 Founder' : '💼 Investor'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Radar and Scores */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 w-full">Opportunity Radar</p>
              {sameType ? (
                <div className="w-52 h-52">
                  <CompareRadar breakdownA={breakdownA} breakdownB={breakdownB} />
                </div>
              ) : (
                <div className="flex gap-4 justify-around w-full">
                  <div className="w-24 h-24 text-center">
                    <p className="text-[9px] font-semibold text-slate-400 mb-1 truncate max-w-[80px]">{leadA.full_name}</p>
                    <MiniRadar breakdown={breakdownA} />
                  </div>
                  <div className="w-24 h-24 text-center">
                    <p className="text-[9px] font-semibold text-slate-400 mb-1 truncate max-w-[80px]">{leadB.full_name}</p>
                    <MiniRadar breakdown={breakdownB} />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Qualification Breakdown</p>
              <div className="space-y-3">
                {sameType ? (
                  Object.keys(DIMENSION_META)
                    .filter(k => breakdownA[k] !== undefined || breakdownB[k] !== undefined)
                    .map(k => {
                      const meta = DIMENSION_META[k];
                      const pctA = Math.round((breakdownA[k] / meta.max) * 100) || 0;
                      const pctB = Math.round((breakdownB[k] / meta.max) * 100) || 0;
                      return (
                        <div key={k} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-slate-600">
                            <span>{meta.icon} {meta.label}</span>
                            <span className="font-mono text-[10px]">
                              <span className="text-blue-500 font-bold">{breakdownA[k] || 0}</span>
                              <span className="text-slate-300 mx-1">/</span>
                              <span className="text-amber-500 font-bold">{breakdownB[k] || 0}</span>
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full flex overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${pctA / 2}%` }} />
                            <div className="h-full bg-amber-500 transition-all border-l border-white" style={{ width: `${pctB / 2}%` }} />
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-blue-500 uppercase truncate">{leadA.full_name}</p>
                      {Object.keys(breakdownA).map(k => {
                        const meta = DIMENSION_META[k] || { icon: '•', label: k, max: 20 };
                        return (
                          <div key={k} className="text-[10px] pr-2">
                            <div className="flex justify-between text-slate-500 font-medium">
                              <span className="truncate max-w-[80px]">{meta.label}</span>
                              <span className="font-mono">{breakdownA[k]}/{meta.max}</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                              <div className="h-full bg-blue-500" style={{ width: `${(breakdownA[k] / meta.max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-2 pl-4">
                      <p className="text-[10px] font-bold text-amber-500 uppercase truncate">{leadB.full_name}</p>
                      {Object.keys(breakdownB).map(k => {
                        const meta = DIMENSION_META[k] || { icon: '•', label: k, max: 20 };
                        return (
                          <div key={k} className="text-[10px]">
                            <div className="flex justify-between text-slate-500 font-medium">
                              <span className="truncate max-w-[80px]">{meta.label}</span>
                              <span className="font-mono">{breakdownB[k]}/{meta.max}</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                              <div className="h-full bg-amber-500" style={{ width: `${(breakdownB[k] / meta.max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile comparison table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-1/3">Profile Metric</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-blue-500 uppercase tracking-widest w-1/3">{leadA.full_name}</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-amber-500 uppercase tracking-widest w-1/3">{leadB.full_name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fieldsToCompare.map((f, i) => {
                  const valA = leadA[f.key];
                  const valB = sameType ? leadB[f.key] : leadB[f.otherKey];

                  return (
                    <tr key={i} className="hover:bg-slate-50/20">
                      <td className="px-5 py-3 text-[12px] font-semibold text-slate-500">{f.label}</td>
                      <td className="px-5 py-3 text-[13px] font-semibold text-slate-800">
                        {fmtVal(valA, { isBool: f.isBool, isArray: f.isArray || f.isArrayA, isCurrency: f.isCurrency, isPct: f.isPct })}
                      </td>
                      <td className="px-5 py-3 text-[13px] font-semibold text-slate-800">
                        {fmtVal(valB, { isBool: f.isBool, isArray: f.isArray || f.isArrayB, isCurrency: f.isCurrency, isPct: f.isPct })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ filtered }) {
  return (
    <div className="py-20 flex flex-col items-center gap-4 animate-fadeIn">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2 shadow-sm border border-slate-100">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[16px] font-bold text-slate-800 mb-1.5">
          {filtered ? 'No matches found' : 'Ready for your first lead'}
        </p>
        <p className="text-[13px] text-slate-500 max-w-[260px] leading-relaxed mx-auto">
          {filtered
            ? 'We couldn\'t find any leads matching your current filters. Try adjusting them.'
            : 'Share your chatbot link with founders and investors to start seeing qualified leads here.'}
        </p>
      </div>
      {!filtered && (
        <button
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-all active:scale-[0.98]"
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin);
            // using standard alert as fallback if no toast passed here
            alert('Link copied to clipboard!'); 
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Chatbot Link
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER CHIPS
// ─────────────────────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 rounded-full text-[11px] font-semibold">
      {label}
      <button onClick={onRemove} className="hover:text-brand-900 transition-colors">
        <CloseIcon size={10} />
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`
      fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3
      rounded-xl shadow-modal text-[13px] font-medium animate-slideUp
      ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'}
    `}>
      {type === 'success'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAD DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function LeadModal({ lead, onClose, onToast }) {
  const [notes, setNotes] = useState(lead.internal_notes || '');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('overview');

  const saveNotes = async () => {
    setSaving(true);
    try {
      await api.updateNotes(lead.type, lead.id, notes);
      onToast('Notes saved successfully');
    } catch {
      onToast('Failed to save notes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cfg = STATUS[lead.status] || STATUS.low;

  const founderFields = {
    'Startup': [
      { key: 'startup_name', label: 'Startup Name' },
      { key: 'industry',     label: 'Industry'     },
      { key: 'funding_stage',label: 'Stage'        },
      { key: 'role_in_startup', label: 'Role'      },
    ],
    'Product': [
      { key: 'mvp_status',      label: 'MVP Status'  },
      { key: 'active_users',    label: 'Users'       },
      { key: 'monthly_revenue', label: 'MRR (USD)'   },
      { key: 'growth_rate_pct', label: 'MoM Growth'  },
    ],
    'Team': [
      { key: 'team_size',               label: 'Team Size'         },
      { key: 'has_technical_cofounder', label: 'Tech Co-founder'   },
    ],
    'Funding': [
      { key: 'amount_raising_usd', label: 'Raising (USD)' },
      { key: 'has_paying_customers', label: 'Paying Customers' },
    ],
  };

  const investorFields = {
    'Firm': [
      { key: 'firm_name',    label: 'Firm'          },
      { key: 'stage_focus',  label: 'Stages'        },
      { key: 'typical_cheque_usd', label: 'Cheque (USD)' },
    ],
    'Focus': [
      { key: 'preferred_sectors', label: 'Sectors'   },
      { key: 'geography_focus',   label: 'Geography' },
    ],
    'Deployment': [
      { key: 'deployment_timeline', label: 'Timeline'    },
      { key: 'num_deals_per_year',  label: 'Deals / Year'},
      { key: 'involvement_level',   label: 'Involvement' },
    ],
  };

  const fields = lead.type === 'founder' ? founderFields : investorFields;

  const fmt = v => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean')        return v ? 'Yes' : 'No';
    if (Array.isArray(v))              return v.join(', ') || '—';
    if (typeof v === 'number')         return v.toLocaleString('en-IN');
    return String(v) || '—';
  };

  const breakdown = lead.score_breakdown && typeof lead.score_breakdown === 'object'
    ? lead.score_breakdown
    : {};

  const timeline = [
    { icon: '💬', label: 'Conversation started',  time: lead.created_at, done: true },
    { icon: '✅', label: 'Qualification completed', time: lead.created_at, done: true },
    { icon: '🏷️', label: `Scored ${lead.score}/100 · ${cfg.label}`, time: lead.created_at, done: true },
    { icon: '📝', label: 'Notes added',            time: lead.updated_at, done: !!lead.internal_notes },
    { icon: '📞', label: 'Meeting scheduled',      time: null,            done: false },
  ];

  const strengths = Object.entries(breakdown || {})
    .filter(([k,v]) => DIMENSION_META[k] && (v/DIMENSION_META[k].max) >= 0.75)
    .map(([k]) => DIMENSION_META[k]?.label);

  const weaknesses = Object.entries(breakdown || {})
    .filter(([k,v]) => DIMENSION_META[k] && (v/DIMENSION_META[k].max) < 0.4)
    .map(([k]) => DIMENSION_META[k]?.label);

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end p-0 md:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 w-full md:max-w-2xl h-full md:h-auto md:max-h-[96vh] md:rounded-2xl shadow-modal overflow-hidden flex flex-col animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header — Snapshot card */}
        <div className={`px-6 pt-6 pb-5 border-b border-slate-200/80 bg-white sticky top-0 z-10`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/60 shadow-sm flex items-center justify-center">
                <span className="text-[18px] font-bold text-slate-700">
                  {lead.full_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-slate-900 leading-tight">{lead.full_name}</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreRingSmall score={lead.score} status={lead.status} />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 bg-white border border-slate-200 shadow-sm"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={lead.status} />
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              lead.type === 'founder'
                ? 'bg-brand-50 text-brand-700 border-brand-200'
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              {lead.type === 'founder' ? '🚀 Founder' : '💼 Investor'}
            </span>
            {lead.type === 'founder' && lead.startup_name && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {lead.startup_name}
              </span>
            )}
            {lead.type === 'founder' && lead.industry && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {lead.industry}
              </span>
            )}
          </div>
        </div>

        {/* Tab content (Replaced with Single Scrollable View) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Why This Status? Explainer ── */}
          {(() => {
            const statusConfig = STATUS[lead.status] || STATUS.low;
            const dims = Object.entries(breakdown)
              .filter(([k]) => DIMENSION_META[k])
              .map(([k, v]) => ({ key: k, label: DIMENSION_META[k].label, score: v, max: DIMENSION_META[k].max, pct: Math.round((v / DIMENSION_META[k].max) * 100) }))
              .sort((a, b) => b.pct - a.pct);
            
            const topStrengths = dims.filter(d => d.pct >= 70).slice(0, 3);
            const topWeaknesses = dims.filter(d => d.pct < 40).slice(0, 3);
            
            const statusMessages = {
              hot: `${lead.full_name} is a high-priority ${lead.type} lead scoring ${lead.score}/100.`,
              good: `${lead.full_name} shows strong potential as a ${lead.type} lead with a score of ${lead.score}/100.`,
              maybe: `${lead.full_name} is a moderate-priority ${lead.type} lead scoring ${lead.score}/100 — worth monitoring.`,
              low: `${lead.full_name} is currently a low-priority ${lead.type} lead at ${lead.score}/100.`,
            };

            const strengthText = topStrengths.length > 0
              ? `Strong in ${topStrengths.map(d => d.label).join(', ')}.`
              : '';
            const weaknessText = topWeaknesses.length > 0
              ? `Areas to improve: ${topWeaknesses.map(d => d.label).join(', ')}.`
              : '';

            const actionMessages = {
              hot: 'Recommended action: Schedule a call this week.',
              good: 'Recommended action: Add to follow-up pipeline.',
              maybe: 'Recommended action: Monitor for progress updates.',
              low: 'Recommended action: Keep in backlog for now.',
            };

            return dims.length > 0 ? (
              <div className={`rounded-2xl p-5 border shadow-sm ${
                lead.status === 'hot' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200/60' :
                lead.status === 'good' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200/60' :
                lead.status === 'maybe' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200/60' :
                'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[16px]">{statusConfig.emoji}</span>
                  <p className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">
                    Why {statusConfig.label}?
                  </p>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed">
                  {statusMessages[lead.status] || statusMessages.low}{' '}
                  {strengthText}{' '}
                  {weaknessText}{' '}
                  {actionMessages[lead.status] || ''}
                </p>

                {/* Score dimension mini-bars */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                  {dims.map(d => (
                    <div key={d.key} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-medium w-20 truncate">{d.label}</span>
                      <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            d.pct >= 75 ? 'bg-emerald-500' : d.pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">{d.score}/{d.max}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          
          {/* Qualification Summary */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center">
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Qualification Summary</p>
                {strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">✦ Strengths</p>
                    {strengths.slice(0, 3).map(s => (
                      <div key={s} className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-[12px] text-slate-700">{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1.5">△ Improve</p>
                    {weaknesses.slice(0, 3).map(w => (
                      <div key={w} className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-[12px] text-slate-700">{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 w-full text-left">Opportunity Radar</p>
              <div className="w-40 h-40">
                <MiniRadar breakdown={breakdown} />
              </div>
            </div>
          </div>

          {/* OVERVIEW FIELDS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Profile Details</p>
            {Object.entries(fields).map(([group, flds]) => (
              <div key={group}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{group}</p>
                <div className="grid grid-cols-2 gap-3">
                  {flds.map(({ key, label }) => (
                    <div key={key} className="bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-medium mb-0.5">{label}</p>
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{fmt(lead[key])}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Problem / Thesis */}
            {lead.type === 'founder' && lead.problem_statement && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Problem Statement</p>
                <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <p className="text-[13px] text-slate-700 leading-relaxed">{lead.problem_statement}</p>
                </div>
              </div>
            )}
            {lead.type === 'investor' && lead.thesis_summary && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Investment Thesis</p>
                <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <p className="text-[13px] text-slate-700 leading-relaxed">{lead.thesis_summary}</p>
                </div>
              </div>
            )}
          </div>

          {/* TIMELINE & NOTES Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* TIMELINE */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Conversation</p>
              <div className="relative pl-1">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-100" />
                <div className="space-y-4">
                  {timeline.map((e, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-[15px] flex-shrink-0 relative z-10 transition-colors
                        ${e.done ? 'bg-white border-[3px] border-brand-100 shadow-sm' : 'bg-slate-50 border-[3px] border-slate-100'}
                      `}>
                        {e.done ? e.icon : <span className="text-slate-300 opacity-50">{e.icon}</span>}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className={`text-[13px] font-semibold ${e.done ? 'text-slate-800' : 'text-slate-400'}`}>
                          {e.label}
                        </p>
                        {e.time && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(e.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <NoteIcon /> Internal Notes
                </p>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this lead — e.g. spoke with CEO, follow up in 2 weeks…"
                className="
                  flex-1 w-full text-[13px] border border-slate-200 rounded-xl px-4 py-3
                  resize-none focus:outline-none focus:border-brand-400 focus:shadow-input-focus
                  text-slate-700 placeholder-slate-400 transition-all leading-relaxed bg-slate-50
                "
              />
              <button
                onClick={saveNotes}
                disabled={saving || notes === lead.internal_notes}
                className="
                  mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-semibold
                  bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400
                  transition-all active:scale-[0.98] shadow-sm
                "
              >
                {saving
                  ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> Saving…</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Notes</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [leads, setLeads]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [filters, setFilters] = useState({ type: '', status: '', search: '', page: 1 });
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  const searchRef = useRef(null);

  // ── Compare mode state ──
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // ── All leads for matching engine ──
  const [allLeads, setAllLeads] = useState([]);
  useEffect(() => {
    api.getAllLeads()
      .then(res => setAllLeads(res.data || []))
      .catch(() => {});
  }, [leads]); // refresh when paginated leads change (e.g. new lead added)

  const toggleCompareSelect = useCallback((lead) => {
    setSelectedForCompare(prev => {
      const exists = prev.find(l => l.id === lead.id && l.type === lead.type);
      if (exists) return prev.filter(l => !(l.id === lead.id && l.type === lead.type));
      if (prev.length >= 2) return prev; // max 2
      return [...prev, lead];
    });
  }, []);

  const exitCompareMode = useCallback(() => {
    setCompareMode(false);
    setSelectedForCompare([]);
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 320);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const p = { page: filters.page, limit: 15 };
      if (filters.type)        p.type   = filters.type;
      if (filters.status)      p.status = filters.status;
      if (debouncedSearch)     p.search = debouncedSearch;
      const data = await api.getLeads(p);
      setLeads(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [filters.type, filters.status, filters.page, debouncedSearch]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const openLead = async (lead) => {
    try {
      const full = await api.getLead(lead.type, lead.id);
      setSelectedLead({ ...full, type: lead.type });
    } catch {
      setSelectedLead(lead);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const statusCounts = stats?.by_status?.reduce((acc, r) => {
    acc[r.status] = Number(r.count); return acc;
  }, {}) || {};

  const hasFilters = !!(filters.type || filters.status || filters.search);

  const clearFilters = () => setFilters(f => ({ ...f, type: '', status: '', search: '', page: 1 }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topnav */}
      <nav className="bg-white/90 backdrop-blur border-b border-slate-200/80 px-6 py-0 flex items-center h-14 sticky top-0 z-40">
        <div className="flex items-center gap-2.5 mr-8">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <SparkleIcon />
          </div>
          <span className="text-[14px] font-bold text-slate-900">LeadLens</span>
        </div>

        <div className="flex items-center gap-1 text-[12px]">
          {['Dashboard'].map(item => (
            <button key={item} className="px-3 py-1.5 rounded-lg text-brand-600 font-semibold bg-brand-50 transition-colors">
              {item}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-slate-400">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[12px] font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <ExternalIcon />
            Open Chatbot
          </a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-7 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Lead Pipeline</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Track and qualify inbound founders and investors</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading
            ? [1,2,3,4].map(i => <StatCardSkeleton key={i} />)
            : <>
                <StatCard label="Total Leads"   value={stats?.total_leads}    icon="👥" accent />
                <StatCard label="Avg. Score"    value={stats?.average_score}  icon="⚡" sub="out of 100" />
                <StatCard label="Hot Leads 🔥"  value={statusCounts.hot ?? 0} sub="Score ≥ 80" />
                <StatCard label="Good Leads ✅" value={statusCounts.good ?? 0} sub="Score 60–79" />
              </>
          }
        </div>

        {/* Secondary row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Founder vs Investor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Type Distribution</p>
            {statsLoading
              ? <div className="space-y-3"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
              : (stats?.by_type || []).map(t => {
                  const total_ = stats?.total_leads || 1;
                  const pct    = Math.round((Number(t.count) / total_) * 100);
                  return (
                    <div key={t.type} className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-semibold text-slate-700">
                          {t.type === 'founder' ? '🚀 Founders' : '💼 Investors'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">avg {t.avg_score}</span>
                          <span className="text-[13px] font-bold text-slate-700">{t.count}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${t.type === 'founder' ? 'bg-brand-500' : 'bg-accent-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {/* Status distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Status Breakdown</p>
            {statsLoading
              ? <div className="space-y-2"><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6" /></div>
              : Object.entries(STATUS).map(([key, cfg]) => {
                  const count = statusCounts[key] ?? 0;
                  const pct   = total > 0 ? (count / (stats?.total_leads || 1)) * 100 : 0;
                  return (
                    <div key={key} className="flex items-center gap-2.5 mb-2.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                      <span className="text-[12px] text-slate-600 flex-1">{cfg.label}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.bar }} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-700 w-5 text-right">{count}</span>
                    </div>
                  );
                })
            }
          </div>

          {/* Funnel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            {statsLoading
              ? <div className="space-y-3"><Skeleton className="h-4 w-32 mb-4" /><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
              : <FunnelChart funnel={stats?.funnel} />
            }
          </div>
        </div>

        {/* ── Suggested Matches Section ── */}
        {allLeads.length > 0 && (
          <MatchSuggestions leads={allLeads} onOpenLead={openLead} />
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">

          {/* Table toolbar */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </div>
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search by name or email…"
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                  className="w-full pl-9 pr-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-brand-400 focus:shadow-input-focus transition-all placeholder-slate-400"
                />
              </div>

              {/* Type filter */}
              <select
                value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}
                className="px-3 py-2 text-[12px] font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-brand-400 text-slate-600 bg-white transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="founder">🚀 Founders</option>
                <option value="investor">💼 Investors</option>
              </select>

              {/* Status filter */}
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                className="px-3 py-2 text-[12px] font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-brand-400 text-slate-600 bg-white transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="hot">🔥 Hot</option>
                <option value="good">✅ Good</option>
                <option value="maybe">🤔 Maybe</option>
                <option value="low">📋 Low</option>
              </select>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-[12px] font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all whitespace-nowrap"
                >
                  Clear
                </button>
              )}

              {/* Compare Toggle */}
              <button
                onClick={() => compareMode ? exitCompareMode() : setCompareMode(true)}
                className={`px-3 py-2 text-[12px] font-semibold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  compareMode
                    ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                {compareMode ? 'Exit Compare' : 'Compare'}
              </button>
            </div>

            {/* Active filter chips */}
            {hasFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400">Filters:</span>
                {filters.type   && <FilterChip label={filters.type === 'founder' ? '🚀 Founders' : '💼 Investors'} onRemove={() => setFilters(f => ({ ...f, type: '', page: 1 }))} />}
                {filters.status && <FilterChip label={STATUS[filters.status]?.label || filters.status} onRemove={() => setFilters(f => ({ ...f, status: '', page: 1 }))} />}
                {filters.search && <FilterChip label={`"${filters.search}"`} onRemove={() => setFilters(f => ({ ...f, search: '', page: 1 }))} />}
                <span className="text-[11px] text-slate-400 ml-auto">{total} result{total !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {['Contact', 'Type', 'Score', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsLoading
                  ? [1,2,3,4,5].map(i => <TableRowSkeleton key={i} />)
                  : leads.length === 0
                    ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState filtered={hasFilters} />
                        </td>
                      </tr>
                    )
                    : leads.map(lead => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        onClick={openLead}
                        compareMode={compareMode}
                        isSelected={selectedForCompare.some(l => l.id === lead.id && l.type === lead.type)}
                        onToggleSelect={toggleCompareSelect}
                      />
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <div className="text-[12px] text-slate-400">
              {!leadsLoading && total > 0 && (
                <>Showing {Math.min((filters.page - 1) * 15 + 1, total)}–{Math.min(filters.page * 15, total)} of {total}</>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filters.page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronIcon dir="left" />
              </button>
              <span className="px-3 py-1 text-[12px] font-semibold text-slate-600 bg-slate-100 rounded-lg">
                {filters.page}
              </span>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page * 15 >= total}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronIcon dir="right" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Compare Bar */}
      {compareMode && selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slideUp">
          <div className="bg-slate-900 text-white rounded-2xl shadow-modal px-5 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              {selectedForCompare.map((l, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-[12px] font-semibold">
                  {l.full_name}
                  <button
                    onClick={() => toggleCompareSelect(l)}
                    className="hover:text-red-300 transition-colors"
                  >
                    <CloseIcon size={10} />
                  </button>
                </span>
              ))}
              {selectedForCompare.length < 2 && (
                <span className="text-[11px] text-slate-400">Select {2 - selectedForCompare.length} more…</span>
              )}
            </div>
            <button
              disabled={selectedForCompare.length < 2}
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-[12px] font-bold hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Compare
            </button>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && selectedForCompare.length === 2 && (
        <CompareModal
          leadA={selectedForCompare[0]}
          leadB={selectedForCompare[1]}
          onClose={() => {
            setShowCompareModal(false);
            exitCompareMode();
          }}
        />
      )}

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
