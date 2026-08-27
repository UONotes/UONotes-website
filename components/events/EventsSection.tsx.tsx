"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upcomingEvents, pastEvents, type EventItem } from "@/lib/events-data";

const notebookStyle = {
  backgroundImage: `
    linear-gradient(90deg, transparent 56px, rgba(168, 49, 66, 0.2) 56px, rgba(168, 49, 66, 0.2) 58px, transparent 58px),
    linear-gradient(transparent 26px, #e5e7eb 27px)
  `,
  backgroundSize: "100% 100%, 100% 27px",
};

export function EventsSection() {
  const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const hasUpcoming = upcomingEvents.length > 0;
  const activeList = viewMode === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <section className="w-full max-w-5xl md:max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
      
      {/* Notebook Container Wrapper */}
      <motion.div 
        layout
        className="w-full bg-white p-5 sm:p-10 md:p-14 rounded-3xl shadow-2xl border border-brand-red/15 relative overflow-hidden"
        style={notebookStyle}
      >
        {/* Red Margin Line */}
        <div className="absolute top-0 bottom-0 left-12 sm:left-16 w-[2px] bg-[#a83142]/25 pointer-events-none z-0" />
        
        {/* Notebook Spine Shadow */}
        <div className="absolute top-0 left-0 bottom-0 w-6 sm:w-14 bg-gradient-to-r from-black/[0.03] to-transparent pointer-events-none z-10" />

        {/* Content Area with Notebook Padding */}
        <div className="relative z-20 pl-7 sm:pl-12 pr-1 sm:pr-2">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-200/80 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-red font-bold">
                {viewMode === "upcoming" ? "uOttawa // Schedule" : "uOttawa // Archive"}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight font-sans text-gray-900 mt-1">
                {viewMode === "upcoming" ? "Upcoming Events" : "Past Event Archive"}
              </h2>
            </div>

            {/* Switch Action Button */}
            <button
              onClick={() => setViewMode(viewMode === "upcoming" ? "past" : "upcoming")}
              className="px-4 py-2 bg-white border border-brand-red/20 text-brand-red hover:bg-brand-red hover:text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {viewMode === "upcoming" ? `View Past Archive (${pastEvents.length})` : "← Back to Upcoming"}
            </button>
          </div>

          {/* Dynamic View Display */}
          <AnimatePresence mode="popLayout">
            {viewMode === "upcoming" && !hasUpcoming ? (
              /* Professional Empty State Container */
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
              /* Events Grid */
              <motion.div 
                key={viewMode}
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {activeList.map((event) => (
                  <motion.div 
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-white/90 border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:border-brand-red/40 transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="h-44 overflow-hidden relative bg-gray-100">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {event.date}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-[10px] font-mono text-brand-red font-bold uppercase tracking-widest mb-1">{event.location} • {event.time}</span>
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-brand-red transition-colors mb-2">
                        {event.title}
                      </h3>
                      <span className="mt-auto text-xs font-mono font-bold text-brand-red uppercase tracking-wider flex items-center pt-2 gap-1">
                        View Details &rarr;
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-xl w-full border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-mono text-brand-red font-bold uppercase tracking-widest">{selectedEvent.date} | {selectedEvent.time} • {selectedEvent.location}</span>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{selectedEvent.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-brand-red transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Main Graphic / Image */}
              <div className="mb-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Featured Graphic</span>
                <img 
                  src={selectedEvent.image} 
                  alt={selectedEvent.title} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80";
                  }}
                  className="w-full h-56 object-cover rounded-xl shadow-sm border border-gray-100"
                />
              </div>

              {selectedEvent.registrationUrl && (
                <div className="mb-6">
                  <a 
                    href={selectedEvent.registrationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full py-3 bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-brand-red-hover transition-colors shadow-sm flex items-center justify-center"
                  >
                    Register for Event →
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}