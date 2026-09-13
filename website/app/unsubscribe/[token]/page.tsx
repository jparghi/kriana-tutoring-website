import type { Metadata } from 'next'

import { UnsubscribeForm } from './unsubscribe-form'

export const metadata: Metadata = {
  title: 'Unsubscribe | Kriana Tutoring',
  // An unsubscribe URL carries a secret token — keep it out of search results.
  robots: { index: false, follow: false },
}

export default function UnsubscribePage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <UnsubscribeForm token={params.token} />
    </div>
  )
}
