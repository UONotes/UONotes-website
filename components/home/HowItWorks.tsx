import { FileTextIcon, ArrowIcon, EditIcon, StarIcon } from "../icons";

export function HowItWorks() {
  return (
    <section className="section-wrapper">
      <h2 className="section-title">How it works</h2>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 flex-wrap">
        <div className="flex flex-col items-center gap-3 w-[160px] text-center">
          <FileTextIcon />
          <p className="text-sm text-brand-body leading-snug">Upload your notes</p>
        </div>
        <div className="sm:mx-2 rotate-90 sm:rotate-0 -mt-2 sm:-mt-5"><ArrowIcon /></div>
        <div className="flex flex-col items-center gap-3 w-[160px] text-center">
          <EditIcon />
          <p className="text-sm text-brand-body leading-snug">Get reviewed by our team</p>
        </div>
        <div className="sm:mx-2 rotate-90 sm:rotate-0 -mt-2 sm:-mt-5"><ArrowIcon /></div>
        <div className="flex flex-col items-center gap-3 w-[160px] text-center">
          <StarIcon />
          <p className="text-sm text-brand-body leading-snug">Earn volunteer hours</p>
        </div>
      </div>
    </section>
  );
}