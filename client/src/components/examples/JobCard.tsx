import { JobCard } from '../JobCard'

export default function JobCardExample() {
  return (
    <div className="p-8 max-w-md">
      <JobCard
        id="1"
        serviceType="Brake Service"
        title="Front brake pads replacement"
        description="Squeaking noise when braking. Need front brake pads replaced on 2018 Honda Civic."
        location="San Francisco, CA 94105"
        preferredDate="2025-10-15"
        preferredTime="14:00"
        estimatedPrice={250}
        status="requested"
        onAccept={() => console.log('Job accepted')}
        onViewDetails={() => console.log('View details')}
      />
    </div>
  )
}
