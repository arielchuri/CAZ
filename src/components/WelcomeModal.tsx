import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { cn } from "./BrutalBase";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const handleDismiss = useCallback(() => {
    try {
      if (dontShowAgain) {
        localStorage.setItem("caz_welcome_seen", "true");
      } else {
        localStorage.removeItem("caz_welcome_seen");
      }
    } catch (err) {
      console.warn("Could not save welcome modal preference", err);
    }
    onClose();
  }, [dontShowAgain, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const pillars = [
    {
      id: "democracy",
      title: "Direct\nDemocracy",
      titleColor: "text-[#DF4C40]",
      paragraphs: [
        <>
          <strong>1 person, 1 vote.</strong> Every resident carries equal weight in every decision, from the smallest chore rotation to the zone's long-term direction. There are no proxies, no shareholder tiers, and no way to buy a bigger voice.
        </>,
        <>
          Meetings run on <strong>fist-to-five voting</strong>, so consensus is visible in real time rather than buried in a ballot box.
        </>,
        <>
          <strong>Quorum-based local direct democracy</strong> governs referendums, and any resident can bring a proposal to the floor without needing a sponsor.
        </>,
        <>
          Collective labor is scheduled the way a barn raising once was — neighbors showing up because the work is shared, not assigned. Fellowship circles handle disputes and planning <em>without executive bosses</em>, keeping authority flat and rotating rather than permanent.
        </>
      ]
    },
    {
      id: "mutual-aid",
      title: "Peer-to-Peer\nMutual Aid",
      titleColor: "text-[#DF9E15]",
      paragraphs: [
        <>
          Needs and surpluses are matched <strong>directly between neighbors</strong> — a bilateral handshake instead of a marketplace. If one household has extra firewood and another needs it, the exchange happens person to person.
        </>,
        <>
          There is <em>no currency and no middlemen</em>. Nobody takes a cut, and nothing sits in a warehouse waiting for a buyer. The system is built to move real goods to real needs as fast as people can find each other.
        </>,
        <>
          <strong>Trust and proximity</strong> do the work that markets usually do — knowing your neighbor's situation replaces the need for pricing, invoices, or credit checks.
        </>
      ]
    },
    {
      id: "labor",
      title: "Labor\nBrigades",
      titleColor: "text-[#36B34A]",
      paragraphs: [
        <>
          Work gets organized <strong>the Amish way</strong>: volunteer brigades that show up for a harvest, a build, or a repair, then disband once the job is done. Nobody is scheduled by a manager — the task itself sets the crew.
        </>,
        <>
          Hours are tracked <em>through reciprocal time-banking</em>, so an afternoon spent helping a neighbor roof a shed earns a claim on future help, not a wage. Contribution and need stay in balance without ever touching a currency.
        </>,
        <>
          <strong>A community tool-lending library</strong> backs every brigade — ladders, generators, and hand tools are shared property, checked out and returned rather than purchased and left idle in a garage.
        </>
      ]
    },
    {
      id: "blockchain",
      title: "Blockchain\nHistory",
      titleColor: "text-[#005EAC]",
      paragraphs: [
        <>
          <strong>Every decision leaves a trace.</strong> All changes to the zone's rules, votes, and resource ledgers are <em>recorded, versioned, and verifiable</em>, so the history of how a rule came to be is never lost or quietly rewritten.
        </>,
        <>
          Because the record is <strong>append-only and distributed</strong>, no single resident or committee can edit the past. Disagreements about "what we agreed to" get settled by checking the log, not by whoever remembers loudest. This turns governance into something residents can audit at any time — a transparent paper trail for a community that runs on trust but still checks its work.
        </>
      ]
    },
    {
      id: "mesh",
      title: "Zero-Cloud\nLocal Mesh",
      titleColor: "text-[#8F57CB]",
      paragraphs: [
        <>
          Communication runs on a <strong>local 915MHz LoRa and Wi-Fi mesh</strong> built and maintained by residents, not leased from a provider. Messages hop node to node across the zone instead of routing out to a data center.
        </>,
        <>
          The whole network is powered by <em>renewable solar microgrids</em>, so it keeps working through outages that would take a grid-tied system down with it.
        </>,
        <>
          Most importantly, it stays independent of <strong>Big Tech telecom ISPs</strong> — no subscription, no outside company that can throttle, meter, or shut off the zone's ability to talk to itself.
        </>
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto">
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-caz-title"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className={cn(
              "relative w-full max-w-[1580px] bg-[#FAF7F2] dark:bg-[#1C2524] text-[#222D2C] dark:text-[#EFECE6]",
              "border-2 border-[#222D2C] dark:border-[#5B6360] shadow-2xl z-10",
              "flex flex-col my-auto max-h-[92vh]"
            )}
            style={{ borderRadius: 0 }}
          >
            {/* Top Bar / Header Section */}
            <div className="p-6 sm:p-8 md:p-10 pb-4 sm:pb-6 flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#222D2C]/10 dark:border-white/10 shrink-0">
              <div>
                <h1
                  id="modal-caz-title"
                  className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#005EAC] dark:text-[#388BFD] leading-none select-none font-sans"
                >
                  CAZ
                </h1>
                <p className="text-xl sm:text-2xl md:text-[26px] font-medium text-[#005EAC] dark:text-[#388BFD] tracking-tight mt-1.5 select-none font-sans">
                  Community Autonomous Zone
                </p>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2.5 self-end sm:self-start">
                <button
                  onClick={handleDismiss}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#005EAC] hover:bg-[#004B8A] text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer border border-[#222D2C]"
                  style={{ borderRadius: 0 }}
                >
                  <span>Enter CAZ OS</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-[#222D2C] hover:bg-[#DF4C40] hover:text-white dark:hover:bg-[#DF4C40] dark:hover:text-white text-[#222D2C] dark:text-white border border-[#222D2C] dark:border-[#5B6360] transition-colors cursor-pointer"
                  style={{ borderRadius: 0 }}
                  title="Close welcome pop-up (Esc)"
                  aria-label="Close welcome pop-up"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: 5 Columns Grid */}
            <div className="p-6 sm:p-8 md:p-10 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 xl:gap-8 items-start">
                {pillars.map((pillar) => (
                  <div key={pillar.id} className="flex flex-col space-y-4">
                    {/* Column Heading */}
                    <h2
                      className={cn(
                        "text-2xl sm:text-3xl font-extrabold tracking-tight whitespace-pre-line leading-[1.1] font-sans",
                        pillar.titleColor
                      )}
                    >
                      {pillar.title}
                    </h2>

                    {/* Column Content */}
                    <div className="space-y-3.5 text-xs sm:text-[13px] leading-relaxed text-[#1F2937] dark:text-[#DFDDD7] font-sans">
                      {pillar.paragraphs.map((p, idx) => (
                        <p key={idx} className="leading-normal">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="px-6 sm:px-8 py-3.5 bg-[#EFECE6] dark:bg-[#161D1C] border-t-2 border-[#222D2C] dark:border-[#5B6360] flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 font-mono text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#5B6360] dark:text-[#BCBCB8]">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="accent-[#005EAC] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Don't show automatically on next visit</span>
              </label>

              <div className="flex items-center gap-3">
                <span className="text-[#909390] hidden md:inline">
                  [Press ESC or click outside to dismiss]
                </span>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-1.5 bg-[#005EAC] hover:bg-[#004B8A] text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer border border-[#222D2C]"
                  style={{ borderRadius: 0 }}
                >
                  <span>Enter CAZ OS</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
