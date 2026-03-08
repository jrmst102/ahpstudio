import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="text-nyu-violet hover:underline text-sm mb-6 inline-block">← Back</button>
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-nyu-text-primary mb-6">About AHP Studio</h1>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">What is AHP Studio?</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is a web-based decision support tool that implements the Analytic Hierarchy Process (AHP), one of the most widely used methodologies for structured, multi-criteria decision-making. The application guides users through every stage of an AHP analysis — from defining a decision goal and structuring criteria hierarchies, to performing pairwise comparisons, computing priority weights, checking judgment consistency, and synthesizing final rankings across alternatives. Interactive sensitivity analysis tools allow users to explore how changes in criteria weights affect the outcome, building deeper intuition about the decision at hand.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio was built for the graduate-level Competitive Strategy course at New York University. It gives students a hands-on environment to learn and apply AHP to real strategic problems — site selection, vendor evaluation, market entry, technology adoption, resource allocation, and beyond — without requiring expensive commercial software licenses.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">The Analytic Hierarchy Process</h2>
          <p className="text-nyu-text-secondary mb-4">
            The Analytic Hierarchy Process was developed by <strong>Dr. Thomas L. Saaty</strong> (1926–2017), a Distinguished University Professor at the University of Pittsburgh and member of the National Academy of Engineering. Dr. Saaty first published the mathematical foundations of AHP in 1977 in the <em>Journal of Mathematical Psychology</em> and expanded the theory in his landmark 1980 book, <em>The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation</em> (McGraw-Hill).
          </p>
          <p className="text-nyu-text-secondary mb-4">
            AHP addresses a fundamental challenge in decision-making: how to compare options that involve multiple, often conflicting criteria — some quantitative, some qualitative — and arrive at a defensible, transparent ranking. The method works by decomposing a complex decision into a hierarchy of simpler sub-problems, then using pairwise comparisons on Saaty's 1–9 fundamental scale to quantify the relative importance of each element. Priorities are derived mathematically through eigenvector computation, and a built-in consistency check ensures that judgments are logically coherent.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            Since its introduction, AHP has been applied across virtually every domain: corporate strategy, government policy, healthcare, engineering, environmental management, defense, and sports analytics. The methodology has been cited over 200,000 times in the academic literature and has been taught at hundreds of universities worldwide. AHP Studio draws conceptual inspiration from Expert Choice, the pioneering commercial AHP software created by Saaty and Ernest Forman in 1983.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Key Features</h2>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-2 mb-4">
            <li><strong>Structured Problem Definition</strong> — Define your decision goal, organize criteria and sub-criteria into a clear hierarchy, and specify up to 12 alternatives for evaluation.</li>
            <li><strong>Pairwise Comparisons</strong> — Compare elements using an intuitive slider interface based on Saaty's fundamental scale, with real-time matrix updates and verbal interpretation labels ranging from "Equal Importance" to "Extreme Importance."</li>
            <li><strong>Consistency Checking</strong> — Every comparison matrix is evaluated automatically. The Consistency Ratio is displayed in real time with color-coded feedback — green for acceptable judgments (CR ≤ 0.10) and red when revisions are recommended.</li>
            <li><strong>Priority Synthesis</strong> — Local priorities are combined across the full hierarchy to produce global rankings of alternatives, displayed as both normalized scores (summing to 100%) and idealized scores (best alternative = 1.0).</li>
            <li><strong>Sensitivity Analysis</strong> — Four interactive visualization modes let you explore the robustness of your decision: Performance analysis, Dynamic weight adjustment, Gradient analysis for individual criteria, and Head-to-head alternative comparison.</li>
            <li><strong>Save and Load</strong> — Decision problems are saved as <code>.AHP</code> files to the cloud and can be downloaded locally for backup or sharing. Previously saved problems can be reloaded at any time.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Technology</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is an open-source application released under the MIT License. The source code is hosted on GitHub. The application is built with React on the frontend and Node.js on the backend, deployed on DigitalOcean cloud infrastructure with PostgreSQL for account management and DigitalOcean Spaces for file storage. The complete technical specifications are available in the project repository.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Academic Attribution</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio implements the methodology created by Dr. Thomas L. Saaty. If you publish or present results obtained using this tool, please cite the foundational work:
          </p>
          <blockquote className="border-l-4 border-nyu-violet pl-4 italic text-nyu-text-secondary mb-4">
            Saaty, T. L. (1980). <em>The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation.</em> New York: McGraw-Hill.
          </blockquote>

          <p className="text-sm text-nyu-text-secondary mt-8 pt-4 border-t border-gray-200">Copyright 2026 by Dr. Jose Mendoza.</p>
        </div>
    </div>
  );
};

export default AboutPage;
