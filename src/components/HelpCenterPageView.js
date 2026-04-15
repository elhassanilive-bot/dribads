import FaqAccordion from "@/app/faq/FaqAccordion";
import { faqSections } from "@/app/faq/faqData";

export default function HelpCenterPageView() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <FaqAccordion sections={faqSections} />
    </div>
  );
}

