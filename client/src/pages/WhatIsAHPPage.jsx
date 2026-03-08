import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const WhatIsAHPPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="text-nyu-violet hover:underline text-sm mb-6 inline-block">← Back</button>
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-nyu-text-primary mb-6">What is AHP?</h1>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">The Challenge of Complex Decisions</h2>
          <p className="text-nyu-text-secondary mb-4">
            Every day, leaders face decisions that involve multiple objectives pulling in different directions. A company evaluating potential acquisition targets must weigh financial performance against cultural fit, market position against integration risk, and short-term cost against long-term strategic value — all at the same time. A hospital selecting a new electronic health records system must balance functionality, vendor reliability, implementation cost, staff training burden, and regulatory compliance. A government agency choosing among infrastructure projects must consider economic impact, environmental consequences, public safety, political feasibility, and budget constraints.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            These are not problems that can be solved by optimizing a single number. They require a method that can handle multiple criteria, accommodate both quantitative data and qualitative judgment, maintain logical consistency, and produce a transparent, defensible ranking of alternatives.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            The Analytic Hierarchy Process — AHP — is that method.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Origins of AHP</h2>
          <p className="text-nyu-text-secondary mb-4">
            The Analytic Hierarchy Process was developed in the 1970s by <strong>Dr. Thomas L. Saaty</strong> (1926–2017), a mathematician and professor who held positions at the Wharton School of the University of Pennsylvania and later at the University of Pittsburgh's Joseph M. Katz Graduate School of Business, where he served as Distinguished University Professor. Dr. Saaty was elected to the National Academy of Engineering and received the Gold Medal from the International Society on Multi-Criteria Decision Making for his contributions to the field.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            Saaty first presented the mathematical foundations of AHP in a 1977 paper in the <em>Journal of Mathematical Psychology</em>, titled "A Scaling Method for Priorities in Hierarchical Structures." He expanded the theory comprehensively in his 1980 book, <em>The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation</em>, published by McGraw-Hill. These works established AHP as a rigorous, practical framework grounded in linear algebra and psychophysics — specifically, the idea that human beings can make reliable ratio-scale judgments when comparing two elements at a time.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            Since its introduction, AHP has become one of the most widely cited and applied decision-making methodologies in the world, with applications spanning corporate strategy, defense, healthcare, engineering, environmental policy, transportation, education, and sports.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">How AHP Works</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP breaks a complex decision into four fundamental steps.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Step 1: Structure the Decision as a Hierarchy</h3>
          <p className="text-nyu-text-secondary mb-4">
            The first step is to decompose the problem into a hierarchy with three or more levels. At the top sits the <strong>goal</strong> — the overall objective of the decision. The middle level contains the <strong>criteria</strong> (and, optionally, sub-criteria) that define what matters in reaching that goal. The bottom level lists the <strong>alternatives</strong> — the options being evaluated.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Step 2: Make Pairwise Comparisons</h3>
          <p className="text-nyu-text-secondary mb-4">
            The core of AHP is the <strong>pairwise comparison</strong> — comparing two elements at a time and expressing a judgment about their relative importance or preference. Instead of attempting to assign absolute scores to criteria or alternatives (which is psychologically difficult and often unreliable), AHP asks simpler questions like: <em>"With respect to the goal, which is more important — Cost or Risk — and by how much?"</em>
          </p>
          <p className="text-nyu-text-secondary mb-4">
            Judgments are expressed on <strong>Saaty's Fundamental Scale</strong>, a 1-to-9 ratio scale:
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-left">Intensity</th>
                  <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-left">Verbal Meaning</th>
                  <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-left">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1', 'Equal importance', 'The two elements contribute equally'],
                  ['3', 'Moderate importance', 'Experience and judgment slightly favor one over the other'],
                  ['5', 'Strong importance', 'Experience and judgment strongly favor one over the other'],
                  ['7', 'Very strong importance', 'One element is very strongly favored; dominance is demonstrated in practice'],
                  ['9', 'Extreme importance', 'The highest possible order of affirmation of one element over another'],
                  ['2, 4, 6, 8', 'Intermediate values', 'Compromise judgments between the above'],
                ].map(([intensity, meaning, explanation], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border border-gray-200 font-semibold">{intensity}</td>
                    <td className="p-2 border border-gray-200">{meaning}</td>
                    <td className="p-2 border border-gray-200">{explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Step 3: Compute Priorities and Check Consistency</h3>
          <p className="text-nyu-text-secondary mb-4">
            From each comparison matrix, AHP derives a <strong>priority vector</strong> — a set of numerical weights that represent the relative importance of the compared elements. The mathematically rigorous method for doing this is to compute the <strong>principal eigenvector</strong> of the comparison matrix and normalize it so its components sum to 1.0.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            <strong>Consistency checking</strong> is one of the most valuable features of AHP. Because judgments are made in pairs, redundant information exists in the matrix — and this redundancy allows the method to detect logical contradictions. Saaty defined the <strong>Consistency Ratio (CR)</strong> as the ratio of the Consistency Index to the Random Consistency Index. A <strong>CR of 0.10 or less</strong> is generally considered acceptable.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">Step 4: Synthesize the Results</h3>
          <p className="text-nyu-text-secondary mb-4">
            The final step is <strong>synthesis</strong> — combining all the local priority vectors across the hierarchy to produce a global ranking of alternatives. Each alternative's local priority under each criterion is multiplied by that criterion's global weight, and the products are summed across all criteria to produce the alternative's overall score.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Sensitivity Analysis</h2>
          <p className="text-nyu-text-secondary mb-4">
            A good decision is not just about finding the top-ranked alternative — it is about understanding how robust that ranking is. <strong>Sensitivity analysis</strong> explores what happens to the final ranking when the criteria weights change.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio provides interactive visualization modes that let you explore the robustness of your decision: Dynamic weight adjustment, Gradient analysis for individual criteria, and Head-to-head alternative comparison.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Why AHP Matters in Competitive Strategy</h2>
          <p className="text-nyu-text-secondary mb-4">
            Strategic decisions are inherently multi-criteria. Choosing where to compete, how to enter a market, which capabilities to build, which partnerships to pursue, or how to allocate scarce resources — all of these involve tradeoffs among objectives that cannot be reduced to a single financial metric.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            AHP provides a disciplined structure for these decisions. It forces decision-makers to be explicit about what criteria matter, to quantify their judgments rather than relying on vague intuition, and to surface inconsistencies that might otherwise go unnoticed. As Saaty emphasized throughout his career, AHP is not a replacement for human judgment — it is a framework for making that judgment more rigorous, more transparent, and more reliable.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Recommended Reading</h2>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-1 mb-4 text-sm">
            <li>Saaty, T. L. (1977). A scaling method for priorities in hierarchical structures. <em>Journal of Mathematical Psychology</em>, 15(3), 234–281.</li>
            <li>Saaty, T. L. (1980). <em>The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation.</em> New York: McGraw-Hill.</li>
            <li>Saaty, T. L. (1990). How to make a decision: The Analytic Hierarchy Process. <em>European Journal of Operational Research</em>, 48(1), 9–26.</li>
            <li>Saaty, T. L. (2008). Decision making with the analytic hierarchy process. <em>International Journal of Services Sciences</em>, 1(1), 83–98.</li>
            <li>Ishizaka, A., & Labib, A. (2009). Analytic Hierarchy Process and Expert Choice: Benefits and limitations. <em>OR Insight</em>, 22(4), 201–220.</li>
            <li>Mu, E., & Pereyra-Rojas, M. (2017). <em>Practical Decision Making: An Introduction to the Analytic Hierarchy Process Using Super Decisions.</em> Springer.</li>
          </ul>

          <p className="text-sm text-nyu-text-secondary mt-8 pt-4 border-t border-gray-200">Copyright 2026 by Dr. Jose Mendoza.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WhatIsAHPPage;
