import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('charity');

export default function CharityPolicyPage() {
  return <ServicePolicyPageView slug="charity" />;
}
