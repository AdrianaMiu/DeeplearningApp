import katex from 'katex';

export function Equation({ latex, label }: { latex: string; label: string }) {
  const markup = katex.renderToString(latex, {
    output: 'mathml',
    throwOnError: false,
    strict: 'warn',
  });
  return <div className="equation" role="group" aria-label={label} dangerouslySetInnerHTML={{ __html: markup }} />;
}
