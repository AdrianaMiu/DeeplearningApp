import { useAppData } from '../app/context';
import type { SectionGuide } from '../content/section-guides';

export function PagePurpose({ guide }: { guide: SectionGuide }) {
  const { snapshot } = useAppData();
  return (
    <section className="page-purpose" aria-label={`${guide.label} guide`}>
      <div className="page-purpose-summary"><h2>{guide.label}</h2><p>{guide.purpose}</p></div>
      <dl className="page-purpose-details">
        <div><dt>Next action</dt><dd>{guide.action}</dd></div>
        <div><dt>Saved evidence</dt><dd>{guide.evidence}</dd></div>
      </dl>
      {snapshot?.settings.language === 'ro-help' ? <p className="page-purpose-helper" lang="ro">{guide.helperRo}</p> : null}
    </section>
  );
}
