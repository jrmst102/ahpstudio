# AHP Studio — Help

---

## Getting Started

### Logging In

Open AHP Studio in your web browser using the URL provided by your instructor. Enter the username and password that were assigned to you by the course administrator, then click **Sign In**.

If you enter the wrong password three times in a row, your account will be locked automatically. When this happens, you will see a message indicating that the account has been locked. You cannot unlock it yourself — contact your instructor or the course administrator to have it restored.

After logging in, you will land on the **Dashboard**, your home screen for managing decision problems.

### Changing Your Password

After your first login, it is recommended that you change the temporary password assigned by the administrator. Click your username in the top-right corner of the navigation bar and select **Account Settings**. Enter your current password, then your new password twice to confirm. Passwords must be at least eight characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.

---

## Working with Decision Problems

### Creating a New Problem

From the Dashboard, click the **New Problem** button. You will be taken to the Problem Editor, starting at the **Problem Definition** step. Enter a title for your decision (for example, "Best Market Entry Strategy for Southeast Asia"), an optional description providing context, and a goal statement that captures the objective of the analysis (for example, "Select the market entry approach that maximizes long-term competitive advantage").

Click **Save** at any time to preserve your progress.

### Saving Your Work

AHP Studio saves your decision problem as an `.AHP` file stored in the cloud under your account. Click the **Save** button in the editor toolbar to save the current state. You should save frequently, especially after entering pairwise comparisons — your work is not saved automatically.

You can also click **Download** to export the `.AHP` file to your local machine. This is recommended as a backup and is required if you want to submit your analysis as a course deliverable.

### Loading a Saved Problem

From the Dashboard, you will see a list of your previously saved `.AHP` files. Click **Load** next to the problem you want to continue working on. The full problem state — including all criteria, alternatives, comparisons, and results — will be restored exactly as you left it.

You can also upload an `.AHP` file from your local machine by clicking **Upload** and selecting the file. This is useful if you are restoring from a backup or transferring a problem from another device. The file must have the `.AHP` extension and conform to the expected format; otherwise an error will be displayed.

### Deleting a Problem

From the Dashboard, click the **Delete** icon next to the problem you want to remove. A confirmation dialog will appear. Once confirmed, the `.AHP` file is permanently deleted from the cloud and cannot be recovered. If you have a local backup, you can re-upload it later.

---

## Building Your Decision Model

The Problem Editor guides you through a step-by-step workflow using the sidebar navigation on the left side of the screen. You can move between steps in any order, but it is recommended that you follow the sequence: Definition → Criteria → Alternatives → Comparisons → Results → Sensitivity.

### Step 1: Problem Definition

This is where you set the title, description, and goal for your decision. The goal should be phrased as an action-oriented objective — what you are trying to decide or select. Keep it concise. The description field is a good place to capture background context, assumptions, or scope boundaries that frame the analysis.

### Step 2: Criteria

Click **Criteria** in the sidebar to open the Criteria Manager. This is where you define what factors matter in your decision.

**Adding criteria:** Click the **Add Criterion** button. Enter a name (for example, "Cost") and an optional description. Each criterion appears as a node in the hierarchy tree displayed on the page.

**Adding sub-criteria:** Click the expand icon next to any criterion to add sub-criteria beneath it. For example, under "Cost" you might add "Initial Investment" and "Ongoing Operating Costs." Sub-criteria allow you to break a broad factor into more specific dimensions. You can have up to 7 sub-criteria under each criterion.

**Editing and removing:** Click on any criterion or sub-criterion name to edit it. Click the delete icon to remove it. Removing a criterion will also delete all of its sub-criteria and any pairwise comparisons that reference it, so proceed with care.

**Limits:** You can define up to 10 first-level criteria. The hierarchy supports up to three levels: Goal → Criteria → Sub-criteria. Keep the number of criteria manageable — Saaty recommended no more than seven elements per comparison group, as human judgment becomes less reliable when comparing too many items simultaneously.

