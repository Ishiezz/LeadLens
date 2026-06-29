import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Chatbot   from './components/chatbot/Chatbot';
import Dashboard from './components/dashboard/Dashboard';
import './index.css';

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center animate-fadeIn">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="text-[22px] font-bold text-slate-800 mb-2">Page not found</h1>
        <p className="text-[14px] text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-[13px] font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            Open Chatbot
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Chatbot />}   />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*"          element={<NotFound />}  />
      </Routes>
    </BrowserRouter>
  );
}
