import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('tools');

export default function ToolsPolicyPage() {
  return <ServicePolicyPageView slug="tools" />;
}
