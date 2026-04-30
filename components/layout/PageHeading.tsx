export function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-10 md:mb-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-600">
          {description}
        </p>
      ) : null}
    </header>
  );
}
