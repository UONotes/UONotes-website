"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { upcomingEvents, pastEvents } from "@/lib/events-data";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 56px, rgba(168, 49, 66, 0.2) 56px, rgba(168, 49, 66, 0.2) 58px, transparent 58px),
    linear-gradient(transparent 26px, #e5e7eb 27px)
  `,
  backgroundSize: "100% 100%, 100% 27px",
};

export function EventsSection() {
  const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming");
  
  const [slideIndices, setSlideIndices] = useState<Record<string, number>>({});

  const hasUpcoming = upcomingEvents.length > 0;
  const activeList = viewMode === "upcoming" ? upcomingEvents : pastEvents;

  const handleNextImage = (eventId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndices((prev) => {
      const currentIndex = prev[eventId] || 0;
      return { ...prev, [eventId]: (currentIndex + 1) % totalImages };
    });
  };

  const handlePrevImage = (eventId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndices((prev) => {
      const currentIndex = prev[eventId] || 0;
      return { ...prev, [eventId]: (currentIndex - 1 + totalImages) % totalImages };
    });
  };

  const handleSelectDot = (eventId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndices((prev) => ({ ...prev, [eventId]: index }));
  };

  return (
    <section className="w-full max-w-5xl md:max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
      
      <motion.div 
        layout
        className="w-full bg-white p-5 sm:p-10 md:p-14 rounded-3xl shadow-2xl border border-brand-red/15 relative overflow-hidden"
        style={notebookStyle}
      >
        <div className="absolute top-0 bottom-0 left-12 sm:left-16 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
        
        <div className="absolute top-0 left-0 bottom-0 w-6 sm:w-14 bg-gradient-to-r from-black/[0.03] to-transparent pointer-events-none z-10" />

        <div className="relative z-20 pl-7 sm:pl-12 pr-1 sm:pr-2">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-200/80 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-red font-bold">
                {viewMode === "upcoming" ? "uOttawa // Schedule" : "uOttawa // Archive"}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight font-sans text-gray-900 mt-1">
                {viewMode === "upcoming" ? "Upcoming Events" : "Past Event Archive"}
              </h2>
            </div>

            <button
              onClick={() => setViewMode(viewMode === "upcoming" ? "past" : "upcoming")}
              className="px-4 py-2 bg-white border border-brand-red/20 text-brand-red hover:bg-brand-red hover:text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {viewMode === "upcoming" ? `View Past Archive (${pastEvents.length})` : "← Back to Upcoming"}
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {viewMode === "upcoming" && !hasUpcoming ? (
              <motion.div 
                key="empty-upcoming"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="py-16 text-center flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 font-sans">No Upcoming Events Scheduled</h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md font-light mb-6 leading-relaxed">
                  We are currently curating our upcoming schedule of academic workshops and technical sessions. In the meantime, we invite you to review our past archive from previous semesters.
                </p>
                <button
                  onClick={() => setViewMode("past")}
                  className="px-5 py-2.5 bg-gray-900 text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors shadow-sm cursor-pointer"
                >
                  Explore Past Event Archive →
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key={viewMode}
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {activeList.map((event) => {
                  const photos = event.images && event.images.length > 0 ? event.images : (event.image ? [event.image] : []);
                  const currentIndex = slideIndices[event.id] || 0;

                  return (
                    <motion.div 
                      key={event.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white/90 border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:border-brand-red/40 transition-all flex flex-col group"
                    >
                      <div className="h-48 overflow-hidden relative bg-gray-900">
                        {photos.length > 0 ? (
                          <Image 
                            src={photos[currentIndex]} 
                            alt={`${event.title} - photo ${currentIndex + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-opacity duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-mono">
                            No image available
                          </div>
                        )}
                        
                        <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-md uppercase tracking-wider z-10">
                          {event.date}
                        </span>

                        {photos.length > 1 && (
                          <>
                            <button 
                              onClick={(e) => handlePrevImage(event.id, photos.length, e)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-brand-red transition-colors cursor-pointer backdrop-blur-xs opacity-0 group-hover:opacity-100 z-10"
                              title="Previous Photo"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            
                            <button 
                              onClick={(e) => handleNextImage(event.id, photos.length, e)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-brand-red transition-colors cursor-pointer backdrop-blur-xs opacity-0 group-hover:opacity-100 z-10"
                              title="Next Photo"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>

                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs z-10">
                              {photos.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => handleSelectDot(event.id, idx, e)}
                                  className={`w-1 h-1 rounded-full transition-all ${idx === currentIndex ? "bg-white w-2.5" : "bg-white/50"}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[10px] font-mono text-brand-red font-bold uppercase tracking-widest mb-1">{event.location} • {event.time}</span>
                        <h3 className="font-bold text-gray-900 text-base mb-2">
                          {event.title}
                        </h3>

                        {event.registrationUrl && (
                          <div className="mt-auto pt-2">
                            <a 
                              href={event.registrationUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 text-xs font-mono font-bold text-brand-red hover:text-brand-red-hover uppercase tracking-wider"
                            >
                              Register &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}