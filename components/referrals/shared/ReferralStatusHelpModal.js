"use client";

import { X, Play, MessagesSquare, Wrench, IndianRupee } from "lucide-react";

export default function ReferralStatusHelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Referral Status Flow</h2>
            <p className="text-xs text-slate-300 mt-1">Understanding the deal lifecycle and when to use each status.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="overflow-y-auto p-6 space-y-6">

          {/* STAGE 1 */}
          <StageCard 
            icon={<Play size={18} className="text-amber-500" />}
            title="1. Initial Contact Stage"
            color="amber"
          >
            <StatusItem name="Pending" desc="A new referral has been passed but not yet acted upon." />
            <StatusItem name="Acknowledged / Accepted" desc="You have seen the referral and intend to contact them." />
            <StatusItem name="Called but Not Answered" desc="You attempted to call but they didn't pick up." />
            <StatusItem name="Rejected" desc="You cannot fulfill this request (e.g., wrong industry)." isTerminal />
          </StageCard>

          {/* STAGE 2 */}
          <StageCard 
            icon={<MessagesSquare size={18} className="text-blue-500" />}
            title="2. Negotiation Stage"
            color="blue"
          >
            <StatusItem name="Discussion in Progress" desc="You are actively talking to the prospect." />
            <StatusItem name="Proposal Sent / Quote Sent" desc="You have given them a formal quote and are waiting for approval." />
            <StatusItem name="Hold" desc="The prospect needs more time or the project is paused." />
            <StatusItem name="Deal Won" desc="The prospect has agreed to proceed with the deal!" />
            <StatusItem name="Deal Lost" desc="The prospect chose not to proceed." isTerminal />
          </StageCard>

          {/* STAGE 3 */}
          <StageCard 
            icon={<Wrench size={18} className="text-indigo-500" />}
            title="3. Execution Stage"
            color="indigo"
          >
            <StatusItem name="Work in Progress" desc="You have started fulfilling the service or product delivery." />
            <StatusItem name="Work Completed" desc="All deliverables have been met and the client is satisfied." />
            <StatusItem name="Cancelled" desc="The deal was won, but the project was cancelled before completion." isTerminal />
          </StageCard>

          {/* STAGE 4 */}
          <StageCard 
            icon={<IndianRupee size={18} className="text-emerald-500" />}
            title="4. Financial / Closing Stage"
            color="emerald"
          >
            <StatusItem name="Invoice Sent / Payment Pending" desc="The client has been billed but hasn't paid yet." />
            <StatusItem name="Received Part Payment..." desc="Client paid a milestone or partial amount. UJB cut transferred." />
            <StatusItem name="Received Full and Final Payment" desc="The client has settled the entire bill." />
            <StatusItem name="Agreed % Transferred to UJustBe" desc="The final platform commission has been settled with UJB." />
            <StatusItem name="Closed" desc="All work and finances are completely finalized." isTerminal />
          </StageCard>

        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function StageCard({ icon, title, children, color }) {
  const bgColors = {
    amber: "bg-amber-50 border-amber-100",
    blue: "bg-blue-50 border-blue-100",
    indigo: "bg-indigo-50 border-indigo-100",
    emerald: "bg-emerald-50 border-emerald-100",
  };

  const textColors = {
    amber: "text-amber-900",
    blue: "text-blue-900",
    indigo: "text-indigo-900",
    emerald: "text-emerald-900",
  };

  return (
    <div className={`rounded-xl border p-5 ${bgColors[color]}`}>
      <div className={`flex items-center gap-2 mb-4 font-semibold ${textColors[color]}`}>
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function StatusItem({ name, desc, isTerminal }) {
  return (
    <div className="flex gap-3 bg-white/60 p-3 rounded-lg border border-black/5">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{name}</span>
          {isTerminal && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded">
              Terminal
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
