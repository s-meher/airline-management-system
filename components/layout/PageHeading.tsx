export function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 md:mb-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-600 md:text-lg dark:text-zinc-300">
          {description}
        </p>
      ) : null}
    </header>
  );
}
