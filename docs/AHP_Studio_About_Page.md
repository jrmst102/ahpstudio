# About AHP Studio

---

## What is AHP Studio?

AHP Studio is a web-based decision support tool that implements the Analytic Hierarchy Process (AHP), one of the most widely used methodologies for structured, multi-criteria decision-making. The application guides users through every stage of an AHP analysis — from defining a decision goal and structuring criteria hierarchies, to performing pairwise comparisons, computing priority weights, checking judgment consistency, and synthesizing final rankings across alternatives. Interactive sensitivity analysis tools allow users to explore how changes in criteria weights affect the outcome, building deeper intuition about the decision at hand.

AHP Studio was built for the graduate-level Competitive Strategy course at New York University. It gives students a hands-on environment to learn and apply AHP to real strategic problems — site selection, vendor evaluation, market entry, technology adoption, resource allocation, and beyond — without requiring expensive commercial software licenses.

---

## The Analytic Hierarchy Process

The Analytic Hierarchy Process was developed by **Dr. Thomas L. Saaty** (1926–2017), a Distinguished University Professor at the University of Pittsburgh and member of the National Academy of Engineering. Dr. Saaty first published the mathematical foundations of AHP in 1977 in the *Journal of Mathematical Psychology* and expanded the theory in his landmark 1980 book, *The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation* (McGraw-Hill).

AHP addresses a fundamental challenge in decision-making: how to compare options that involve multiple, often conflicting criteria — some quantitative, some qualitative — and arrive at a defensible, transparent ranking. The method works by decomposing a complex decision into a hierarchy of simpler sub-problems, then using pairwise comparisons on Saaty's 1–9 fundamental scale to quantify the relative importance of each element. Priorities are derived mathematically through eigenvector computation, and a built-in consistency check ensures that judgments are logically coherent.

Since its introduction, AHP has been applied across virtually every domain: corporate strategy, government policy, healthcare, engineering, environmental management, defense, and sports analytics. The methodology has been cited over 200,000 times in the academic literature and has been taught at hundreds of universities worldwide. AHP Studio draws conceptual inspiration from Expert Choice, the pioneering commercial AHP software created by Saaty and Ernest Forman in 1983.

---

## Key Features

**Structured Problem Definition** — Define your decision goal, organize criteria and sub-criteria into a clear hierarchy, and specify up to 12 alternatives for evaluation.

**Pairwise Comparisons** — Compare elements using an intuitive slider interface based on Saaty's fundamental scale, with real-time matrix updates and verbal interpretation labels ranging from "Equal Importance" to "Extreme Importance."

**Consistency Checking** — Every comparison matrix is evaluated automatically. The Consistency Ratio is displayed in real time with color-coded feedback — green for acceptable judgments (CR ≤ 0.10) and red when revisions are recommended.

**Priority Synthesis** — Local priorities are combined across the full hierarchy to produce global rankings of alternatives, displayed as both normalized scores (summing to 100%) and idealized scores (best alternative = 1.0).

**Sensitivity Analysis** — Four interactive visualization modes let you explore the robustness of your decision: Performance analysis, Dynamic weight adjustment, Gradient analysis for individual criteria, and Head-to-head alternative comparison.

**Save and Load** — Decision problems are saved as `.AHP` files to the cloud and can be downloaded locally for backup or sharing. Previously saved problems can be reloaded at any time.

---

## Technology

AHP Studio is an open-source application released under the MIT License. The source code is hosted on GitHub. The application is built with React on the frontend and Node.js on the backend, deployed on DigitalOcean cloud infrastructure with PostgreSQL for account management and DigitalOcean Spaces for file storage. The complete technical specifications are available in the project repository.

---

## Academic Attribution

AHP Studio implements the methodology created by Dr. Thomas L. Saaty. If you publish or present results obtained using this tool, please cite the foundational work:

> Saaty, T. L. (1980). *The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation.* New York: McGraw-Hill.

> Saaty, T. L. (1977). A scaling method for priorities in hierarchical structures. *Journal of Mathematical Psychology*, 15(3), 234–281.

---

## About the Author

**Dr. Jose Mendoza** is a faculty member at New York University, where he teaches graduate-level courses in Competitive Strategy. AHP Studio was developed as an educational tool to give students practical, hands-on experience with structured decision-making methodologies used in industry, government, and consulting.

For questions, feedback, or collaboration inquiries, please contact:

**Dr. Jose Mendoza**  
New York University  
Email: jose.mendoza@nyu.edu

---

## License

AHP Studio is free and open-source software released under the **MIT License**. You are free to use, modify, and distribute the Software, provided that the original copyright notice and license text are retained. See the Terms and Conditions for full details.

---

**Copyright 2026 by Dr. Jose Mendoza.**
