---
name: spec-kit
description: >-
  GitHub Spec Kit - Spec-Driven Development (SDD) methodology. Use this skill whenever the user asks to plan, specify, design, architect, or build features using GitHub's Spec Kit workflow, or invokes /speckit-*, specify, plan, tasks, implement, or converge commands.
---

# GitHub Spec Kit: Spec-Driven Development (SDD)

Spec Kit is GitHub's official framework for **Specification-Driven Development (SDD)**. In SDD, specifications do not serve code—code serves specifications. You build software through an intentional, iterative pipeline: **Constitution → Specify → Clarify → Plan → Tasks → Implement → Converge**.

Templates and command definitions are stored locally in the [templates/](./templates/) directory.

---

## SDD Pipeline & Lifecycle

```
┌────────────────────────────────────────────────────────┐
│ 1. CONSTITUTION (Once per project)                     │
│    Establish engineering standards, stack, and rules   │
│    Command: /speckit-constitution                      │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. SPECIFY (What & Why, User Journeys, Acceptance)     │
│    Turn natural language requirements into PRD/Spec    │
│    Command: /speckit-specify <feature description>     │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. CLARIFY (Quality Gate)                              │
│    Ask targeted questions to remove ambiguities        │
│    Command: /speckit-clarify                           │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. PLAN (How - Architecture & Technical Decisions)     │
│    Tech stack, data models, APIs, and folder structure │
│    Command: /speckit-plan <technical constraints>      │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. TASKS (Actionable Work Breakdown)                   │
│    Decompose plan into testable, prioritized slices    │
│    Command: /speckit-tasks                             │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 6. IMPLEMENT & CONVERGE (Execution Loop)               │
│    Build task-by-task → Verify against Spec & Tests    │
│    Commands: /speckit-implement → /speckit-converge    │
└────────────────────────────────────────────────────────┘
```

---

## Directory Conventions

Spec Kit artifacts are maintained in the project root under `.specify/`:

```text
.specify/
├── constitution.md              # Project-wide engineering constitution
└── specs/
    └── [feature-name]/
        ├── spec.md              # Feature specification (User stories & acceptance)
        ├── plan.md              # Architectural & implementation plan
        ├── tasks.md             # Ordered task breakdown with checkboxes
        └── checklist.md         # Verification and acceptance checklist
```

---

## Commands & Workflows

### 1. `/speckit-constitution`
* **Purpose**: Define non-negotiable architectural principles, testing discipline, code quality, and security requirements.
* **Template**: [constitution-template.md](./templates/constitution-template.md)
* **Output**: `.specify/constitution.md`
* **Details**: [constitution.md instructions](./templates/commands/constitution.md)

### 2. `/speckit-specify [feature description]`
* **Purpose**: Create or update the functional specification. Focuses strictly on **WHAT** and **WHY**, deliberately avoiding framework-specific code details.
* **Template**: [spec-template.md](./templates/spec-template.md)
* **Output**: `.specify/specs/[feature-name]/spec.md`
* **Rules**:
  - Break features into prioritized user stories (P1 MVP, P2, P3).
  - Each story must be independently testable with concrete `Given / When / Then` scenarios.
* **Details**: [specify.md instructions](./templates/commands/specify.md)

### 3. `/speckit-clarify`
* **Purpose**: Identify ambiguities, edge cases, and missing requirements in `spec.md` before writing technical plans.
* **Workflow**: Asks 3–5 high-impact questions to clarify scope, error states, and constraints.
* **Details**: [clarify.md instructions](./templates/commands/clarify.md)

### 4. `/speckit-plan [tech stack details]`
* **Purpose**: Translate functional requirements into a concrete technical architecture.
* **Template**: [plan-template.md](./templates/plan-template.md)
* **Output**: `.specify/specs/[feature-name]/plan.md`
* **Rules**:
  - Map each requirement directly to architectural decisions.
  - Define schema/data models, API endpoints, component hierarchy, and file changes.
  - Document technical rationale and alternatives considered.
* **Details**: [plan.md instructions](./templates/commands/plan.md)

### 5. `/speckit-tasks`
* **Purpose**: Generate an executable task list from `plan.md` and `spec.md`.
* **Template**: [tasks-template.md](./templates/tasks-template.md)
* **Output**: `.specify/specs/[feature-name]/tasks.md`
* **Rules**:
  - Order tasks logically: Setup → Models → Core Logic → UI → Integration → Tests.
  - Format tasks as actionable markdown checkboxes: `- [ ] Task Description`.
  - Include verification step for each task.
* **Details**: [tasks.md instructions](./templates/commands/tasks.md)

### 6. `/speckit-implement`
* **Purpose**: Execute tasks from `tasks.md` sequentially.
* **Rules**:
  - Implement one task at a time.
  - Run tests and linting after each task.
  - Mark completed tasks with `[x]`.
* **Details**: [implement.md instructions](./templates/commands/implement.md)

### 7. `/speckit-converge`
* **Purpose**: Measure convergence between implementation, `spec.md`, and `tasks.md`.
* **Rules**:
  - Verify every user story's acceptance criteria.
  - Check for unintended regression or missing edge cases.
  - Report status as either **Converged** or list remaining discrepancies.
* **Details**: [converge.md instructions](./templates/commands/converge.md)

### 8. `/speckit-checklist`
* **Purpose**: Generate quality checklists across Security, Accessibility, Performance, and Testing.
* **Template**: [checklist-template.md](./templates/checklist-template.md)
* **Details**: [checklist.md instructions](./templates/commands/checklist.md)

---

## Antigravity Pair-Programming Best Practices

1. **Keep Specifications Living**: When requirements change during development, update `spec.md` and `plan.md` first before modifying code.
2. **One Feature per Spec Folder**: Group related artifacts under `.specify/specs/<feature-name>/`.
3. **Commit Specs with Code**: Always check `.specify/` into Git so the entire team shares the same single source of truth.
