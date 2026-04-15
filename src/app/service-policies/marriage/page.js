import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('marriage');

export default function MarriagePolicyPage() {
  return <ServicePolicyPageView slug="marriage" />;
}
