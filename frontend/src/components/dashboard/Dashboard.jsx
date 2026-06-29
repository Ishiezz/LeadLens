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
function LeadRow({ lead, onClick }) {
  const cfg = STATUS[lead.status] || STATUS.low;
  return (
    <tr
      onClick={() => onClick(lead)}
      className="group cursor-pointer border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
    >
      {/* Avatar + Name */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] font-semibold text-slate-600">
              {lead.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
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

  return (
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
                      <LeadRow key={lead.id} lead={lead} onClick={openLead} />
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
