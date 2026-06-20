import { initials } from '@/lib/format';
import { cn } from '@/lib/cn';

export function Avatar({
  name,
  email,
  src,
  size = 'md',
  className,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-7 w-7 text-2xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-base',
  };
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand',
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name || email || 'avatar'} className="h-full w-full object-cover" />
      ) : (
        initials(name, email)
      )}
    </div>
  );
}
