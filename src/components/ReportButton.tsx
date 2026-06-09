'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const ReportModal = dynamic(() => import('./ReportModal'), { ssr: false })

export default function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        Пожаловаться на объявление
      </button>

      {open && (
        <ReportModal listingId={listingId} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
