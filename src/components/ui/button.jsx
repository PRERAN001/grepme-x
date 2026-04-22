import { cva } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 h-10 px-5',
  {
    variants: {
      variant: {
        default: 'bg-accent text-black hover:bg-[#34d66d]',
        outline: 'border border-border bg-transparent text-foreground hover:border-accent hover:text-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Button({ className, variant, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  )
}

export { Button, buttonVariants }
