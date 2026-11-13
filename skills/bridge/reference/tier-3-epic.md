# T3: epic / workflow design (Elephant-Goldfish)

Use for multi-capability architecture, new subsystems, large workflow design, or high ambiguity across teams or modules. Epic id: kebab-case (`order-pipeline-v2`).

## Roles
- **Elephant** = this session. Holds the long context with the human. **No-Code rule:** no production code during T3.
- **Goldfish** = fresh `bridge-goldfish` subagents. They get only a role file, the design doc path, referenced source paths and an output path. Never the conversation or the elephant log.
- **Human** makes the trade-off calls and gives the final approval.

## Steps
1. Recon: dispatch `bridge-explorer` (one or several in parallel, by area) for a current-state map. Do not bulk-read code yourself.
2. Read `../vendor/egm/elephant.md` and follow it: brainstorm, keep `.bridge/epics/<epic>/elephant.md`, draft `docs/designs/<epic>.md` including the **Change decomposition** section.
3. Read `../vendor/egm/goldfish-protocol.md` and run the review loop: comprehension first, then the critic roles in parallel, then implementation-readiness, then the synthesizer. Role files are in `../vendor/egm/roles/`. Resolve the findings in the elephant log. At most 3 rounds, then ask the human.
4. Human approval gate: show a summary of the doc, the goldfish verdicts and any open risks. Commit `docs/designs/<epic>.md`.
5. Decompose: for each change in the decomposition, in dependency order, run the T2 pipeline (`tier-2-requirement.md`). Each proposal links `docs/designs/<epic>.md`. **Replace T2's Design step** by copying the relevant section of the approved doc into the change's `design.md`. Do not re-brainstorm.
6. After approval, and after each child change is archived, dispatch `bridge-cartographer` (`update`) so ARCHITECTURE.md points at `docs/designs/<epic>.md` and reflects the new structure.
7. Keep the design doc living: if a T2 change deviates, update `docs/designs/<epic>.md` and log the decision in elephant.md.

## Cost control
- Minimum goldfish set: comprehension, design_critic, implementation_readiness, synthesizer. Add structural/zoom_out/codebase_details only for large or cross-system docs.
- Comprehension runs with model override `sonnet`. Critics and readiness use the agent default (opus).
- Run independent critics in parallel, in a single message.
