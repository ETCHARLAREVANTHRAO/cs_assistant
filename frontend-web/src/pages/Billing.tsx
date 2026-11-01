import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number | null; // null for custom
  yearlyPrice: number | null;
  currency: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  ctaLabel: string;
  ctaVariant: 'primary' | 'secondary' | 'outline' | 'dark';
}

const PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Essential tools to kickstart your preparation and explore the platform.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: '₹',
    badge: 'Starter',
    features: [
      '15 AI Doubt solver queries / day',
      'Standard GATE CS syllabus explorer',
      '5 practice tests per month',
      'Document search (up to 5 PDFs)',
      'Community discussion forums access',
      'Standard email support',
    ],
    ctaLabel: 'Current Plan',
    ctaVariant: 'outline',
  },
  {
    id: 'student',
    name: 'Student',
    tagline: 'Affordable, dedicated companion for focused GATE CS exam aspirants.',
    monthlyPrice: 149,
    yearlyPrice: 119,
    currency: '₹',
    badge: 'Best for Aspirants',
    features: [
      '300 AI Doubt solver queries / day',
      'Complete GATE PYQ bank (2012–2026) with verified solutions',
      'Unlimited chapter-wise tests & flashcard drills',
      'Spaced repetition revision planner sync',
      'Multi-document RAG (up to 50 PDFs indexed)',
      'Priority queue & faster response times',
    ],
    ctaLabel: 'Upgrade to Student',
    ctaVariant: 'secondary',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Maximum productivity and deep analytics for top-rank achievers.',
    monthlyPrice: 499,
    yearlyPrice: 399,
    currency: '₹',
    badge: 'Most Popular',
    popular: true,
    features: [
      'Unlimited AI chat & smart doubt solving',
      'Full-length simulated GATE Mock tests with percentile ranking',
      'Weak-topic diagnosis heatmap & AI study roadmap',
      'Unlimited PDF document indexing & deep semantic search',
      'Step-by-step LaTeX mathematical derivations',
      'Priority high-speed model response speed',
      'Offline sync & downloadable formula summaries',
    ],
    ctaLabel: 'Get Pro Now',
    ctaVariant: 'primary',
  },
  {
    id: 'research',
    name: 'Research / Power',
    tagline: 'High-throughput compute & research-grade AI models for power scholars.',
    monthlyPrice: 999,
    yearlyPrice: 799,
    currency: '₹',
    badge: 'Power & Research',
    features: [
      'Everything included in Pro',
      'Advanced reasoning models (Extended thinking & complex proofs)',
      'Deep multi-paper synthesis & literature review tools',
      'Custom mock test generator from research papers & new problem sets',
      'Automated code generation & algorithmic verification',
      'Personal API keys for custom study scripts & automations',
      'Dedicated 1-on-1 priority support & direct engineer access',
    ],
    ctaLabel: 'Upgrade to Power',
    ctaVariant: 'dark',
  },
  {
    id: 'institute',
    name: 'Institute / Teams',
    tagline: 'Tailored infrastructure for coaching academies, university batches & study groups.',
    monthlyPrice: null,
    yearlyPrice: null,
    currency: '₹',
    badge: 'Enterprise',
    features: [
      'Multi-student seat licenses (10 to 500+ seats)',
      'Centralized faculty & mentor management dashboard',
      'Private test series & custom question bank repository',
      'Automated batch performance analytics & leaderboards',
      'Role-based permissions (Admins, Faculty, Mentors, Students)',
      'Custom university/coaching branding & single sign-on (SSO)',
      'Dedicated account manager & SLA guarantee',
    ],
    ctaLabel: 'Contact Sales',
    ctaVariant: 'outline',
  },
];

interface Invoice {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: 'Paid' | 'Processing';
  pdfUrl?: string;
}

