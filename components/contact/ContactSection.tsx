"use client";

import { motion, Variants } from "framer-motion";
import { MailIcon } from "@/components/icons";
import { ContactForm } from "./ContactForm";
import { Globe } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export function ContactSection() {
  return (
    <motion.section 
      initial="hidden" animate="visible" variants={staggerContainer}
      className="px-6 lg:px-8 py-12 lg:py-24 w-full max-w-site mx-auto min-h-[calc(100dvh-100px)] flex flex-col justify-center"
    >
      {/* 
        CRITICAL CHANGE: This is now a Flexbox row with 'justify-between' and 'items-start'. 
        If you don't see these exact classes in your browser DevTools, your code didn't update.
      */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-8 w-full">
        
        {/* Left Column */}
        <motion.div variants={fadeUp} className="flex flex-col w-full lg:w-[45%] max-w-lg">
          <h1 className="font-logo text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4">
            Let's talk <br/> <span className="text-brand-red">UONotes.</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-10 font-sans max-w-md">
            Have a question about submitting notes, earning volunteer hours, joining our campus team, or sponsorships? Reach out and we'll get back to you promptly.
          </p>

          <div className="flex flex-col gap-4 w-full">
            
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-brand-red/15 transition-all hover:border-brand-red/30">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold block mb-3">
                // OFFICIAL CHANNELS
              </span>
              <div className="flex flex-col gap-3">
                <a href="mailto:uofonotes@gmail.com" className="flex items-center gap-3 text-sm font-bold font-logo uppercase tracking-wider text-gray-800 hover:text-brand-red transition-colors p-1.5 rounded-xl hover:bg-brand-red/5 -mx-1.5">
                  <span className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                    <MailIcon className="w-4 h-4" />
                  </span>
                  <span>uofonotes@gmail.com</span>
                </a>
                <a href="https://instagram.com/uonotes" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold font-logo uppercase tracking-wider text-gray-800 hover:text-brand-red transition-colors p-1.5 rounded-xl hover:bg-brand-red/5 -mx-1.5">
                  <span className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                    <Globe className="w-4 h-4" />
                  </span>
                  <span>@uonotes</span>
                </a>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-brand-red/15 transition-all hover:border-brand-red/30">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                // EXECUTIVE LEADERSHIP
              </span>
              <p className="text-[11px] font-mono text-brand-red font-bold uppercase tracking-wider mb-1">President</p>
              <p className="text-base font-black text-gray-900 mb-3 font-sans">Kiana Gholizadeh Vazvani</p>
              <a href="mailto:Kiavazvani@gmail.com" className="flex items-center gap-3 text-sm font-bold font-logo uppercase tracking-wider text-gray-800 hover:text-brand-red transition-colors p-1.5 rounded-xl hover:bg-brand-red/5 -mx-1.5">
                <span className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                  <MailIcon className="w-4 h-4" />
                </span>
                <span>Kiavazvani@gmail.com</span>
              </a>
            </div>

          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div variants={fadeUp} className="w-full lg:w-[50%] flex justify-end">
          <div className="w-full max-w-xl">
            <ContactForm />
          </div>
        </motion.div>

      </div>
    </motion.section>
  );
}