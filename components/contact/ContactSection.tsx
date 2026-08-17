import Image from "next/image";
import { MailIcon } from "../icons";
import { ContactForm } from "./ContactForm";

export function ContactSection() {
  return (
    <section className="bg-brand-pink px-6 py-16">
      <div className="max-w-site mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20">
        <div>
          <h1 className="font-logo text-[clamp(2.25rem,4vw,3.25rem)] font-semibold text-brand-red tracking-tight mb-10">
            Contact us
          </h1>

          <div className="flex flex-col gap-4 max-w-[380px]">
            <div className="bg-white rounded-xl p-5 flex flex-col gap-3 shadow-sm shadow-black/5">
              <div className="flex items-center gap-2.5">
                <MailIcon />
                <a href="mailto:uofonotes@gmail.com" className="text-sm font-bold text-brand-dark hover:text-brand-red transition-colors">uofonotes@gmail.com</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Image src="/icons/Icon.svg" alt="" width={18} height={18} />
                <a href="https://instagram.com/uonotes" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-dark hover:text-brand-red transition-colors">uonotes</a>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 flex flex-col gap-1.5 shadow-sm shadow-black/5">
              <p className="text-sm font-bold text-brand-dark">Didn&apos;t get a reply?</p>
              <p className="text-sm font-bold text-brand-dark mb-1">Contact Kiana:</p>
              <div className="flex items-center gap-2.5">
                <MailIcon />
                <a href="mailto:kianazvani@gmail.com" className="text-sm font-bold text-brand-dark hover:text-brand-red transition-colors">kianazvani@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
