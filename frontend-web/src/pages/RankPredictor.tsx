import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  predictAdmissions,
  type PredictorResponse,
  type CollegePrediction,
} from '../services/api';

type TabView = 'all' | 'safe' | 'target' | 'dream' | 'psu';

export default function RankPredictor() {
  const [gateScore, setGateScore] = useState<number>(750);
  const [category, setCategory] = useState<string>('general');
  const [marks, setMarks] = useState<string>('68.0');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabView>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [predictionData, setPredictionData] = useState<PredictorResponse | null>(null);

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      const parsedMarks = parseFloat(marks) || undefined;
      const data = await predictAdmissions(
        gateScore,
        category,
        parsedMarks,
        selectedTier === 'all' ? undefined : selectedTier
      );
      setPredictionData(data);
    } catch {
      // Handled in api wrapper fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handlePredict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeList = predictionData?.safe_colleges || [];
  const targetList = predictionData?.target_colleges || [];
  const dreamList = predictionData?.dream_colleges || [];
  const psuList = predictionData?.psu_opportunities || [];

  const filterColleges = (list: CollegePrediction[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.institute.toLowerCase().includes(q) ||
        c.program.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  };

  return (
    <Layout activePage="predictor" title="IIT & PSU Rank Predictor">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900/80 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">analytics</span>
                <span>Cutoff Analytics Engine</span>
              </div>
              <h1 className="text-2xl font-black text-white">IIT & PSU Admission Predictor</h1>
              <p className="text-sm text-slate-300 mt-1">
                Calibrated against official COAP (Common Offer Acceptance Portal), CCMT, and PSU recruitment cutoffs.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
              <div>
                <div className="text-white font-bold">23 IITs • Top NITs • 8 PSUs</div>
                <div className="text-slate-400 text-[10px]">Updated with recent closing ranks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Predictor Configuration Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GATE Score */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                GATE Score (100 - 1000)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={gateScore}
                  onChange={(e) => setGateScore(parseInt(e.target.value, 10) || 500)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category / Reservation
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
              >
                <option value="general">General (Open Category)</option>
                <option value="obc">OBC-NCL (Other Backward Class)</option>
                <option value="ews">EWS (Economically Weaker Section)</option>
                <option value="sc">SC (Scheduled Caste)</option>
                <option value="st">ST (Scheduled Tribe)</option>
              </select>
            </div>

            {/* Estimated Marks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Estimated Marks (out of 100)
              </label>
              <input
                type="text"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="e.g. 68.5"
                className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
              />
            </div>

            {/* Institute Tier Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Institute Preference
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
              >
                <option value="all">All Tiers (IITs, NITs, PSUs)</option>
                <option value="Old IITs">Top 7 Old IITs</option>
                <option value="Gen-2 IITs">Gen-2 IITs (Hyderabad, Indore, etc.)</option>
                <option value="Top NITs">Top NITs / IIITs</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              Cutoffs based on official Rounds 1 to 5 normalization.
            </span>
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLoading ? 'progress_activity' : 'search'}
              </span>
              <span>{isLoading ? 'Calculating Cutoffs...' : 'Calculate Predictions'}</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        {predictionData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Safe Offers</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {safeList.length}
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-0.5">High Probability (&gt;85%)</div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Target Options</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {targetList.length}
              </div>
              <div className="text-[11px] text-amber-300/80 mt-0.5">Competitive (50-85%)</div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
              <div className="text-[10px] font-bold text-purple-400 uppercase">Dream Aspirations</div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                {dreamList.length}
              </div>
              <div className="text-[11px] text-purple-300/80 mt-0.5">Reach Round 4/5</div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
              <div className="text-[10px] font-bold text-blue-400 uppercase">PSU Shortlists</div>
              <div className="text-2xl font-black text-blue-400 font-mono mt-1">
                {psuList.length}
              </div>
              <div className="text-[11px] text-blue-300/80 mt-0.5">Direct / Interview calls</div>
            </div>
          </div>
        )}

        {/* Tab & Search Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              All Programs ({safeList.length + targetList.length + dreamList.length})
            </button>
            <button
              onClick={() => setActiveTab('safe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'safe'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Safe Calls ({safeList.length})
            </button>
            <button
              onClick={() => setActiveTab('target')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'target'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Target ({targetList.length})
            </button>
            <button
              onClick={() => setActiveTab('dream')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'dream'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Dream ({dreamList.length})
            </button>
            <button
              onClick={() => setActiveTab('psu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'psu'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              PSU Opportunities ({psuList.length})
            </button>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institute or branch..."
              className="text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-60"
            />
          </div>
        </div>

        {/* Results Cards List */}
        {activeTab !== 'psu' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterColleges(
              activeTab === 'safe'
                ? safeList
                : activeTab === 'target'
                ? targetList
                : activeTab === 'dream'
                ? dreamList
                : [...safeList, ...targetList, ...dreamList]
            ).map((college, idx) => {
              const isSafe = college.chance === 'high';
              const isTarget = college.chance === 'medium';
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-400 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">
                          {college.institute}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {college.tier}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mt-0.5">
                        {college.program}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isSafe
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isTarget
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {college.chance.toUpperCase()} CHANCE
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Cutoff Score</div>
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        ~{college.cutoff_score}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Avg Package</div>
                      <div className="font-mono font-bold text-emerald-400">
                        {college.avg_ctc}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Admission Mode</div>
                      <div className="font-semibold text-slate-300">
                        {college.interview_required ? 'Written + Interview' : 'Direct COAP'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      <span>{college.location}</span>
                    </span>
                    <span className="font-mono text-slate-500">Score Margin: +{college.user_score - college.cutoff_score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* PSU Opportunities View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {psuList.map((psu, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      {psu.psu_name}
                    </h3>
                    <div className="text-xs text-blue-400 font-semibold mt-0.5">
                      {psu.role}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      psu.chance === 'high'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {psu.chance.toUpperCase()} CALL
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Pay Scale</div>
                    <div className="font-mono font-bold text-emerald-400">{psu.pay_scale}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Estimated Cutoff</div>
                    <div className="font-mono font-bold text-slate-300">~{psu.cutoff_score}</div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Process: </span>
                  {psu.selection_process}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
