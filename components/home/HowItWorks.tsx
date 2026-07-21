import { FileTextIcon, ArrowIcon, EditIcon, StarIcon } from "../icons";

export function HowItWorks() {
  return (
    <section className="section how-it-works">
      <h2 className="section-title">How it works</h2>
      <div className="steps-row">
        <div className="step">
          <FileTextIcon />
          <p className="step-label">Upload your notes</p>
        </div>
        <ArrowIcon />
        <div className="step">
          <EditIcon />
          <p className="step-label">Get reviewed by our team</p>
        </div>
        <ArrowIcon />
        <div className="step">
          <StarIcon />
          <p className="step-label">Earn volunteer hours</p>
        </div>
      </div>
    </section>
  );
}