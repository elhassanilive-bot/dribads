import PolicyArticle from '@/components/PolicyArticle';
import { site } from '@/config/site';
import { servicePolicies } from '@/content/servicePolicies';

export function buildServicePolicyMetadata(slug) {
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

export default function ServicePolicyPageView({ slug }) {
  const policy = servicePolicies[slug];

  if (!policy) {
    return null;
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
