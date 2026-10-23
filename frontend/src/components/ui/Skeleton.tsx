type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
};

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton block rounded bg-ink/10 ${className}`}
      style={{ width, height }}
    />
  );
}
