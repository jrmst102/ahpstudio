import React, { useRef } from 'react';
import Button from '../common/Button';
import { CHART_COLORS } from '../../utils/constants';

function formatValue(v) {
  if (v >= 1) return String(Math.round(v));
  return '1/' + String(Math.round(1 / v));
}

/**
 * DecisionReport – renders a printable report summarising the AHP analysis.
 *
 * Props:
 *   title, description
 *   criteria, alternatives
 *   subCriteria – { criterion: [sub1, sub2, ...] }
 *   criteriaWeights – { criterion: weight }
 *   criteriaCR – { cr, isConsistent, ... }
 *   altWeights – { criterion: { alt: weight } }
 *   altCRs – { criterion: { cr, isConsistent } }
 *   globalResults – { normalized, idealized }
 *   respondents – [{ id, name, weight, rank }] or []
 *   respondentData – { respId: { criteriaMatrix, altMatrices, ... } }
 *   sensitivityData – sensitivity analysis result or null
 *   sensitivityCriterion – name of analysed criterion
 */
const DecisionReport = ({
  title,
  description,
  criteria = [],
  alternatives = [],
  subCriteria = {},
  criteriaWeights,
  criteriaCR,
  altWeights = {},
  altCRs = {},
  globalResults,
  respondents = [],
  respondentData = {},
  sensitivityData,
  sensitivityCriterion,
}) => {
  const reportRef = useRef(null);

  const handlePrint = () => {
    const content = reportRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AHP Report – ${title || 'Untitled'}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
          h1 { color: #57068C; border-bottom: 3px solid #57068C; padding-bottom: 8px; }
          h2 { color: #57068C; margin-top: 32px; }
          h3 { color: #330662; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
          th { background-color: #57068C; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .bar-container { background: #eee; border-radius: 4px; overflow: hidden; height: 20px; }
          .bar { height: 20px; border-radius: 4px; }
          .consistent { color: #2E7D32; }
          .inconsistent { color: #C62828; }
          .rank { font-size: 18px; font-weight: bold; color: #57068C; }
          .meta { color: #6D6D6D; font-size: 14px; }
          .section { page-break-inside: avoid; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!globalResults) {
    return (
      <div className="text-center py-12">
        <p className="text-nyu-text-secondary mb-4">
          Compute results first before generating a report.
        </p>
      </div>
    );
  }

  const ranking = Object.entries(globalResults.normalized || {})
    .sort(([, a], [, b]) => b - a);

  const winner = ranking[0];
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Build rationale text
  const buildRationale = () => {
    if (!winner) return '';
    const [winnerName, winnerScore] = winner;
    const runnerUp = ranking[1];
    const margin = runnerUp ? ((winnerScore - runnerUp[1]) * 100).toFixed(1) : 0;
    const topCriteria = Object.entries(criteriaWeights || {})
      .sort(([, a], [, b]) => b - a);

    let rationale = `"${winnerName}" is the recommended alternative with a global priority of ${(winnerScore * 100).toFixed(1)}%`;
    if (runnerUp) {
      rationale += `, leading "${runnerUp[0]}" by ${margin} percentage points`;
    }
    rationale += '. ';

    if (topCriteria.length > 0) {
      const [topCrit, topWeight] = topCriteria[0];
      rationale += `The most influential criterion is "${topCrit}" (${(topWeight * 100).toFixed(1)}% weight)`;
      const altScore = altWeights[topCrit]?.[winnerName];
      if (altScore) {
        rationale += `, under which "${winnerName}" scores ${(altScore * 100).toFixed(1)}%`;
      }
      rationale += '. ';
    }

    // Consistency overview
    const allConsistent = criteriaCR?.isConsistent &&
      Object.values(altCRs).every(cr => cr?.isConsistent !== false);
    if (allConsistent) {
      rationale += 'All pairwise comparisons are consistent (CR ≤ 10%).';
    } else {
      rationale += 'Note: Some comparisons have inconsistency ratios above 10% and should be reviewed.';
    }

    return rationale;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-nyu-text-primary">Decision Report</h3>
        <Button onClick={handlePrint}>Print / Save as PDF</Button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        {/* Title */}
        <h1 style={{ color: '#57068C', borderBottom: '3px solid #57068C', paddingBottom: '8px' }}>
          AHP Decision Report
        </h1>
        <p className="meta" style={{ color: '#6D6D6D', fontSize: '14px' }}>
          Generated on {now} · AHP Studio v1.1.4
        </p>

        {/* Problem Definition */}
        <div className="section" style={{ pageBreakInside: 'avoid' }}>
          <h2 style={{ color: '#57068C', marginTop: '32px' }}>1. Problem Definition</h2>
          <p><strong>Title:</strong> {title || 'Untitled'}</p>
          {description && <p><strong>Description:</strong> {description}</p>}
        </div>

        {/* Decision Hierarchy */}
        <div className="section" style={{ pageBreakInside: 'avoid' }}>
          <h2 style={{ color: '#57068C', marginTop: '32px' }}>2. Decision Hierarchy</h2>
          <h3 style={{ color: '#330662' }}>Criteria ({criteria.length})</h3>
          <ul style={{ paddingLeft: '20px' }}>
            {criteria.map((c, i) => {
              const subs = subCriteria[c] || [];
              return (
                <li key={i}>
                  <strong>{c}</strong>
                  {subs.length > 0 && (
                    <ul style={{ paddingLeft: '20px' }}>
                      {subs.map((sc, si) => <li key={si}>{sc}</li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <h3 style={{ color: '#330662' }}>Alternatives ({alternatives.length})</h3>
          <ol style={{ paddingLeft: '20px' }}>
            {alternatives.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </div>

        {/* Respondents (if any) */}
        {respondents.length > 0 && (
          <div className="section" style={{ pageBreakInside: 'avoid' }}>
            <h2 style={{ color: '#57068C', marginTop: '32px' }}>3. Respondents</h2>
            <table>
              <thead>
                <tr>
                  <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Rank</th>
                  <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Name</th>
                  <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Weight</th>
                  <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Effective %</th>
                </tr>
              </thead>
              <tbody>
                {respondents
                  .sort((a, b) => a.rank - b.rank)
                  .map(r => {
                    const totalW = respondents.reduce((s, x) => s + x.weight, 0);
                    return (
                      <tr key={r.id}>
                        <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>#{r.rank}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{r.name}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{r.weight}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{totalW > 0 ? ((r.weight / totalW) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Criteria Weights */}
        <div className="section" style={{ pageBreakInside: 'avoid' }}>
          <h2 style={{ color: '#57068C', marginTop: '32px' }}>
            {respondents.length > 0 ? '4' : '3'}. Criteria Weights
          </h2>
          {criteriaCR && (
            <p style={{ color: criteriaCR.isConsistent ? '#2E7D32' : '#C62828' }}>
              Consistency Ratio: {(criteriaCR.cr * 100).toFixed(2)}% — {criteriaCR.isConsistent ? '✓ Consistent' : '✗ Inconsistent (> 10%)'}
            </p>
          )}
          <table>
            <thead>
              <tr>
                <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Criterion</th>
                <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Weight</th>
                <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Visual</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(criteriaWeights || {})
                .sort(([, a], [, b]) => b - a)
                .map(([c, w], i) => (
                  <tr key={c}>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd', fontWeight: 600 }}>{c}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{(w * 100).toFixed(1)}%</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>
                      <div style={{ background: '#eee', borderRadius: '4px', overflow: 'hidden', height: '20px' }}>
                        <div style={{ width: `${(w * 100).toFixed(1)}%`, height: '20px', borderRadius: '4px', backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Alternative Priorities per Criterion */}
        <div className="section" style={{ pageBreakInside: 'avoid' }}>
          <h2 style={{ color: '#57068C', marginTop: '32px' }}>
            {respondents.length > 0 ? '5' : '4'}. Alternative Priorities by Criterion
          </h2>
          {criteria.map(c => (
            <div key={c} style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#330662' }}>{c}</h3>
              {altCRs[c] && (
                <p style={{ fontSize: '13px', color: altCRs[c].isConsistent ? '#2E7D32' : '#C62828' }}>
                  CR = {(altCRs[c].cr * 100).toFixed(2)}% — {altCRs[c].isConsistent ? '✓' : '✗ Inconsistent'}
                </p>
              )}
              <table>
                <thead>
                  <tr>
                    <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Alternative</th>
                    <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(altWeights[c] || {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([a, w]) => (
                      <tr key={a}>
                        <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{a}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{(w * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Final Ranking */}
        <div className="section" style={{ pageBreakInside: 'avoid' }}>
          <h2 style={{ color: '#57068C', marginTop: '32px' }}>
            {respondents.length > 0 ? '6' : '5'}. Final Ranking
          </h2>
          <table>
            <thead>
              <tr>
                <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Rank</th>
                <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Alternative</th>
                <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Global Priority</th>
                <th style={{ background: '#57068C', color: 'white', padding: '8px 12px', border: '1px solid #ddd' }}>Idealized</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(([alt, w], i) => (
                <tr key={alt} style={i === 0 ? { fontWeight: 'bold', backgroundColor: '#EEE6F3' } : {}}>
                  <td style={{ padding: '8px 12px', border: '1px solid #ddd', color: '#57068C', fontWeight: 'bold', fontSize: '16px' }}>#{i + 1}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{alt}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{(w * 100).toFixed(1)}%</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{((globalResults.idealized?.[alt] || 0) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Decision Rationale */}
        <div className="section" style={{ pageBreakInside: 'avoid' }}>
          <h2 style={{ color: '#57068C', marginTop: '32px' }}>
            {respondents.length > 0 ? '7' : '6'}. Decision Rationale
          </h2>
          <div style={{ backgroundColor: '#EEE6F3', borderLeft: '4px solid #57068C', padding: '16px', borderRadius: '4px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.7' }}>{buildRationale()}</p>
          </div>

          {/* Key supporting facts */}
          <h3 style={{ color: '#330662', marginTop: '16px' }}>Supporting Analysis</h3>
          <ul style={{ paddingLeft: '20px' }}>
            {ranking.map(([alt, w], i) => {
              // Find which criterion most strongly supports this alternative
              let bestCrit = '';
              let bestScore = 0;
              criteria.forEach(c => {
                const score = (altWeights[c]?.[alt] || 0) * (criteriaWeights?.[c] || 0);
                if (score > bestScore) { bestScore = score; bestCrit = c; }
              });
              return (
                <li key={alt} style={{ marginBottom: '4px' }}>
                  <strong>#{i + 1} {alt}</strong> ({(w * 100).toFixed(1)}%):
                  strongest contribution from "{bestCrit}" ({(bestScore * 100).toFixed(1)}% weighted contribution)
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sensitivity note */}
        {sensitivityData && sensitivityCriterion && (
          <div className="section" style={{ pageBreakInside: 'avoid' }}>
            <h2 style={{ color: '#57068C', marginTop: '32px' }}>
              {respondents.length > 0 ? '8' : '7'}. Sensitivity Analysis
            </h2>
            <p>
              A sensitivity analysis was performed on the criterion "{sensitivityCriterion}" by varying its weight from 0% to 100%.
              {(() => {
                // Check if the winner changes at any weight
                const reversals = [];
                let prevWinner = null;
                (sensitivityData.dataPoints || []).forEach(dp => {
                  const entries = Object.entries(dp.priorities || {});
                  if (entries.length === 0) return;
                  const top = entries.sort(([, a], [, b]) => b - a)[0][0];
                  if (prevWinner && top !== prevWinner) {
                    reversals.push({ weight: dp.weight, from: prevWinner, to: top });
                  }
                  prevWinner = top;
                });
                if (reversals.length === 0) {
                  return ` The ranking remains stable across all weight values—the recommended alternative does not change.`;
                }
                return ` Rank reversals were detected at ${reversals.length} point(s), indicating sensitivity to this criterion.`;
              })()}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #ddd', color: '#6D6D6D', fontSize: '12px' }}>
          <p>This report was generated by AHP Studio using the Analytic Hierarchy Process methodology (Saaty, 1980).</p>
        </div>
      </div>
    </div>
  );
};

export default DecisionReport;
