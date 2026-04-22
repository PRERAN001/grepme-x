import { useEffect, useState } from 'react'

import { cn } from '../lib/utils'

function AnnouncementBanner({
  title,
  description,
  actionLabel,
  actionHref,
  storageKey,
  className,
  onDismiss,
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!storageKey) return

    const dismissed = window.localStorage.getItem(storageKey)

    if (dismissed === 'true') {
      setVisible(false)
    }
  }, [storageKey])

  function handleDismiss() {
    if (storageKey) {
      window.localStorage.setItem(storageKey, 'true')
    }

    setVisible(false)
    onDismiss?.()
  }

  if (!visible) {
    return null
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-40 mb-6 rounded-b-xl border border-border border-t-0 bg-[#101010]/95 px-4 py-3 backdrop-blur md:px-6',
        className,
      )}
      role='status'
      aria-live='polite'
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-accent' />
          <div>
            <p className='font-mono text-xs uppercase tracking-[0.16em] text-accent/80'>
              {title}
            </p>
            <p className='mt-1 text-sm text-foreground/90'>{description}</p>
          </div>
        </div>

        <div className='flex items-center gap-3 self-end sm:self-center'>
          {actionHref && actionLabel ? (
            <a
              href={actionHref}
              className='text-sm text-accent transition-colors hover:text-[#4ade80]'
            >
              {actionLabel}
            </a>
          ) : null}
          <button
            type='button'
            onClick={handleDismiss}
            className='rounded-md border border-border bg-[#151515] px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export { AnnouncementBanner }
