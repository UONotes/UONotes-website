"use client";

import Image from "next/image";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { Caveat } from "next/font/google";
import { useState } from "react";
import { TEAM_DATA } from "@/lib/team-data";

// Handwriting font for the notebook-style founder cards
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

const presidentialTeamData = TEAM_DATA.find(
  (team) => team.teamName === "Presidential Team"
);

const founderImageConfig = [
  { aspect: "aspect-[4/3] sm:aspect-[4/3]", scale: "scale-[1.4]", hoverScale: "group-hover:scale-[1.45]", position: "object-[center_60%]" },
  { aspect: "aspect-[4/3] sm:aspect-[4/3]", scale: "scale-100", hoverScale: "group-hover:scale-[1.05]", position: "object-center" },
];

// Notebook paper: blue ruled lines every 28px
const RULED_LINES = "repeating-linear-gradient(to bottom, transparent 0 27px, #dfe6ee 27px 28px)";
const PAPER = "#fffdf8";

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

function getStoryPages(member: { bio?: string }, memberIndex: number) {
  const paragraphs = member.bio?.split("\n").filter(Boolean) ?? [];
  return memberIndex === 0 ? [paragraphs.slice(0, 1), paragraphs.slice(1)] : [paragraphs];
}

export function FoundersSection() {
  const [openStories, setOpenStories] = useState<Record<number, boolean>>({});
  const [storyPageByIndex, setStoryPageByIndex] = useState<Record<number, number>>({});

  if (!presidentialTeamData || !presidentialTeamData.members) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={sectionVariants}
      className="mb-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      <motion.div variants={cardVariants} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Where it started</p>
          <h2 className="font-sans text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Meet our founders</h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-brand-body sm:text-right">
          UONotes began with a simple belief: when students share what they learn, the whole community moves forward.
        </p>
      </motion.div>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {presidentialTeamData.members.map((member, idx) => {
          const imageConfig = founderImageConfig[idx] || founderImageConfig[1];
          const firstName = member.name.split(" ")[0];
          const tilt = idx % 2 === 0 ? "-rotate-2" : "rotate-2";

          return (
            <motion.article
              key={member.name}
              variants={cardVariants}
              layout
              whileHover={{ y: -5 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group relative self-start pb-6 pl-14 pr-5 pt-8 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_36px_-18px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_48px_-20px_rgba(143,0,24,0.35)] sm:pl-16 sm:pr-7"
              style={{ backgroundColor: PAPER, backgroundImage: RULED_LINES }}
            >
              {/* Red margin line */}
              <span aria-hidden="true" className="absolute inset-y-0 left-10 z-10 w-0.5 bg-[#e8a0a6] sm:left-11" />
              {/* Punched holes */}
              {["top-16", "top-1/2 -translate-y-1/2", "bottom-16"].map((pos) => (
                <span
                  key={pos}
                  aria-hidden="true"
                  className={`absolute left-3 z-10 h-4 w-4 rounded-full bg-[#fbf1f1] shadow-[inset_0_2px_3px_rgba(0,0,0,0.18)] sm:left-3.5 ${pos}`}
                />
              ))}

              {/* Taped polaroid photo */}
              <div className={`relative mx-auto mb-7 w-[92%] bg-white p-2.5 pb-11 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.4)] ${tilt}`}>
                <span aria-hidden="true" className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rotate-3 bg-brand-red/25" />
                <div className={`relative ${imageConfig.aspect} overflow-hidden bg-brand-pink`}>
                  <Image
                    src={member.imageUrl || "/placeholder.jpg"}
                    alt={`${member.name}, ${member.role}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`object-cover ${imageConfig.position} ${imageConfig.scale} ${imageConfig.hoverScale} transition-transform duration-700`}
                  />
                </div>
                <p className={`${caveat.className} absolute inset-x-0 bottom-1.5 text-center text-2xl font-bold text-[#1f2a44]`}>
                  {firstName} ♡
                </p>
              </div>

              {/* Written section: re-draws the ruled lines from its own top so the text sits on them */}
              <div
                className="relative -ml-14 -mr-5 pl-14 pr-5 sm:-ml-16 sm:-mr-7 sm:pl-16 sm:pr-7"
                style={{ backgroundColor: PAPER, backgroundImage: RULED_LINES }}
              >
                <p className="font-mono text-[10px] font-bold uppercase leading-7 tracking-[0.18em] text-brand-red">{member.role}</p>
                <h3 className={`${caveat.className} text-[34px] font-bold leading-[56px] text-[#1f2a44] sm:text-4xl`}>
                  <span className="bg-[linear-gradient(transparent_62%,rgba(138,28,36,0.18)_62%)] [box-decoration-break:clone]">
                    {member.name}
                  </span>
                </h3>
                {member.program && (
                  <p className={`${caveat.className} text-xl font-medium leading-7 text-[#6b7386]`}>{member.program}</p>
                )}

                {member.bio && (() => {
                  const isOpen = openStories[idx] ?? false;
                  const storyPages = getStoryPages(member, idx);
                  const activePage = Math.min(storyPageByIndex[idx] ?? 0, storyPages.length - 1);
                  return (
                    <div className={caveat.className}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => {
                          setOpenStories((current) => ({ ...current, [idx]: !isOpen }));
                          if (!isOpen) setStoryPageByIndex((current) => ({ ...current, [idx]: 0 }));
                        }}
                        className="group/story mt-7 inline-flex items-center gap-2 text-2xl font-bold leading-7 text-brand-red"
                      >
                        <span className="underline decoration-brand-red/30 decoration-2 underline-offset-4 transition-colors group-hover/story:decoration-brand-red">
                          {isOpen ? `close ${firstName}'s note` : `read ${firstName}'s note`}
                        </span>
                        <span aria-hidden="true" className={`transition-transform duration-300 ${isOpen ? "rotate-90" : "group-hover/story:translate-x-1"}`}>
                          &rarr;
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.div
                                key={`${member.name}-page-${activePage}`}
                                initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                                animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                                exit={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="pt-7"
                              >
                                {storyPages[activePage].map((paragraph: string, paragraphIndex: number) => (
                                  <p key={paragraphIndex} className="mt-7 text-[21px] font-medium leading-7 text-[#2e3650] first:mt-0 sm:text-[22px]">
                                    {paragraph}
                                  </p>
                                ))}
                              </motion.div>
                            </AnimatePresence>

                            <div className="mt-7 flex items-center justify-between text-xl font-bold leading-7">
                              {storyPages.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setStoryPageByIndex((current) => ({ ...current, [idx]: activePage === 0 ? 1 : 0 }))}
                                  className="text-brand-red transition-opacity hover:opacity-75"
                                >
                                  {activePage === 0 ? "turn the page →" : "← back to the start"}
                                </button>
                              ) : (
                                <span className="text-brand-red">— {firstName}</span>
                              )}
                              <span className="text-[#8b93a5]">p. {activePage + 1} / {storyPages.length}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}