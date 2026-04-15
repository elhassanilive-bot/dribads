import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('marketplace');

export default function MarketplacePolicyPage() {
  return <ServicePolicyPageView slug="marketplace" />;
}
