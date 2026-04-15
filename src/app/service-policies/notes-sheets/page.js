import ServicePolicyPageView, { buildServicePolicyMetadata } from '@/components/ServicePolicyPageView';

export const metadata = buildServicePolicyMetadata('notes-sheets');

export default function NotesSheetsPolicyPage() {
  return <ServicePolicyPageView slug="notes-sheets" />;
}
