import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('jobs');

export default function JobsPolicyPage() {
  return <ServicePolicyPageView slug="jobs" />;
}
