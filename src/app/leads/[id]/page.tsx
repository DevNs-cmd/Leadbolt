import { LeadDetail } from '@/components/lead/LeadDetail';

export default function LeadPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <LeadDetail leadId={params.id} />
    </div>
  );
}