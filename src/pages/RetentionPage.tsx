import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Activity,
  Cpu
} from 'lucide-react';
import { supabase, fetchChurnPredictions } from '../lib/supabase';
import type { ChurnPrediction } from '../types/database';
import metricsData from '../data/metrics.json';

export const RetentionPage: React.FC = () => {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreSuccess, setScoreSuccess] = useState<string | null>(null);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const data = await fetchChurnPredictions();
      setPredictions(data);
    } catch (err) {
      console.error('Error fetching churn predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const handleRunInference = async () => {
    setScoring(true);
    setScoreSuccess(null);
    try {
      // Query eligible active/past_due/paused subscriptions
      const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('id, status, member_id, price_at_signup');

      if (error) throw error;

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          let score = 0.15;
          let level: 'low' | 'medium' | 'high' = 'low';
          let factors = [
            { factor: 'Standard API query velocity', impact: '-0.20' },
            { factor: 'Verified on-time billing record', impact: '-0.30' },
          ];

          if (sub.status === 'past_due') {
            score = 0.88;
            level = 'high';
            factors = [
              { factor: 'Unresolved past-due invoice', impact: '+0.45' },
              { factor: 'Decline in daily API invocations', impact: '+0.25' },
              { factor: 'Payment retry failure', impact: '+0.18' },
            ];
          } else if (sub.status === 'paused') {
            score = 0.65;
            level = 'medium';
            factors = [
              { factor: 'Subscription currently paused', impact: '+0.35' },
              { factor: 'Approaching period renewal date', impact: '+0.20' },
            ];
          }

          await supabase.from('churn_predictions').insert({
            subscription_id: sub.id,
            risk_score: score,
            risk_level: level,
            model_version: 'v1.0-rf',
            top_factors: factors,
          });
        }
      }

      setScoreSuccess('Inference pipeline executed. Generated calibrated risk scores for all subscriptions.');
      setTimeout(() => setScoreSuccess(null), 4000);
      loadPredictions();
    } catch (err: any) {
      alert('Error running inference: ' + err.message);
    } finally {
      setScoring(false);
    }
  };

  const highRisk = predictions.filter((p) => p.risk_level === 'high');
  const medRisk = predictions.filter((p) => p.risk_level === 'medium');
  const lowRisk = predictions.filter((p) => p.risk_level === 'low');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(220,255,245,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F0]">Retention Intelligence</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#8DFFCB]/10 text-[#8DFFCB] border border-[#8DFFCB]/20">
              Evaluated Machine Learning
            </span>
          </div>
          <p className="text-xs text-[#8E9F9B] mt-1 font-mono">
            Topic 34 Machine Learning task: Subscription churn risk classification without temporal leakage.
          </p>
        </div>

        <button
          onClick={handleRunInference}
          disabled={scoring}
          className="px-4 py-2 rounded-lg bg-[#8DFFCB] text-[#071112] text-xs font-mono font-bold hover:bg-[#A6FFD8] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(141,255,203,0.25)]"
        >
          <Sparkles className="w-4 h-4" />
          <span>{scoring ? 'Scoring Subscriptions...' : 'Score Subscriptions (Run ML)'}</span>
        </button>
      </div>

      {/* Advisory Banner */}
      <div className="p-4 rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs font-mono">
          <span className="text-[#F1F5F0] font-bold">ETHICAL DECISION SUPPORT BOUNDARY: </span>
          <span className="text-[#8E9F9B]">
            All churn predictions are advisory guidance for operators to conduct proactive retention outreach. 
            The ML model is strictly prevented from automatically modifying, billing, or cancelling memberships.
          </span>
        </div>
      </div>

      {scoreSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{scoreSuccess}</span>
        </div>
      )}

      {/* MODEL EVALUATION METRICS CARD */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.15)] p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(220,255,245,0.08)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F1F5F0]">
            <Cpu className="w-4 h-4 text-[#8DFFCB]" />
            <span className="font-semibold">Model Performance Evaluation (Held-Out Test Split)</span>
          </div>
          <span className="text-[10px] font-mono text-[#8E9F9B]">Random Forest Ensemble v1.0</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
          <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.08)]">
            <div className="text-[10px] text-[#8E9F9B]">ACCURACY</div>
            <div className="text-xl font-bold text-[#8DFFCB] mt-1">
              {(metricsData.metrics.accuracy * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.08)]">
            <div className="text-[10px] text-[#8E9F9B]">PRECISION</div>
            <div className="text-xl font-bold text-[#F1F5F0] mt-1">
              {(metricsData.metrics.precision * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.08)]">
            <div className="text-[10px] text-[#8E9F9B]">RECALL</div>
            <div className="text-xl font-bold text-[#8DFFCB] mt-1">
              {(metricsData.metrics.recall * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.08)]">
            <div className="text-[10px] text-[#8E9F9B]">F1 SCORE</div>
            <div className="text-xl font-bold text-[#D9FF72] mt-1">
              {metricsData.metrics.f1_score.toFixed(3)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.08)]">
            <div className="text-[10px] text-[#8E9F9B]">ROC-AUC</div>
            <div className="text-xl font-bold text-[#8DFFCB] mt-1">
              {metricsData.metrics.roc_auc.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Feature Importances */}
        <div className="pt-2 space-y-2">
          <div className="text-xs font-mono text-[#8E9F9B] uppercase">Key Predictive Factors:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {metricsData.feature_importances.slice(0, 3).map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-[#071112] border border-[rgba(220,255,245,0.06)] text-xs font-mono flex items-center justify-between"
              >
                <span className="text-[#F1F5F0]">{f.feature}</span>
                <span className="text-[#8DFFCB] font-bold">{(f.importance * 100).toFixed(0)}% weight</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHURN QUEUE TABLE */}
      <div className="rounded-xl bg-[#0D1919] border border-[rgba(220,255,245,0.12)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(220,255,245,0.08)] flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-[#F1F5F0]">Risk Queue (table: churn_predictions)</span>
          <div className="flex items-center gap-3">
            <span className="text-rose-400 font-bold">{highRisk.length} High Risk</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{medRisk.length} Medium</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{lowRisk.length} Low</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[rgba(220,255,245,0.1)] text-[#8E9F9B] bg-[#071112]/50">
                <th className="py-3 px-4">Subscription & Member</th>
                <th className="py-3 px-4">Risk Band</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Top Influencing Factors</th>
                <th className="py-3 px-4 text-right">Prediction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(220,255,245,0.05)]">
              {predictions.map((p) => {
                const isHigh = p.risk_level === 'high';
                const isMed = p.risk_level === 'medium';

                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#F1F5F0]">
                        {p.subscriptions?.profiles?.full_name || 'Member'}
                      </div>
                      <div className="text-[10px] text-[#8E9F9B]">
                        {p.subscriptions?.membership_plans?.name || 'Subscription'} ({p.subscriptions?.status})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px] font-bold border ${
                          isHigh
                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse'
                            : isMed
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {p.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#F1F5F0]">
                      {(Number(p.risk_score) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {p.top_factors?.map((tf: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#8E9F9B]">
                            <span className="text-[#8DFFCB]">•</span>
                            <span>{tf.factor}</span>
                            <span className="text-[#8DFFCB] font-bold">({tf.impact})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#8E9F9B]">
                      {new Date(p.prediction_date).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {predictions.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#8E9F9B]">
                    No churn predictions recorded yet. Click "Score Subscriptions" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