### Step 3: Alternatives

Click **Alternatives** in the sidebar to open the Alternatives Manager. Alternatives are the options you are evaluating — the choices you are deciding among.

**Adding alternatives:** Click **Add Alternative** and enter a name and optional description. A counter at the top of the page shows how many alternatives you have defined relative to the maximum (for example, "4 / 12 alternatives").

**Editing and removing:** Click on any alternative to edit its name or description. Click the delete icon to remove it. Removing an alternative will delete all pairwise comparisons involving that alternative.

**Limits:** You can define a maximum of 12 alternatives per problem. Keep in mind that each additional alternative increases the number of pairwise comparisons required. With *n* alternatives, you will make *n(n−1)/2* comparisons per criterion. For 12 alternatives, that is 66 comparisons per criterion — so be deliberate about which alternatives you include.

The following table shows how the number of pairwise comparisons grows:

| Alternatives | Comparisons per Criterion |
|---|---|
| 3 | 3 |
| 4 | 6 |
| 5 | 10 |
| 6 | 15 |
| 7 | 21 |
| 8 | 28 |
| 9 | 36 |
| 10 | 45 |
| 11 | 55 |
| 12 | 66 |

---

## Performing Pairwise Comparisons

Click **Comparisons** in the sidebar. This is the core analytical step of AHP — where you express your judgments about relative importance and preference.

### How Comparisons Are Organized

The comparison step is organized into groups, accessible through a breadcrumb trail or dropdown at the top of the page:

**Criteria vs. Criteria** — You compare each pair of criteria with respect to the goal. The question is: "Which criterion is more important for achieving the goal, and by how much?"

**Sub-criteria vs. Sub-criteria** — For each criterion that has sub-criteria, you compare the sub-criteria with respect to their parent. The question is: "With respect to [parent criterion], which sub-criterion is more important?"

**Alternatives vs. Alternatives** — For each lowest-level criterion (either a criterion with no sub-criteria or a sub-criterion), you compare all alternatives. The question is: "With respect to [this criterion], which alternative is preferred, and by how much?"

A progress indicator shows how many comparison groups you have completed and how many remain.

### Using the Comparison Slider

Each pairwise comparison is presented as a question at the top of the screen:

*"With respect to Cost, which is more important: Initial Investment or Ongoing Operating Costs, and by how much?"*

Below the question is a horizontal **slider** that ranges from 9 on the left to 9 on the right, with 1 (Equal) at the center. Dragging the slider to the left indicates that the element on the left is favored; dragging it to the right favors the element on the right. The farther you drag, the stronger the preference.

The verbal labels from Saaty's fundamental scale are displayed above the slider to help you calibrate your judgment:

| Position | Meaning |
|---|---|
| 1 (center) | Equal importance — both elements contribute equally |
| 3 | Moderate — one is slightly favored over the other |
| 5 | Strong — one is strongly favored based on experience and judgment |
| 7 | Very strong — one is very strongly favored with demonstrated dominance |
| 9 | Extreme — the highest possible degree of preference |
| 2, 4, 6, 8 | Intermediate values representing compromise judgments |

After you position the slider, click **Next** to proceed to the following comparison, or click **Previous** to revisit an earlier one. You can also click directly on any cell in the comparison matrix (displayed below the slider) to jump to that specific comparison.

### Reading the Comparison Matrix

As you enter judgments, the full comparison matrix is displayed in a table below the slider. The matrix updates in real time. The diagonal cells always show 1 (each element compared to itself). Values greater than 1 in a cell mean the row element is favored over the column element. Values less than 1 (displayed as fractions) mean the column element is favored.

You can click any cell in the upper triangle of the matrix to edit that comparison directly.

### Understanding the Consistency Ratio

Below the comparison matrix, the **Consistency Ratio (CR)** is displayed prominently. This tells you whether your judgments are logically coherent.

**Green (CR ≤ 0.10):** Your comparisons are acceptably consistent. You may proceed to the next group.

