import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('verification');

export default function VerificationPolicyPage() {
  return <ServicePolicyPageView slug="verification" />;
}
