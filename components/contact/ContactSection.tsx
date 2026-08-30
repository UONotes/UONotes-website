"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { MailIcon } from "@/components/icons";
import { ContactForm } from "./ContactForm";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export function ContactSection() {
  return (
    <motion.section 
      initial="hidden" animate="visible" variants={staggerContainer}
      className="px-6 py-20 lg:py-32 max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
        
        {/* Left Column: Info */}
        <motion.div variants={fadeUp} className="flex flex-col">
          <h1 className="font-logo text-5xl md:text-6xl font-bold text-brand-red tracking-tight mb-8">
            Contact us
          </h1>
          <p className="text-gray-600 text-lg mb-10 max-w-md">
            Have a question about submitting notes, earning volunteer hours, or joining the team? Reach out to us!.
          </p>

          <div className="flex flex-col gap-5 max-w-[380px]">
            {/* General Contact Box */}
            <div className="bg-[#fef5f6] rounded-xl p-6 flex flex-col gap-4 shadow-sm border border-brand-red/10">
              <div className="flex items-center gap-3">
                <MailIcon className="text-brand-red w-5 h-5" />
                <a href="mailto:uofonotes@gmail.com" className="text-base font-medium text-gray-800 hover:text-brand-red transition-colors">
                  uofonotes@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                {/* Ensure you have an Instagram icon exported, or use a temporary placeholder */}
                <Image src="/icons/Icon.svg" alt="Instagram" width={20} height={20} className="opacity-70" />
                <a href="https://instagram.com/uonotes" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-gray-800 hover:text-brand-red transition-colors">
                  @uonotes
                </a>
              </div>
            </div>

            {/* Direct Contact Box */}
            <div className="bg-[#fef5f6] rounded-xl p-6 flex flex-col gap-2 shadow-sm border border-brand-red/10">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">President</p>
              <p className="text-base font-bold text-gray-900 mb-2">Kiana Gholizadeh Vazvani</p>
              <div className="flex items-center gap-3">
                <MailIcon className="text-brand-red w-5 h-5" />
                <a href="mailto:Kiavazvani@gmail.com" className="text-base font-medium text-gray-800 hover:text-brand-red transition-colors">
                  Kiavazvani@gmail.com
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Form */}
        <motion.div variants={fadeUp} className="w-full">
          <ContactForm />
        </motion.div>

      </div>
    </motion.section>
  );
}