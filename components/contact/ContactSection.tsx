"use client";

import Image from "next/image";
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
      className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Compact Editorial Info */}
        <motion.div variants={fadeUp} className="flex flex-col">
          <h1 className="font-logo text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Let's talk <span className="text-brand-red">UONotes.</span>
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6 font-sans max-w-md">
            Have a question about submitting notes, earning volunteer hours, joining our campus team, or sponorships? Reach out and we'll get back to you promptly.
          </p>

          <div className="flex flex-col gap-3.5 w-full max-w-md">
            
            {/* General Inquiries Glass Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-brand-red/15 transition-all hover:border-brand-red/30">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                // OFFICIAL CHANNELS
              </span>
              <div className="flex flex-col gap-2.5">
                <a 
                  href="mailto:uofonotes@gmail.com" 
                  className="flex items-center gap-3 text-xs font-bold font-logo uppercase tracking-wider text-gray-800 hover:text-brand-red transition-colors p-1.5 rounded-xl hover:bg-brand-red/5 -mx-1.5"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                    <MailIcon className="w-3.5 h-3.5" />
                  </span>
                  <span>uofonotes@gmail.com</span>
                </a>

                <a 
                  href="https://instagram.com/uonotes" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 text-xs font-bold font-logo uppercase tracking-wider text-gray-800 hover:text-brand-red transition-colors p-1.5 rounded-xl hover:bg-brand-red/5 -mx-1.5"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                  <span>@uonotes</span>
                </a>
              </div>
            </div>

            {/* Direct Leadership Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-brand-red/15 transition-all hover:border-brand-red/30">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">
                // EXECUTIVE LEADERSHIP
              </span>
              <p className="text-[10px] font-mono text-brand-red font-bold uppercase tracking-wider mb-1">President</p>
              <p className="text-sm font-black text-gray-900 mb-2 font-sans">Kiana Gholizadeh Vazvani</p>
              
              <a 
                href="mailto:Kiavazvani@gmail.com" 
                className="flex items-center gap-3 text-xs font-bold font-logo uppercase tracking-wider text-gray-800 hover:text-brand-red transition-colors p-1.5 rounded-xl hover:bg-brand-red/5 -mx-1.5"
              >
                <span className="w-7 h-7 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
                  <MailIcon className="w-3.5 h-3.5" />
                </span>
                <span>Kiavazvani@gmail.com</span>
              </a>
            </div>

          </div>
        </motion.div>

        {/* Right Column: Redesigned Glass Form */}
        <motion.div variants={fadeUp} className="w-full">
          <ContactForm />
        </motion.div>

      </div>
    </motion.section>
  );
}