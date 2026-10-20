import { Skeleton } from "@/components/ui/Skeleton";

export function SubjectCardSkeleton() {
  return (
    <li aria-hidden="true">
      <div className="block min-h-28 rounded-xl border border-ink/10 bg-white p-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-6 w-3/4" />
      </div>
    </li>
  );
}

export function PaperRowSkeleton() {
  return (
    <li aria-hidden="true" className="flex min-h-[93px] flex-col gap-4 rounded-xl border border-ink/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Skeleton className="h-5 w-3/4 max-w-sm" />
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Skeleton className="h-11 w-16 rounded-lg" />
        <Skeleton className="h-11 w-24 rounded-lg" />
      </div>
    </li>
  );
}

export function ArticleCardSkeleton() {
  return (
    <li aria-hidden="true">
      <div className="block h-full min-h-[170px] rounded-xl border border-ink/10 bg-white p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-6 w-4/5" />
        <Skeleton className="mt-2 h-6 w-full" />
        <Skeleton className="mt-1 h-6 w-11/12" />
      </div>
    </li>
  );
}
