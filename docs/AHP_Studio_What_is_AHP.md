# What is AHP?

---

## The Challenge of Complex Decisions

Every day, leaders face decisions that involve multiple objectives pulling in different directions. A company evaluating potential acquisition targets must weigh financial performance against cultural fit, market position against integration risk, and short-term cost against long-term strategic value — all at the same time. A hospital selecting a new electronic health records system must balance functionality, vendor reliability, implementation cost, staff training burden, and regulatory compliance. A government agency choosing among infrastructure projects must consider economic impact, environmental consequences, public safety, political feasibility, and budget constraints.

These are not problems that can be solved by optimizing a single number. They require a method that can handle multiple criteria, accommodate both quantitative data and qualitative judgment, maintain logical consistency, and produce a transparent, defensible ranking of alternatives.

The Analytic Hierarchy Process — AHP — is that method.

---

## Origins of AHP

The Analytic Hierarchy Process was developed in the 1970s by **Dr. Thomas L. Saaty** (1926–2017), a mathematician and professor who held positions at the Wharton School of the University of Pennsylvania and later at the University of Pittsburgh's Joseph M. Katz Graduate School of Business, where he served as Distinguished University Professor. Dr. Saaty was elected to the National Academy of Engineering and received the Gold Medal from the International Society on Multi-Criteria Decision Making for his contributions to the field.

Saaty first presented the mathematical foundations of AHP in a 1977 paper in the *Journal of Mathematical Psychology*, titled "A Scaling Method for Priorities in Hierarchical Structures." He expanded the theory comprehensively in his 1980 book, *The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation*, published by McGraw-Hill. These works established AHP as a rigorous, practical framework grounded in linear algebra and psychophysics — specifically, the idea that human beings can make reliable ratio-scale judgments when comparing two elements at a time.

Since its introduction, AHP has become one of the most widely cited and applied decision-making methodologies in the world, with applications spanning corporate strategy, defense, healthcare, engineering, environmental policy, transportation, education, and sports.

---

## How AHP Works

AHP breaks a complex decision into four fundamental steps.

### Step 1: Structure the Decision as a Hierarchy

The first step is to decompose the problem into a hierarchy with three or more levels. At the top sits the **goal** — the overall objective of the decision. The middle level contains the **criteria** (and, optionally, sub-criteria) that define what matters in reaching that goal. The bottom level lists the **alternatives** — the options being evaluated.

For example, a company choosing a new market entry strategy might structure the hierarchy as follows:

```
                    ┌─────────────────────────┐
        Goal:       │  Select the Best Market  │
                    │     Entry Strategy        │
                    └────────┬────────┬────────┘
                             │        │
               ┌─────────────┘        └─────────────┐
               │                                     │
        ┌──────┴──────┐  ┌──────────┐  ┌────────────┴───┐
        │    Cost      │  │   Risk   │  │  Speed to      │
        │              │  │          │  │  Market         │
        └──────┬───────┘  └────┬─────┘  └───────┬────────┘
               │               │                │
     ┌─────────┼─────────┐    ...              ...
     │         │         │
  ┌──┴───┐ ┌──┴───┐ ┌───┴────┐
  │Joint  │ │Wholly│ │Licensing│
  │Venture│ │Owned │ │Agreement│
  └───────┘ └──────┘ └────────┘
```

This hierarchical decomposition is powerful because it transforms a tangled, overwhelming problem into a set of smaller, more manageable comparisons. Instead of asking "Which strategy is best?" all at once, AHP asks a series of focused questions: "Which criterion matters more?" and "Which alternative performs better on this specific criterion?"

### Step 2: Make Pairwise Comparisons

The core of AHP is the **pairwise comparison** — comparing two elements at a time and expressing a judgment about their relative importance or preference. Instead of attempting to assign absolute scores to criteria or alternatives (which is psychologically difficult and often unreliable), AHP asks simpler questions:

*"With respect to the goal, which is more important — Cost or Risk — and by how much?"*

*"With respect to Cost, which alternative is preferred — Joint Venture or Wholly Owned Subsidiary — and by how much?"*

