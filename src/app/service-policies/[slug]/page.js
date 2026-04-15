import { notFound } from 'next/navigation';
import PolicyArticle from '@/components/PolicyArticle';
import { site } from '@/config/site';
import { servicePolicies } from '@/content/servicePolicies';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const policy = servicePolicies[slug];
  if (!policy) {
    return {};
  }

  return {
    title: `${policy.title} | ${site.name}`,
    description: policy.description,
    alternates: { canonical: `/service-policies/${slug}` },
  };
}

export function generateStaticParams() {
  return Object.keys(servicePolicies).map((slug) => ({ slug }));
}

export default async function ServicePolicyPage({ params }) {
  const { slug } = await params;
  const policy = servicePolicies[slug];

  if (!policy) {
    notFound();
  }

  return (
    <PolicyArticle
      icon={policy.icon}
      eyebrow="سياسات الخدمات"
      title={policy.title}
      description={policy.description}
      highlights={policy.highlights}
      sections={policy.sections}
      supportEmail={site.supportEmail}
    />
  );
}
