import { useState } from 'react'
import { PaymentModal } from '../PaymentModal'
import { Button } from '@/components/ui/button'

export default function PaymentModalExample() {
  const [open, setOpen] = useState(false)

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Payment Modal</Button>
      <PaymentModal
        open={open}
        onOpenChange={setOpen}
        jobTitle="Front brake pads replacement"
        serviceType="Brake Service"
        subtotal={250}
        tax={22.5}
        total={272.5}
      />
    </div>
  )
}
