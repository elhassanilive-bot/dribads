import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('real-estate');

export default function RealEstatePolicyPage() {
  return <ServicePolicyPageView slug="real-estate" />;
}
