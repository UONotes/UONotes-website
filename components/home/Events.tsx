"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Calendar, Clock, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { upcomingEvents, pastEvents } from "@/lib/events-data";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export function Events() {
  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
      className="py-10 md:py-16 max-w-6xl mx-auto px-6 relative z-10 overflow-hidden"
    >
      {/* Background Decorative Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-red/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Upcoming Events Section */}
      <motion.div variants={fadeUp} className="flex flex-col items-center text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-bold font-logo text-brand-red tracking-tight mb-3">
          Upcoming Events
        </h2>
        <p className="text-gray-500 max-w-xl text-lg">
          Join us at our upcoming campus activities and get-togethers.
        </p>
      </motion.div>

      {upcomingEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {upcomingEvents.map((event) => {
            const cardContent = (
              <motion.div 
                variants={fadeUp} 
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl p-3 shadow-xl shadow-gray-100 border border-gray-100 hover:border-brand-red/30 transition-all flex flex-col group overflow-hidden h-full"
              >
                <div className="relative w-full h-56 rounded-2xl overflow-hidden shrink-0">
                  <Image 
                    src={event.image} 
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-red flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{event.date}</span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-snug group-hover:text-brand-red transition-colors">
                      {event.title}
                    </h3>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-red shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-red shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );

            return (
              <div key={event.id}>
                {event.registrationUrl ? (
                  <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
                    {cardContent}
                  </a>
                ) : (
                  cardContent
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <motion.div 
          variants={fadeUp} 
          className="relative bg-white rounded-[32px] border border-brand-red/20 p-8 md:p-12 text-center max-w-3xl mx-auto mb-16 shadow-2xl shadow-brand-red/5 overflow-hidden group"
        >
          {/* Animated background pulse rings */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-red/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-red/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

          <motion.div 
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-brand-red to-brand-red/80 text-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-brand-red/30">
              <Sparkles className="w-10 h-10 animate-spin-slow" />
            </div>
            
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold uppercase tracking-widest mb-3">
              Stay Tuned
            </span>

            <h3 className="text-2xl md:text-3xl font-bold font-logo text-gray-900 mb-3 tracking-tight">
              New events dropping soon
            </h3>
            
            <p className="text-gray-600 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
              We are currently organizing our next lineup of campus events and activities. Check back soon or follow our social channels for updates!
            </p>

            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://instagram.com/uonotes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-red text-white font-semibold text-sm shadow-xl shadow-brand-red/25 hover:bg-brand-red/90 transition-all"
            >
              <span>Follow Instagram</span>
              <ArrowRight className="w-4 h-4" />
            </motion.a>
          </motion.div>
        </motion.div>
      )}

      {/* Past Events Archive Section */}
      <motion.div variants={fadeUp} className="flex flex-col items-center text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold font-logo text-gray-800 tracking-tight mb-2">
          Past Events Archive
        </h2>
        <p className="text-gray-400 text-sm max-w-md">
          A look back at some of our previous community gatherings and activities.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {pastEvents.map((event) => (
          <motion.div 
            key={event.id}
            variants={fadeUp}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 flex flex-col group overflow-hidden"
          >
            <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-5">
              <Image 
                src={event.image} 
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-red uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{event.date}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 leading-snug">{event.title}</h3>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
              <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}