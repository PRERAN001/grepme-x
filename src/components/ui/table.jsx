import { cn } from '../../lib/utils'

function Table({ className, ...props }) {
  return (
    <div className='w-full overflow-x-auto rounded-xl border border-border bg-[#0d0d0d]'>
      <table
        className={cn('w-full caption-bottom text-sm [border-collapse:separate] [border-spacing:0]', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }) {
  return <thead className={cn('bg-[#0d0d0d]', className)} {...props} />
}

function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn('border-b border-border transition-colors hover:bg-[#101010]', className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle text-xs font-medium uppercase tracking-[0.08em] text-foreground/90',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }) {
  return <td className={cn('p-4 align-middle text-muted', className)} {...props} />
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
