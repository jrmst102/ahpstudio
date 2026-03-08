import React from 'react';
import { useNavigate } from 'react-router-dom';

const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="text-nyu-violet hover:underline text-sm mb-6 inline-block">← Back</button>
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-nyu-text-primary mb-6">Help</h1>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Getting Started</h2>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Logging In</h3>
          <p className="text-nyu-text-secondary mb-4">
            Open AHP Studio in your web browser using the URL provided by your instructor. Enter the username and password that were assigned to you by the course administrator, then click <strong>Sign In</strong>.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            If you enter the wrong password three times in a row, your account will be locked automatically. Contact your instructor or the course administrator to have it restored.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Changing Your Password</h3>
          <p className="text-nyu-text-secondary mb-4">
            After your first login, it is recommended that you change the temporary password. Click your username in the top-right corner and select <strong>Account Settings</strong>. Passwords must be at least eight characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Working with Decision Problems</h2>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Creating a New Problem</h3>
          <p className="text-nyu-text-secondary mb-4">
            From the Dashboard, click <strong>New Problem</strong>. Enter a title for your decision, an optional description, and a goal statement. Click <strong>Save</strong> at any time to preserve your progress.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Saving Your Work</h3>
          <p className="text-nyu-text-secondary mb-4">
            Click the <strong>Save</strong> button in the editor toolbar to save the current state. You can also click <strong>Download</strong> to export the <code>.AHP</code> file to your local machine as a backup.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Loading and Deleting Problems</h3>
          <p className="text-nyu-text-secondary mb-4">
            From the Dashboard, click <strong>Open</strong> next to any saved problem. To delete, click <strong>Delete</strong> — this is permanent and cannot be recovered unless you have a local backup.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Building Your Decision Model</h2>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Step 1: Problem Definition</h3>
          <p className="text-nyu-text-secondary mb-4">
            Set the title, description, and goal for your decision. The goal should be phrased as an action-oriented objective.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Step 2: Criteria</h3>
          <p className="text-nyu-text-secondary mb-4">
            Define the factors that matter in your decision. Click <strong>Add Criterion</strong> and enter a name. You can add sub-criteria by expanding any criterion — up to 6 sub-criteria per criterion. You can define up to 10 first-level criteria.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Step 3: Alternatives</h3>
          <p className="text-nyu-text-secondary mb-4">
            Add the options you are evaluating — up to 12 alternatives per problem. Note that each additional alternative increases the number of pairwise comparisons required.
          </p>

          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-left">Alternatives</th>
                  <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-left">Comparisons per Criterion</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [3, 3], [4, 6], [5, 10], [6, 15], [7, 21], [8, 28], [9, 36], [10, 45], [11, 55], [12, 66],
                ].map(([alts, comps], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border border-gray-200">{alts}</td>
                    <td className="p-2 border border-gray-200">{comps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Performing Pairwise Comparisons</h2>
          <p className="text-nyu-text-secondary mb-4">
            This is the core analytical step of AHP. Use the sliders to compare items using Saaty's 1–9 scale. Dragging the slider to the left (negative values) indicates a preference for the <strong>row</strong> item; dragging to the right (positive values) indicates a preference for the <strong>column</strong> item.
          </p>

          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-left">Position</th>
                  <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-left">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1 (center)', 'Equal importance — both elements contribute equally'],
                  ['3', 'Moderate — one is slightly favored over the other'],
                  ['5', 'Strong — one is strongly favored'],
                  ['7', 'Very strong — one is very strongly favored'],
                  ['9', 'Extreme — the highest possible degree of preference'],
                  ['2, 4, 6, 8', 'Intermediate compromise judgments'],
                ].map(([pos, meaning], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border border-gray-200 font-semibold">{pos}</td>
                    <td className="p-2 border border-gray-200">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Understanding the Consistency Ratio</h3>
          <p className="text-nyu-text-secondary mb-4">
            <strong className="text-green-700">Green (CR ≤ 0.10):</strong> Your comparisons are acceptably consistent.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            <strong className="text-red-700">Red (CR &gt; 0.10):</strong> Your comparisons contain logical contradictions. Review your judgments and look for pairs that seem out of proportion.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            <strong>Tip:</strong> If you are struggling with consistency, try making your comparisons less extreme. Overuse of the endpoints (7, 8, 9) is a common source of inconsistency.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Viewing Results</h2>
          <p className="text-nyu-text-secondary mb-4">
            The Results tab shows your alternatives ranked by their global priority score. Two scoring modes are available: <strong>Normalized</strong> (scores sum to 100%) and <strong>Idealized</strong> (best alternative = 1.0).
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Sensitivity Analysis</h2>
          <p className="text-nyu-text-secondary mb-4">
            Sensitivity analysis answers: "If the criteria weights were different, would my decision change?" Select a criterion to vary and observe how alternative rankings shift as its weight changes from 0% to 100%.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Tips for a Better Analysis</h2>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-2 mb-4">
            <li><strong>Start with a clear goal.</strong> A vague goal leads to vague criteria and unreliable comparisons.</li>
            <li><strong>Keep criteria independent.</strong> Each criterion should measure a distinct dimension of the decision.</li>
            <li><strong>Use the full scale thoughtfully.</strong> Most real-world comparisons land between 1 and 5.</li>
            <li><strong>Think in ratios, not ranks.</strong> A judgment of 3 means A is three times as important as B.</li>
            <li><strong>Check consistency early and often.</strong> Watch the CR as you enter each judgment.</li>
            <li><strong>Save frequently.</strong> Your work is not auto-saved.</li>
            <li><strong>Download a backup.</strong> Before major milestones, download the <code>.AHP</code> file to your local machine.</li>
            <li><strong>Use sensitivity analysis to stress-test.</strong> Before committing to a recommendation, explore whether reasonable changes in weights would change the outcome.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              ['How many alternatives should I include?', 'Include only the alternatives that are genuinely viable and distinct. Three to six alternatives is typical. The maximum is 12.'],
              ['Can I change my criteria after entering comparisons?', 'Yes, but adding or removing criteria or alternatives will invalidate comparisons that referenced them. Finalize your hierarchy before beginning pairwise comparisons.'],
              ['What if I cannot decide between two elements?', 'Set the slider to 1 (Equal). This is a perfectly valid judgment.'],
              ['What does a high Consistency Ratio mean?', 'A CR above 0.10 means your judgments contain logical contradictions. Adjusting one or two judgments is usually enough to bring it below 0.10.'],
              ['What file format does AHP Studio use?', 'Decision problems are saved as .AHP files — JSON-formatted text files with the .AHP extension.'],
              ['I forgot my password. What do I do?', 'Contact your instructor or course administrator. They can reset your password from the User Management page.'],
              ['My account is locked. What happened?', 'Three consecutive failed login attempts will lock your account. Contact your instructor to have it unlocked.'],
            ].map(([q, a], i) => (
              <div key={i} className="border-l-4 border-nyu-violet pl-4">
                <p className="font-semibold text-nyu-text-primary">{q}</p>
                <p className="text-nyu-text-secondary text-sm mt-1">{a}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Getting Help</h2>
          <p className="text-nyu-text-secondary mb-4">
            If you encounter a technical issue or need assistance, please contact:
          </p>
          <p className="text-nyu-text-secondary mb-4">
            <strong>Dr. Jose Mendoza</strong><br />
            New York University<br />
            Email: jose.mendoza@nyu.edu
          </p>

          <p className="text-sm text-nyu-text-secondary mt-8 pt-4 border-t border-gray-200">Copyright 2026 by Dr. Jose Mendoza.</p>
        </div>
    </div>
  );
};

export default HelpPage;
