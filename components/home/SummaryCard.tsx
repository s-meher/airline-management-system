import Link from "next/link";

export function SummaryCard({
  title,
  value,
  description,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  value: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>

        {href ? (
          <Link
            href={href}
            className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {hrefLabel ?? "Open"}
          </Link>
        ) : null}
      </div>

      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