**Red (CR > 0.10):** Your comparisons contain logical contradictions that may undermine the validity of the results. Review your judgments and look for pairs that seem out of proportion with the others. Common causes of inconsistency include circular preferences (A is better than B, B is better than C, but C is better than A) and extreme values (using 9 when a 3 or 5 would be more appropriate).

You are not blocked from continuing when the CR is above 0.10, but you should understand that the resulting priorities may not be reliable. Saaty recommended iterating on the comparisons — adjusting a few judgments at a time — until consistency is achieved.

**Tip:** If you are struggling with consistency, try making your comparisons less extreme. Overuse of the endpoints (7, 8, 9) is a common source of inconsistency. Also, try to keep your judgments transitive: if A is more important than B, and B is more important than C, then A should be more important than C.

---

## Viewing Results

Click **Results** in the sidebar to see the synthesized outcome of your analysis.

### Global Rankings

The main results view shows a **bar chart** with all alternatives ranked by their global priority score. The highest-scoring alternative is the one that best satisfies your criteria based on the judgments you entered.

Two scoring modes are available:

**Normalized** — Scores sum to 1.00 (or 100%). Each alternative's score represents its share of the total priority. For example, a score of 0.42 means that alternative accounts for 42% of the total priority.

**Idealized** — The top-ranked alternative is set to a score of 1.00, and all others are expressed as proportions of the best. This makes it easy to see how close runners-up are to the leader.

### Ranking Table

Below the chart, a table presents the full numerical results: rank, alternative name, normalized score, and idealized score. You can sort the table by any column.

### Criterion Breakdown

A **breakdown view** shows how each alternative performs on each individual criterion. This helps you understand why the top alternative ranked first — is it dominant across all criteria, or is it strong in one area and just acceptable in others?

---

## Sensitivity Analysis

Click **Sensitivity** in the sidebar to explore the robustness of your results. Sensitivity analysis answers the question: "If the criteria weights were different, would my decision change?"

### Performance View

This view displays a grouped bar chart with each alternative's performance shown across every criterion and overall. It gives you a comprehensive snapshot — you can immediately see which alternative leads on which criteria and where there are close contests.

### Dynamic View

This is the most interactive mode. Horizontal bars on the left represent the current criteria weights. On the right, the resulting alternative priorities are shown. **Drag any criteria bar** to increase or decrease its weight — the other criteria will rebalance proportionally, and the alternative rankings will update instantly.

Use this view to ask "what if" questions: What if cost mattered twice as much? What if we cared less about speed? Watch how the alternative bars shift as you experiment.

### Gradient View

Select a single criterion from the dropdown. The chart shows a set of lines — one per alternative — plotting how each alternative's global score changes as the selected criterion's weight varies from 0% to 100%. A vertical dashed line marks the current weight.

Look for **crossing points** — places where one line overtakes another. These are the tipping points where a change in criteria weight would reverse the ranking. If the crossing point is far from the current weight, the ranking is robust. If it is close, the decision is sensitive to that criterion and warrants careful reflection.

### Head-to-Head View

Select two alternatives from the dropdowns. A side-by-side comparison shows which criteria favor each alternative and by how much. This is useful when the top two alternatives are very close and you want to understand exactly where they differ.

---

## Tips for a Better Analysis

**Start with a clear goal.** A vague goal leads to vague criteria and unreliable comparisons. Make the goal specific enough that someone else could understand exactly what you are trying to decide.

**Keep criteria independent.** Each criterion should measure a distinct dimension of the decision. If two criteria overlap substantially (for example, "Cost" and "Budget Impact"), they will double-count that factor and distort the results. If related factors matter, group them as sub-criteria under a single parent.

**Use the full scale thoughtfully.** The 1–9 scale gives you a wide range, but most real-world comparisons land between 1 and 5. Reserve 7 and 9 for cases where the dominance is genuinely dramatic. Overusing extreme values inflates inconsistency.

