import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const WhyAHPPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="text-nyu-violet hover:underline text-sm mb-6 inline-block">← Back</button>
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-nyu-text-primary mb-6">Why AHP Still Matters in the Age of Generative AI</h1>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">The Question Every Student Asks</h2>
          <p className="text-nyu-text-secondary mb-4">
            You have access to ChatGPT, Claude, Gemini, and a growing constellation of generative AI tools that can synthesize vast amounts of information, reason across domains, and produce articulate recommendations in seconds. So why are you learning a decision-making methodology that was invented in the 1970s and formalized in a book published before the personal computer revolution?
          </p>
          <p className="text-nyu-text-secondary mb-4">
            It is a fair question. And the answer is not that AHP is a relic to be studied for historical interest. The answer is that generative AI — for all its remarkable capabilities — has fundamental limitations that make structured decision frameworks more important than ever. AHP and generative AI are not competitors. They solve different problems, and the strategist who understands both will make better decisions than someone who relies on either one alone.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">What Generative AI Does Well</h2>
          <p className="text-nyu-text-secondary mb-4">
            There is no point in defending AHP by pretending that generative AI is not powerful. It is. Large language models can process and synthesize enormous volumes of text, research, and data far faster than any human team. They can identify patterns across industries and domains that might take a consultant weeks to uncover. They can generate options, brainstorm alternatives, draft analyses, and simulate different perspectives on a problem.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            But generating information is not the same as making a decision. And this is where the distinction matters.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">The Gap That Generative AI Cannot Close</h2>
          <p className="text-nyu-text-secondary mb-4">
            A strategic decision is not a question with a right answer waiting to be retrieved. It is a commitment of finite resources under uncertainty, shaped by the values, priorities, and risk tolerance of the people making it.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">It Cannot Represent Your Priorities</h3>
          <p className="text-nyu-text-secondary mb-4">
            A large language model does not have preferences. When you ask it to recommend the best market entry strategy, it draws on patterns in its training data — an aggregation of what analysts, textbooks, consultants, and case studies have said in general. AHP exists precisely to solve this problem. It forces the decision-maker to be explicit about every tradeoff and extracts a mathematically rigorous set of priority weights from human judgment.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">It Cannot Guarantee Logical Consistency</h3>
          <p className="text-nyu-text-secondary mb-4">
            One of the most insidious risks in decision-making is invisible inconsistency — holding contradictory beliefs without realizing it. AHP detects this mathematically. The Consistency Ratio quantifies how logically coherent a set of judgments is, and it flags contradictions before they contaminate the analysis. No generative AI tool provides an equivalent mechanism.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">It Produces Opaque Recommendations</h3>
          <p className="text-nyu-text-secondary mb-4">
            When a generative AI recommends Option A over Option B, it typically provides a narrative justification that sounds convincing. But how was the recommendation actually produced? AHP provides complete traceability. Every priority weight can be traced back to a specific pairwise comparison. Sensitivity analysis shows exactly which criteria are pivotal and where the tipping points lie.
          </p>

          <h3 className="text-xl font-semibold text-nyu-text-primary mt-6 mb-3">It Hallucinates</h3>
          <p className="text-nyu-text-secondary mb-4">
            Generative AI models can produce information that is fluent, confident, and wrong. AHP, by contrast, does not generate information. It structures and quantifies the judgments that the decision-maker provides. The inputs are yours. The mathematics is deterministic. There is nothing to hallucinate.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">What AHP Does That AI Cannot</h2>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-2 mb-4">
            <li><strong>Structured decomposition of complexity.</strong> AHP forces you to break a tangled, multi-dimensional problem into a hierarchy of focused comparisons.</li>
            <li><strong>Ratio-scale quantification of subjective judgment.</strong> Saaty's 1–9 scale and the eigenvector method convert qualitative preferences into mathematically precise priority weights.</li>
            <li><strong>Built-in inconsistency detection.</strong> The Consistency Ratio is a mathematical audit of your own thinking.</li>
            <li><strong>Complete transparency and traceability.</strong> Every output can be traced back to a specific input.</li>
            <li><strong>Sensitivity analysis.</strong> AHP allows you to systematically explore how robust your decision is.</li>
            <li><strong>A structured process for group decisions.</strong> AHP provides a disciplined protocol for surfacing disagreements and converging toward consensus.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">The Real Power: AHP and AI Together</h2>
          <p className="text-nyu-text-secondary mb-4">
            The most sophisticated approach to decision-making in 2026 is not AHP versus generative AI — it is AHP <em>with</em> generative AI. The two methods complement each other at every stage:
          </p>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-2 mb-4">
            <li><strong>Problem structuring</strong> — Use AI to research the domain, identify candidate criteria, surface alternatives. Then use AHP to organize these into a disciplined hierarchy.</li>
            <li><strong>Data gathering</strong> — Use AI to pull relevant data and benchmarks that inform your pairwise comparisons.</li>
            <li><strong>Consistency improvement</strong> — When AHP flags an inconsistency, use AI to help think through why two judgments might conflict.</li>
            <li><strong>Communicating results</strong> — Use AI to draft narrative summaries that communicate the AHP findings clearly.</li>
            <li><strong>Validating AI recommendations</strong> — Use AHP as a structured second opinion on AI suggestions.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">The Skill That Endures</h2>
          <p className="text-nyu-text-secondary mb-4">
            Technologies come and go. What will not change is the fundamental challenge of strategic decision-making: how to allocate scarce resources across competing priorities under uncertainty, in a way that is transparent, defensible, and logically consistent.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            AHP teaches you a way of thinking about decisions that transcends any particular tool. It trains you to decompose complexity, to be explicit about tradeoffs, to quantify judgment rigorously, to check your own consistency, and to stress-test your conclusions. These are not skills that become obsolete when a new AI model is released. They are the skills that determine whether you use AI wisely or whether AI uses you.
          </p>
          <p className="text-nyu-text-secondary mb-4">
            The strategist who can do both will always have an advantage over the one who can only do one.
          </p>

          <h2 className="text-2xl font-semibold text-nyu-text-primary mt-8 mb-4">Recommended Reading</h2>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-1 mb-4 text-sm">
            <li>Saaty, T. L. (1980). <em>The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation.</em> New York: McGraw-Hill.</li>
            <li>Saaty, T. L. (2008). Decision making with the analytic hierarchy process. <em>International Journal of Services Sciences</em>, 1(1), 83–98.</li>
            <li>Ishizaka, A., & Labib, A. (2009). Analytic Hierarchy Process and Expert Choice: Benefits and limitations. <em>OR Insight</em>, 22(4), 201–220.</li>
            <li>Lima, E., et al. (2019). Applying machine learning to AHP multicriteria decision making method to assets prioritization in the context of industrial maintenance 4.0. <em>IFAC-PapersOnLine</em>, 52(13), 2590–2595.</li>
            <li>Duarte, A., et al. (2023). Machine learning-driven approach for large scale decision making with the Analytic Hierarchy Process. <em>Mathematics</em>, 11(3), 627.</li>
          </ul>

          <p className="text-sm text-nyu-text-secondary mt-8 pt-4 border-t border-gray-200">Copyright 2026 by Dr. Jose Mendoza.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WhyAHPPage;
