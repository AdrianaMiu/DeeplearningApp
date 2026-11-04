import { BroadcastingExplorer, GradientExplorer, RegressionExplorer } from '../components/Explorers';

export default function Lab() {
  return <div className="page"><header className="page-heading"><p className="eyebrow">Interactive lab · keyboard and table equivalents</p><h1>Mathematical workbench</h1><p>Change one quantity at a time. Every graphic has the same information in text or a table.</p></header><p className="lab-instruction"><span aria-hidden="true">↳</span> Start with broadcasting: edit either shape and compare each axis in the table.</p><div className="lab-grid"><BroadcastingExplorer /><GradientExplorer /><RegressionExplorer /></div><a className="download-card" href={`${import.meta.env.BASE_URL}labs/linear-regression-pytorch.ipynb`} download><span>PyTorch notebook</span><strong>Continue in a real Python runtime</strong><small>The browser downloads this .ipynb; it does not claim to execute it.</small></a></div>;
}
