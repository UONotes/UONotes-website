"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { UploadCloud, FileSearch, Award } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: <UploadCloud className="w-6 h-6" />,
      title: "Upload your notes",
      desc: "Share your well-organized study materials, cheat sheets, and past exams in PDF format."
    },
    {
      icon: <FileSearch className="w-6 h-6" />,
      title: "Get reviewed by our team",
      desc: "Our team verifies the content to ensure all resources meet high academic standards."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Earn volunteer hours",
      desc: "Get recognized for your contributions. Verified uploads count toward official volunteer hours."
    }
  ];

  return (
    <motion.section 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
      className="py-16 md:py-24 relative z-10 text-center"
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div variants={fadeUp} className="mb-16 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold font-logo text-brand-red tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-gray-500 max-w-xl text-lg">
            Three simple steps to start contributing to the community.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            
            return (
              <motion.div key={idx} variants={fadeUp} className="flex flex-col relative pt-8 text-center items-center">
                
                {/* Background Track Line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gray-200/80 overflow-hidden">
                  {isActive && (
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 3.5, ease: "linear" }}
                      className="absolute inset-0 h-[2px] -translate-y-[0.5px] bg-brand-red origin-left"
                    />
                  )}
                </div>

                <div className="w-full flex items-center justify-between mb-6 px-2">
                  <span className={`text-3xl font-logo font-bold transition-colors duration-500 ${isActive ? "text-brand-red" : "text-gray-200"}`}>
                    0{idx + 1}.
                  </span>
                  <div className={`p-3 rounded-lg transition-colors duration-500 ${isActive ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" : "bg-brand-red/5 text-brand-red"}`}>
                    {step.icon}
                  </div>
                </div>
                
                <h3 className={`text-xl font-semibold mb-3 transition-colors duration-500 ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                  {step.title}
                </h3>
                <p className={`text-sm leading-relaxed transition-colors duration-500 max-w-sm ${isActive ? "text-gray-600" : "text-gray-400"}`}>
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}