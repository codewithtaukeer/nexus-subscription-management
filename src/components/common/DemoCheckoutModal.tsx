import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Lock, 
  ArrowRight,
  Database,
  Cpu,
  Zap,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DemoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planName?: string;
  priceMonthly?: number;
  planId?: string;
}

export const DemoCheckoutModal: React.FC<DemoCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  planName = 'Nexus Pro (Paid)',
  priceMonthly = 2499,
  planId = 'c0000000-0000-0000-0000-000000000002',
}) => {
  const { currentUser, upgradeToPro } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(currentUser?.full_name || 'Alex Vance');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');

  if (!isOpen) return null;

  const finalAmount = billingCycle === 'monthly' ? priceMonthly : Math.round(priceMonthly * 10);

  const handleAuthorizePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStep('processing');

    try {
      // Simulate multi-phase ACID transaction settlement
      await new Promise((r) => setTimeout(r, 1200));

      if (upgradeToPro) {
        await upgradeToPro(planId, billingCycle, finalAmount);
      }

      setStep('success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setStep('checkout');
        setProcessing(false);
      }, 2000);
    } catch (err: any) {
      alert('Payment authorization failed: ' + (err.message || 'Unknown error'));
      setStep('checkout');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="rounded-3xl bg-[#091012] border border-[#8DFFCB]/30 max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 shadow-[0_0_60px_rgba(141,255,203,0.15)] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#94A3B8] hover:text-[#F1F5F0] hover:bg-white/[0.05] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#8DFFCB]/20 border-t-[#8DFFCB] animate-spin" />
              <Zap className="w-6 h-6 text-[#8DFFCB] absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F1F5F0]">Simulating ACID Payment Settlement...</h3>
              <p className="text-xs font-mono text-[#8E9F9B] mt-1">
                Locking row • Inserting paid invoice • Recording audit trail
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#8DFFCB]/20 border border-[#8DFFCB] flex items-center justify-center text-[#8DFFCB] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F1F5F0]">Payment Settled & Pro Activated!</h3>
              <p className="text-xs font-mono text-[#8DFFCB] mt-1">
                PostgreSQL ACID transaction committed. Full access unlocked.
              </p>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <>
            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#8DFFCB]/10 border border-[#8DFFCB]/25 text-[10px] font-mono text-[#8DFFCB]">
                <Sparkles className="w-3 h-3" />
                <span>Simulated ACID Checkout</span>
              </div>
              <h2 className="text-2xl font-bold text-[#F1F5F0]">Upgrade to {planName}</h2>
              <p className="text-xs text-[#8E9F9B] font-mono">
                Unlock DBMS Studio, live SQL execution, and unlimited subscription tracking.
              </p>
            </div>

            {/* Realistic Demo Holographic Credit Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#0D2420] via-[#081516] to-[#040C0D] p-5 border border-[#8DFFCB]/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#8DFFCB]/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-7 rounded-md bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                    <div className="w-6 h-4 border border-amber-300/40 rounded-sm" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9F9B]">DEMO CARD</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#8DFFCB] tracking-wider">NEXUS ENTERPRISE</span>
                </div>
              </div>

              <div className="font-mono text-lg tracking-widest text-[#F1F5F0] mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {cardNumber}
              </div>

              <div className="flex justify-between items-end text-[11px] font-mono text-[#8E9F9B]">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#94A3B8]">CARDHOLDER</div>
                  <div className="text-[#F1F5F0] font-semibold tracking-wide">{cardHolder}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#94A3B8]">EXPIRES</div>
                  <div className="text-[#F1F5F0] font-semibold">{cardExp}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#94A3B8]">CVV</div>
                  <div className="text-[#8DFFCB] font-semibold">{cardCvv}</div>
                </div>
              </div>
            </div>

            {/* Billing Cycle Selector */}
            <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-[#060D0E] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`py-2 px-3 rounded-lg text-xs font-mono flex flex-col items-center justify-center transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-md'
                    : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
                }`}
              >
                <span>Monthly Billing</span>
                <span className="text-[10px] font-normal">INR {priceMonthly.toLocaleString()}/mo</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`py-2 px-3 rounded-lg text-xs font-mono flex flex-col items-center justify-center transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-[#8DFFCB] text-[#071112] font-bold shadow-md'
                    : 'text-[#8E9F9B] hover:text-[#F1F5F0]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>Annual Billing</span>
                  <span className="text-[9px] px-1 rounded bg-emerald-950/80 text-emerald-300 font-bold">Save 20%</span>
                </div>
                <span className="text-[10px] font-normal">INR {Math.round(priceMonthly * 10).toLocaleString()}/yr</span>
              </button>
            </div>

            {/* Included Entitlements */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#071112] border border-white/[0.06] text-xs font-mono">
              <div className="text-[10px] uppercase text-[#8E9F9B] tracking-wider">Unlocks Instantly:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#F1F5F0]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#8DFFCB]" />
                  <span>Unlimited Custom Subs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#8DFFCB]" />
                  <span>DBMS Studio & Live SQL</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#8DFFCB]" />
                  <span>Normalization Workbench</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#8DFFCB]" />
                  <span>ACID Transaction Lab</span>
                </div>
              </div>
            </div>

            {/* Authorize Form */}
            <form onSubmit={handleAuthorizePayment} className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/[0.08]">
                <span className="text-[#8E9F9B]">Due Today (ACID Settled):</span>
                <span className="text-base font-bold text-[#8DFFCB]">INR {finalAmount.toLocaleString()}</span>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 px-4 rounded-xl bg-[#8DFFCB] hover:bg-[#A6FFD8] text-[#071112] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(141,255,203,0.35)] group"
              >
                <Lock className="w-4 h-4 text-[#071112]" />
                <span>Authorize & Activate Nexus Pro</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center text-[10px] font-mono text-[#8E9F9B] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8DFFCB]" />
                <span>Simulated demo checkout. No actual bank charge will occur.</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
