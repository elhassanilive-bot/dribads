import FaqAccordion from './FaqAccordion';
import { faqSections } from './faqData';

export const metadata = {
  title: 'مركز المساعدة | دريبدو',
  description: 'ابحث في مركز المساعدة عن إجابات واضحة حول التسجيل، النشر، الدردشة، الخصوصية، الأقسام الإضافية، والمشاكل التقنية في دريبدو.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <FaqAccordion sections={faqSections} />
    </div>
  );
}
