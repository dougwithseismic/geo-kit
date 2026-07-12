/**
 * A cited statistic, visually prominent. Statistics with a *named source* are
 * among the strongest drivers of AI citations — only use real, verifiable
 * numbers, never fabricated ones.
 */
export function StatCallout({
  value,
  label,
  source,
  sourceUrl,
  className,
}: {
  value: string;
  label: string;
  source?: string;
  sourceUrl?: string;
  className?: string;
}) {
  return (
    <figure className={className} data-geo="stat-callout">
      <span data-geo="stat-value">{value}</span>
      <figcaption data-geo="stat-label">
        {label}
        {source ? (
          <>
            {" — "}
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                {source}
              </a>
            ) : (
              <cite>{source}</cite>
            )}
          </>
        ) : null}
      </figcaption>
    </figure>
  );
}