**Think in ratios, not ranks.** AHP asks "how many times more important is A than B?" not "which is first and which is second?" A judgment of 3 means A is three times as important as B — make sure that ratio feels right.

**Check consistency early and often.** Do not wait until all comparisons are complete to look at the CR. AHP Studio shows it in real time — watch it as you enter each judgment. If it spikes, revisit the most recent comparison.

**Save frequently.** Click Save after completing each comparison group. Your work is not auto-saved, and a browser crash or accidental navigation will lose unsaved progress.

**Download a backup.** Before major milestones (finishing all comparisons, before making changes to the hierarchy), download the `.AHP` file to your local machine. This protects you against accidental deletion.

**Use sensitivity analysis to stress-test.** The first-ranked alternative is only as good as your assumptions about criteria weights. Before committing to a recommendation, use the Dynamic and Gradient views to explore whether reasonable changes in weights would change the outcome. A decision that survives sensitivity analysis is far more defensible.

---

## Frequently Asked Questions

**How many alternatives should I include?**
Include only the alternatives that are genuinely viable and distinct. Three to six alternatives is typical for most academic exercises. The maximum is 12, but more alternatives means more comparisons and more opportunities for inconsistency. Quality of analysis matters more than quantity of options.

**Can I change my criteria or alternatives after entering comparisons?**
Yes, but be aware that adding or removing criteria or alternatives will invalidate any comparisons that referenced them. Those comparisons will be deleted, and you will need to redo them. It is best to finalize your hierarchy structure before beginning pairwise comparisons.

**What if I cannot decide between two elements?**
Set the slider to 1 (Equal). This is a perfectly valid judgment — it means both elements contribute equally with respect to the parent criterion. You are not required to differentiate every pair.

**What does a high Consistency Ratio mean?**
A CR above 0.10 means your judgments contain logical contradictions. This does not mean your analysis is wrong — it means some of your comparisons are not fully compatible with each other. Review the comparison matrix and look for values that seem disproportionate. Adjusting one or two judgments is usually enough to bring the CR below 0.10.

**Can I work on more than one problem at a time?**
AHP Studio supports one active problem at a time. To switch between problems, save your current work, return to the Dashboard, and load a different `.AHP` file. Your saved files remain available until you delete them.

**What file format does AHP Studio use?**
Decision problems are saved as `.AHP` files. These are JSON-formatted text files with the `.AHP` extension. They contain the full problem definition, hierarchy, all comparisons, and computed results. You can open them in any text editor if needed, though editing them manually is not recommended.

**Can I share my `.AHP` file with a classmate?**
Yes. Download the file to your machine and send it to them. They can upload it to their own account using the Upload feature on the Dashboard. Each user's files are stored independently — uploading a shared file creates a separate copy under the receiving user's account.

**I forgot my password. What do I do?**
Contact your instructor or course administrator. They can reset your password from the User Management page. There is no self-service password recovery.

**My account is locked. What happened?**
Three consecutive failed login attempts will lock your account as a security measure. Contact your instructor or course administrator to have it unlocked.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + S` (or `Cmd + S` on Mac) | Save the current problem |
| `Ctrl + Z` (or `Cmd + Z`) | Undo the last comparison entry |
| `←` / `→` Arrow Keys | Adjust the comparison slider by one increment |
| `Enter` | Confirm the current comparison and advance to the next |
| `Tab` | Move to the next input field |
| `Esc` | Close any open dialog or modal |

---

## Getting Help

If you encounter a technical issue, an unexpected error, or need assistance with your analysis, please contact:

**Dr. Jose Mendoza**  
New York University  
Email: jose.mendoza@nyu.edu

When reporting a problem, please include a description of what you were doing when the issue occurred, the text of any error message displayed, and your browser name and version. If possible, download and attach your current `.AHP` file so the issue can be reproduced.

---

**Copyright 2026 by Dr. Jose Mendoza.**