Judgments are expressed on **Saaty's Fundamental Scale**, a 1-to-9 ratio scale:

| Intensity | Verbal Meaning | Explanation |
|-----------|---------------|-------------|
| **1** | Equal importance | The two elements contribute equally |
| **2** | Weak | |
| **3** | Moderate importance | Experience and judgment slightly favor one over the other |
| **4** | Moderate plus | |
| **5** | Strong importance | Experience and judgment strongly favor one over the other |
| **6** | Strong plus | |
| **7** | Very strong importance | One element is very strongly favored; dominance is demonstrated in practice |
| **8** | Very, very strong | |
| **9** | Extreme importance | The highest possible order of affirmation of one element over another |

If element A is judged to be 5 times as important as element B, then B is automatically 1/5 as important as A. This reciprocal property is a logical requirement of the method and is enforced automatically.

Comparisons are recorded in a **pairwise comparison matrix**. For example, if a decision has three criteria — Cost, Risk, and Speed — and the decision-maker judges Cost to be moderately more important than Risk (value of 3), Cost to be strongly more important than Speed (value of 5), and Risk to be moderately more important than Speed (value of 3), the comparison matrix looks like this:

|  | Cost | Risk | Speed |
|---|------|------|-------|
| **Cost** | 1 | 3 | 5 |
| **Risk** | 1/3 | 1 | 3 |
| **Speed** | 1/5 | 1/3 | 1 |

Notice that the diagonal is always 1 (every element is equally important to itself) and the lower triangle contains the reciprocals of the upper triangle.

### Step 3: Compute Priorities and Check Consistency

From each comparison matrix, AHP derives a **priority vector** — a set of numerical weights that represent the relative importance of the compared elements. The mathematically rigorous method for doing this, as specified by Saaty, is to compute the **principal eigenvector** of the comparison matrix (the eigenvector corresponding to the largest eigenvalue, λ_max) and normalize it so its components sum to 1.0.

For the example above, the resulting priority vector is approximately:

| Criterion | Priority Weight |
|-----------|----------------|
| Cost | 0.637 |
| Risk | 0.258 |
| Speed | 0.105 |

This tells us that Cost accounts for about 63.7% of the overall importance, Risk for 25.8%, and Speed for 10.5%.

**Consistency checking** is one of the most valuable features of AHP. Because judgments are made in pairs, redundant information exists in the matrix — and this redundancy allows the method to detect logical contradictions. If you say A is more important than B, and B is more important than C, but then say C is more important than A, your judgments are inconsistent.

Saaty defined the **Consistency Index (CI)** as:

```
CI = (λ_max − n) / (n − 1)
```

where *n* is the number of elements being compared and λ_max is the largest eigenvalue of the comparison matrix. For a perfectly consistent matrix, λ_max equals *n* exactly, so CI equals zero.

To interpret the CI, Saaty compared it to the consistency index of a randomly generated matrix of the same size, called the **Random Consistency Index (RI)**. The ratio of CI to RI is the **Consistency Ratio (CR)**:

```
CR = CI / RI
```

Saaty's standard RI values, derived from large simulations of random reciprocal matrices, are:

| Matrix Size (n) | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|
| **RI** | 0.58 | 0.90 | 1.12 | 1.24 | 1.32 | 1.41 | 1.45 | 1.49 | 1.51 | 1.48 |

A **CR of 0.10 or less** is generally considered acceptable — it indicates that the judgments are sufficiently consistent to be reliable. A CR greater than 0.10 signals that the comparisons contain logical contradictions and should be revisited. AHP Studio displays the CR in real time as comparisons are entered, highlighting acceptable consistency in green and problematic inconsistency in red.

### Step 4: Synthesize the Results

The final step is **synthesis** — combining all the local priority vectors across the hierarchy to produce a global ranking of alternatives.

The process works from the top down. First, the criteria weights (derived from comparing criteria with respect to the goal) are established. Then, for each criterion (or sub-criterion at the lowest level), the alternatives are compared and local priority vectors are obtained. Finally, each alternative's local priority under each criterion is multiplied by that criterion's global weight, and the products are summed across all criteria to produce the alternative's overall score.

