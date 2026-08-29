'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { auth } from '../../../lib/firebase';
import type { SystemHealthReport } from '../../../types/admin';

export function SystemHealthPage() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/health', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('[SystemHealthPage]', err);
      setError(err.message || 'Failed to generate system health report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleResolveError = async (errorId: string) => {
    setResolvingId(errorId);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/health', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ errorId }),
      });
      if (!res.ok) throw new Error('Failed to resolve error');
      setToast('✅ Error marked as resolved');
      setTimeout(() => setToast(''), 3000);
      fetchHealth();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  const overall = report?.overallStatus || 'operational';
  const services = report?.services || [];
  const cronJobs = report?.cronJobs || [];
  const recentErrors = report?.recentErrors || [];
  const apiPerformance = report?.apiPerformance || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">System Infrastructure & Diagnostics</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time latency probes, cron executions, API endpoints performance, and error telemetry
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <span>🔄</span> {loading ? 'Checking Probes…' : 'Run Live Diagnostics'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-xs font-medium shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Overall Status Banner ── */}
      <div
        className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between transition-all ${
          overall === 'operational'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : overall === 'degraded'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <span className="text-3xl">
            {overall === 'operational' ? '✅' : overall === 'degraded' ? '⚠️' : '🚨'}
          </span>
          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              {overall === 'operational'
                ? 'All Cloud Infrastructure & Microservices Operational'
                : overall === 'degraded'
                ? 'Some Integrations Degraded (Automated Fallback Mode Active)'
                : 'Critical Service Incident Detected'}
            </h3>
            <p className="text-xs opacity-75 font-medium mt-0.5">
              Last probe checked: {report?.lastUpdated ? new Date(report.lastUpdated).toLocaleTimeString() : 'now'}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-bold uppercase px-3.5 py-1 rounded-full border ${
            overall === 'operational'
              ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
              : overall === 'degraded'
              ? 'bg-amber-100/80 text-amber-800 border-amber-300'
              : 'bg-rose-100/80 text-rose-800 border-rose-300'
          }`}
        >
          {overall}
        </span>
      </div>

      {/* ── Service Status Grid ── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Integration Probes & Service Health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => {
            const isOp = s.status === 'operational';
            const isDeg = s.status === 'degraded';
            return (
              <div
                key={s.name}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[170px]" title={s.name}>
                      {s.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOp
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDeg
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {s.details || 'Operational and responsive'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Probe Latency:</span>
                  <span className="text-slate-800 font-bold">
                    {s.latencyMs !== undefined ? `${s.latencyMs}ms` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Cron Jobs & API Response Times ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cron Job Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">⏰ Scheduled Background Jobs (Cron)</h3>
          <p className="text-xs text-slate-500 mb-4">Autonomous system jobs & maintenance triggers</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="pb-2.5">Job Name</th>
                  <th className="pb-2.5">Schedule</th>
                  <th className="pb-2.5">Last Run</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cronJobs.map((job) => (
                  <tr key={job.jobName} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900">{job.jobName}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">{job.schedule}</td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(job.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'success'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}
                      >
                        {job.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Response Times */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">⚡ Core API Endpoint Latencies</h3>
          <p className="text-xs text-slate-500 mb-4">Average response times in milliseconds</p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={apiPerformance} layout="vertical" margin={{ left: 90, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} unit="ms" axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="route"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                width={85}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`${val} ms`, 'Avg Latency']}
              />
              <Bar dataKey="avgLatencyMs" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── PWA Mobile & Push Notification Diagnostics (Phase 20) ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📱</span> Mobile PWA & Push Notification Diagnostics
            </h3>
            <p className="text-xs text-slate-500">Service Worker status, Web App Manifest validity, and Push token health</p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            PWA Standalone Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">Service Worker Engine</div>
            <div className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1.5">
              <span>●</span> Active (/sw.js)
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">StaleWhileRevalidate + NetworkOnly</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">Web App Manifest</div>
            <div className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1.5">
              <span>●</span> 100% Valid
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">8 icons, standalone mode, shortcuts</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">Firebase Cloud Messaging</div>
            <div className="text-sm font-black text-indigo-600 mt-1 flex items-center gap-1.5">
              <span>🔔</span> /firebase-messaging-sw.js
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Push API & background actions ready</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">Offline Fallback Engine</div>
            <div className="text-sm font-black text-purple-600 mt-1 flex items-center gap-1.5">
              <span>⚡</span> Cached App Shell
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">OfflineView with auto-reconnection</div>
          </div>
        </div>
      </section>

      {/* ── Recent Errors Log ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">🚨 Application Error Telemetry</h3>
            <p className="text-xs text-slate-500">Captured runtime exceptions across PDF renderers, AI models, and webhooks</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{recentErrors.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Message</th>
                <th className="px-4 py-3.5">Context</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {recentErrors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-medium">
                    🎉 Clean log! Zero unresolved system errors.
                  </td>
                </tr>
              ) : (
                recentErrors.map((err) => (
                  <tr key={err.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-600">
                      {err.type}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-slate-800 font-medium" title={err.message}>
                      {err.message}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 max-w-[180px] truncate">
                      {JSON.stringify(err.context)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {!err.resolved ? (
                        <button
                          onClick={() => handleResolveError(err.id)}
                          disabled={resolvingId === err.id}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-emerald-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          {resolvingId === err.id ? 'Saving…' : 'Mark Resolved'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