const SAMPLE_INVOICES: Invoice[] = [
  { id: 'INV-2026-0891', date: 'Oct 01, 2026', plan: 'Student Plan (Monthly)', amount: '₹149', status: 'Paid' },
  { id: 'INV-2026-0742', date: 'Sep 01, 2026', plan: 'Student Plan (Monthly)', amount: '₹149', status: 'Paid' },
  { id: 'INV-2026-0610', date: 'Aug 01, 2026', plan: 'Student Plan (Monthly)', amount: '₹149', status: 'Paid' },
];

export default function Billing() {
  const { currentUser } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string>('student');
  const [checkoutPlan, setCheckoutPlan] = useState<PlanTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Enterprise form state
  const [enterpriseForm, setEnterpriseForm] = useState({
    institutionName: '',
    contactPerson: '',
    email: currentUser?.email || '',
    teamSize: '25-50',
    message: '',
  });
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('my_assistant_user_plan');
    if (saved) {
      setCurrentPlanId(saved);
    }
  }, []);

  const handleSelectPlan = (plan: PlanTier) => {
    if (plan.id === 'institute') {
      setShowEnterpriseModal(true);
      return;
    }
    if (plan.id === currentPlanId) {
      return;
    }
    setCheckoutPlan(plan);
    setSuccessMessage('');
  };

  const handleConfirmPayment = () => {
    if (!checkoutPlan) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentPlanId(checkoutPlan.id);
      localStorage.setItem('my_assistant_user_plan', checkoutPlan.id);
      const planName = checkoutPlan.name;
      setCheckoutPlan(null);
      setSuccessMessage(`Successfully switched to the ${planName} plan! Your new features are active.`);
      setTimeout(() => setSuccessMessage(''), 6000);
    }, 1200);
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnterpriseSubmitted(true);
    setTimeout(() => {
      setShowEnterpriseModal(false);
      setEnterpriseSubmitted(false);
      setSuccessMessage('Thank you! Our Institutional Sales team will get in touch with you within 24 hours.');
      setTimeout(() => setSuccessMessage(''), 6000);
    }, 1500);
  };

  const currentPlan = PLANS.find((p) => p.id === currentPlanId) || PLANS[1];

  const faqs = [
    {
      q: 'Can I switch or cancel my plan at any time?',
      a: 'Yes, you can upgrade, downgrade, or cancel your subscription at any moment. When upgrading, your new features activate instantly with prorated billing.',
    },
    {
      q: 'What payment methods are supported for Indian users?',
      a: 'We support all major Indian payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM), Rupay / Visa / Mastercard credit and debit cards, and Net Banking across 50+ banks.',
    },
    {
      q: 'What is the difference between Pro and Research / Power tiers?',
      a: 'While Pro offers unlimited AI doubts and mock analytics for exam prep, Research / Power unlocks frontier reasoning models with extended thinking, high context limits, deep multi-document literature synthesis, and developer API keys.',
    },
    {
      q: 'How does the Institute / Teams custom pricing work?',
      a: 'Institutes and coaching batches receive volume discounts, customized question repositories, unified student analytics dashboards, and dedicated account support. Submit a query to receive a tailored quotation.',
    },
    {
      q: 'Can I get GST invoices for my company or educational institution?',
      a: 'Yes! All paid invoices include GSTIN details and can be downloaded in PDF format directly from your billing history below.',
    },
  ];

  return (
    <Layout activePage="billing" title="Billing &amp; Plans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Banner Alert if any action happened */}
        {successMessage && (
          <div className="bg-success/10 border border-success/30 text-success p-4 rounded-xl flex items-center justify-between shadow-soft animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
              <p className="font-label-md text-label-md font-medium">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-success hover:opacity-80">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {/* Current Active Plan Overview Card */}
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                Active Subscription
              </span>
              <span className="text-text-muted font-body-sm text-sm">Renews automatically on Dec 01, 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">
              {currentPlan.name} Plan
              {currentPlan.monthlyPrice !== null && (
                <span className="text-lg sm:text-xl font-normal text-text-muted ml-3">
                  (₹{currentPlan.monthlyPrice}/mo)
                </span>
              )}
            </h2>
            <p className="text-text-muted max-w-xl font-body-md text-sm sm:text-base">
              {currentPlan.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 w-full sm:w-auto">
            <a
              href="#pricing-grid"
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition shadow-soft flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">upgrade</span>
              Change Plan
            </a>
            <a
              href="#billing-history"
              className="px-4 py-2.5 rounded-xl border border-border text-on-surface hover:bg-surface-container font-label-md text-label-md transition flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              Invoices
            </a>
          </div>
        </div>

        {/* Section Header & Toggle */}
        <div id="pricing-grid" className="text-center space-y-4 pt-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            Transparent Pricing for Every Stage of Learning
          </h1>
          <p className="text-text-muted font-body-md text-base sm:text-lg max-w-2xl mx-auto">
            From individual student preparation to institutional cohort management, select the tier designed for your scale.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-surface-container border border-border mt-4">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                !isAnnual
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-success/20 text-success uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 5-Column Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl transition-all duration-300 bg-surface border ${
                  plan.popular
                    ? 'border-primary ring-2 ring-primary/20 shadow-xl hover:-translate-y-1'
                    : isCurrent
                    ? 'border-secondary ring-1 ring-secondary/30 shadow-md'
                    : 'border-border shadow-soft hover:shadow-hover hover:-translate-y-0.5'
                }`}
              >
                {/* Popular or Current Pill */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold tracking-wide shadow-sm flex items-center gap-1 uppercase">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {plan.badge || 'Popular'}
                  </div>
                )}
                {!plan.popular && plan.badge && (
                  <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-surface-container border border-border text-text-muted text-[11px] font-bold tracking-wide uppercase">
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 pb-0 space-y-4">
                  {/* Plan Name & Tagline */}
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-on-surface flex items-center justify-between">
                      {plan.name}
                      {isCurrent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary/15 text-secondary border border-secondary/20">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-text-muted text-xs leading-relaxed mt-1.5 min-h-[36px]">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Pricing Details */}
                  <div className="pt-2 border-t border-border/50">
                    {price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-on-surface">
                          {plan.currency}{price}
                        </span>
                        <span className="text-text-muted text-xs font-medium">
                          /- rupees {isAnnual ? '/mo (billed yearly)' : '/mo'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-on-surface">
                          Custom
                        </span>
                        <span className="text-text-muted text-xs font-medium">
                          pricing
                        </span>
                      </div>
                    )}
                    {isAnnual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                      <p className="text-[11px] text-success font-medium mt-0.5">
                        Billed annually (₹{(plan.yearlyPrice || 0) * 12}/yr)
                      </p>
                    )}
                  </div>

                  {/* Feature List */}
                  <div className="space-y-2.5 pt-4 border-t border-border/50">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      What's Included:
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-on-surface leading-tight">
                          <span className="material-symbols-outlined text-[16px] text-success shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA Footer */}
                <div className="p-6 pt-6 mt-auto">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-surface-container text-text-muted cursor-default border border-border'
                        : plan.popular
                        ? 'bg-primary text-on-primary hover:bg-primary/90 shadow-md hover:shadow-lg'
                        : plan.ctaVariant === 'secondary'
                        ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                        : plan.ctaVariant === 'dark'
                        ? 'bg-on-surface text-surface hover:opacity-90'
                        : 'border border-primary text-primary hover:bg-primary/5'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Current Plan
                      </>
                    ) : (
                      <>
                        <span>{plan.ctaLabel}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-soft space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-on-surface">Detailed Feature Matrix</h3>
            <p className="text-text-muted font-body-md text-sm">
              Comprehensive comparison of capabilities across all subscription tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-container/50 text-text-muted font-label-md">
                  <th className="py-3 px-4 font-bold text-on-surface">Feature / Capability</th>
                  <th className="py-3 px-4">Free (₹0)</th>
                  <th className="py-3 px-4">Student (₹149)</th>
                  <th className="py-3 px-4 text-primary font-bold">Pro (₹499)</th>
                  <th className="py-3 px-4">Research/Power (₹999)</th>
                  <th className="py-3 px-4">Institute / Teams</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">AI Doubt Solver Queries</td>
                  <td className="py-3 px-4 text-text-muted">15 queries / day</td>
                  <td className="py-3 px-4">300 queries / day</td>
                  <td className="py-3 px-4 text-primary font-semibold">Unlimited</td>
                  <td className="py-3 px-4 font-semibold">Unlimited (High Speed)</td>
                  <td className="py-3 px-4 font-semibold">Unlimited Pooled</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">GATE Previous Year Papers (PYQ)</td>
                  <td className="py-3 px-4 text-text-muted">Selected 3 years</td>
                  <td className="py-3 px-4">Full archive (2012–2026)</td>
                  <td className="py-3 px-4">Full archive + AI Explanations</td>
                  <td className="py-3 px-4">Full archive + Variant generator</td>
                  <td className="py-3 px-4">Full archive + Custom tests</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">Document RAG (PDF Indexing)</td>
                  <td className="py-3 px-4 text-text-muted">Up to 5 files</td>
                  <td className="py-3 px-4">Up to 50 files</td>
                  <td className="py-3 px-4">Unlimited files</td>
                  <td className="py-3 px-4 font-semibold">Unlimited + Cross-doc Synthesis</td>
                  <td className="py-3 px-4 font-semibold">Shared Institute Drive Sync</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">Full Mock Tests &amp; Percentile Rank</td>
                  <td className="py-3 px-4 text-text-muted">1 test / month</td>
                  <td className="py-3 px-4">5 tests / month</td>
                  <td className="py-3 px-4 text-primary font-semibold">Unlimited + Analytics</td>
                  <td className="py-3 px-4 font-semibold">Unlimited + Custom Mocks</td>
                  <td className="py-3 px-4 font-semibold">Private Batch Mocks</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">Advanced Reasoning Models</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4">Standard Reasoning</td>
                  <td className="py-3 px-4 text-success font-bold">Extended Deep Thinking</td>
                  <td className="py-3 px-4 text-success font-bold">Configurable Models</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">Developer &amp; Script API Keys</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-success font-bold">Included (REST API)</td>
                  <td className="py-3 px-4 text-success font-bold">Enterprise API &amp; Webhooks</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">Admin &amp; Faculty Analytics</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-text-muted">—</td>
                  <td className="py-3 px-4 text-success font-bold">Dedicated Dashboard</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">Support Level</td>
                  <td className="py-3 px-4 text-text-muted">Community</td>
                  <td className="py-3 px-4">Email Support</td>
                  <td className="py-3 px-4 text-primary font-semibold">Priority Support</td>
                  <td className="py-3 px-4 font-semibold">1-on-1 Engineering Support</td>
                  <td className="py-3 px-4 font-semibold">Dedicated Account Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices & Billing History */}
        <div id="billing-history" className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Billing History &amp; Invoices</h3>
              <p className="text-text-muted font-body-md text-sm mt-0.5">
                Download past invoices and tax receipts for your records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Currency:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-surface-container border border-border text-on-surface">
                INR (₹)
              </span>
            </div>
          </div>

          <div className="divide-y divide-border border-t border-border">
            {SAMPLE_INVOICES.map((inv) => (
              <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container/30 px-2 rounded-lg transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">description</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{inv.plan}</p>
                    <p className="text-xs text-text-muted">{inv.id} • {inv.date}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-right">
                    <p className="font-bold text-sm text-on-surface">{inv.amount}</p>
                    <span className="text-[11px] font-bold text-success flex items-center gap-1 justify-end">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      {inv.status}
                    </span>
                  </div>
                  <button
                    onClick={() => alert(`Downloading Invoice ${inv.id}...`)}
                    className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-surface-container transition"
                    title="Download Invoice"
                  >
                    <span className="material-symbols-outlined text-xl">download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-soft space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-on-surface">Frequently Asked Questions</h3>
            <p className="text-text-muted font-body-md text-sm">
              Answers to common inquiries about payments, plans, and licensing.
            </p>
          </div>

          <div className="divide-y divide-border border-t border-border">
            {faqs.map((faq, index) => {
              const isOpen = faqOpen === index;
              return (
                <div key={index} className="py-4">
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left font-semibold text-sm text-on-surface hover:text-primary transition"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-text-muted transition-transform">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-text-muted leading-relaxed pr-8">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Checkout / Upgrade Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 border border-border shadow-2xl space-y-6 relative">
            <button
              onClick={() => setCheckoutPlan(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-on-surface p-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Confirm Subscription
              </span>
              <h3 className="text-2xl font-bold text-on-surface">
                Upgrade to {checkoutPlan.name}
              </h3>
              <p className="text-text-muted text-xs">
                {checkoutPlan.tagline}
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-surface-container/60 rounded-xl p-4 border border-border space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface font-medium">{checkoutPlan.name} ({isAnnual ? 'Annual' : 'Monthly'})</span>
                <span className="font-bold text-on-surface">
                  ₹{isAnnual ? (checkoutPlan.yearlyPrice || 0) * 12 : checkoutPlan.monthlyPrice}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-text-muted">
                <span>Estimated GST (18% inclusive)</span>
                <span>Included</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center text-base font-bold text-primary">
                <span>Total Due Today</span>
                <span>₹{isAnnual ? (checkoutPlan.yearlyPrice || 0) * 12 : checkoutPlan.monthlyPrice}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Select Indian Payment Method
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'upi'
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-border text-text-muted hover:border-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                  <span className="text-xs">UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-border text-text-muted hover:border-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">credit_card</span>
                  <span className="text-xs">Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'netbanking'
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-border text-text-muted hover:border-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                  <span className="text-xs">NetBanking</span>
                </button>
              </div>

              {/* UPI details */}
              {paymentMethod === 'upi' && (
                <div className="pt-2 space-y-2">
                  <label className="text-xs text-text-muted">Enter UPI ID (VPA):</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="username@okhdfcbank or @upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary focus:border-primary text-on-surface"
                    />
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Supports Google Pay, PhonePe, Paytm, BHIM, and any UPI app.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition shadow-soft flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Pay &amp; Activate Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise / Institute Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 border border-border shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowEnterpriseModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-on-surface p-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">domain</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Institute &amp; Teams
                </span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface">
                Request Custom Quotation
              </h3>
              <p className="text-text-muted text-xs">
                Tailored multi-seat licenses, custom syllabus integration, and mentor dashboards for institutions.
              </p>
            </div>

            <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Institution / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT Bombay / ACE Engineering Academy"
                  value={enterpriseForm.institutionName}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, institutionName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. Sharma"
                    value={enterpriseForm.contactPerson}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sharma@institute.edu"
                    value={enterpriseForm.email}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Estimated Number of Students / Seats
                </label>
                <select
                  value={enterpriseForm.teamSize}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, teamSize: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="10-25">10 – 25 Students</option>
                  <option value="25-50">25 – 50 Students</option>
                  <option value="50-200">50 – 200 Students</option>
                  <option value="200-1000">200 – 1,000+ Students</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Specific Requirements or Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Need custom test series for 2027 GATE CS batch with teacher analytics..."
                  value={enterpriseForm.message}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEnterpriseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enterpriseSubmitted}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition shadow-soft flex items-center gap-2"
                >
                  {enterpriseSubmitted ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