For example, if the criteria weights are Cost = 0.637, Risk = 0.258, Speed = 0.105, and the local alternative priorities under each criterion are:

| Alternative | Cost | Risk | Speed |
|---|---|---|---|
| Joint Venture | 0.540 | 0.600 | 0.300 |
| Wholly Owned | 0.163 | 0.200 | 0.600 |
| Licensing | 0.297 | 0.200 | 0.100 |

Then the global priorities are:

| Alternative | Calculation | Global Score |
|---|---|---|
| **Joint Venture** | (0.540 × 0.637) + (0.600 × 0.258) + (0.300 × 0.105) | **0.530** |
| **Wholly Owned** | (0.163 × 0.637) + (0.200 × 0.258) + (0.600 × 0.105) | **0.218** |
| **Licensing** | (0.297 × 0.637) + (0.200 × 0.258) + (0.100 × 0.105) | **0.252** |

Joint Venture emerges as the preferred alternative with a global priority of 0.530, followed by Licensing at 0.252 and Wholly Owned at 0.218.

---

## Sensitivity Analysis

A good decision is not just about finding the top-ranked alternative — it is about understanding how robust that ranking is. **Sensitivity analysis** explores what happens to the final ranking when the criteria weights change.

AHP Studio provides four modes of sensitivity analysis:

**Performance Analysis** shows how each alternative performs across every criterion and overall, making it easy to spot strengths and weaknesses at a glance.

**Dynamic Analysis** lets you drag criteria weight bars and immediately see how alternative rankings shift in response, revealing which criteria are pivotal to the outcome.

**Gradient Analysis** takes a single criterion and traces how all alternative scores change as that criterion's weight moves from 0% to 100%, with all other criteria rebalancing proportionally. This reveals tipping points — the exact weight at which one alternative overtakes another.

**Head-to-Head Analysis** compares two alternatives side by side, showing on which criteria each one has the advantage and by how much.

Sensitivity analysis transforms AHP from a one-shot ranking into an exploratory tool for strategic thinking. It helps answer questions like: "How much would risk have to matter before we would change our choice?" or "Is our top alternative dominant, or is it only slightly ahead?"

---

## Why AHP Matters in Competitive Strategy

Strategic decisions are inherently multi-criteria. Choosing where to compete, how to enter a market, which capabilities to build, which partnerships to pursue, or how to allocate scarce resources — all of these involve tradeoffs among objectives that cannot be reduced to a single financial metric.

AHP provides a disciplined structure for these decisions. It forces decision-makers to be explicit about what criteria matter, to quantify their judgments rather than relying on vague intuition, and to surface inconsistencies that might otherwise go unnoticed. The transparency of the process also makes it valuable for group decisions and stakeholder communication — every assumption is visible, every judgment is recorded, and every result can be traced back to its inputs.

As Saaty emphasized throughout his career, AHP is not a replacement for human judgment — it is a framework for making that judgment more rigorous, more transparent, and more reliable.

---

## Recommended Reading

Saaty, T. L. (1977). A scaling method for priorities in hierarchical structures. *Journal of Mathematical Psychology*, 15(3), 234–281.

Saaty, T. L. (1980). *The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation.* New York: McGraw-Hill.

Saaty, T. L. (1990). How to make a decision: The Analytic Hierarchy Process. *European Journal of Operational Research*, 48(1), 9–26.

Saaty, T. L. (2008). Decision making with the analytic hierarchy process. *International Journal of Services Sciences*, 1(1), 83–98.

Ishizaka, A., & Labib, A. (2009). Analytic Hierarchy Process and Expert Choice: Benefits and limitations. *OR Insight*, 22(4), 201–220.

Mu, E., & Pereyra-Rojas, M. (2017). *Practical Decision Making: An Introduction to the Analytic Hierarchy Process Using Super Decisions.* Springer.

---

**Copyright 2026 by Dr. Jose Mendoza.**
