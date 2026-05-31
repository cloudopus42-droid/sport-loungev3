import clsx from 'clsx';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded-md',
    circle: 'rounded-full',
    rect: 'rounded-xl',
    card: 'rounded-2xl min-h-[200px]',
  };

  return (
    <div
      className={clsx(
        'bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="bg-glass-bg backdrop-blur-glass border border-glass-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Skeleton variant="circle" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="120px" />
          <Skeleton width="80px" className="h-3" />
        </div>
      </div>
      {/* Image */}
      <Skeleton variant="rect" className="w-full aspect-square" />
      {/* Content */}
      <div className="p-4 space-y-2">
        <Skeleton width="60%" />
        <Skeleton width="90%" />
        <Skeleton width="40%" />
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-2">
      <Skeleton variant="circle" width="68px" height="68px" />
      <Skeleton width="48px" className="h-2.5" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-glass-bg backdrop-blur-glass border border-glass-border rounded-2xl p-6 space-y-3">
      <Skeleton variant="circle" width="48px" height="48px" />
      <Skeleton width="60px" height="32px" />
      <Skeleton width="100px" />
    </div>
  );
}
