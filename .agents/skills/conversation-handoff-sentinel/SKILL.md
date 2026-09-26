---
name: conversation-handoff-sentinel
description: Autonomous conversation lifecycle and context handover sentinel. Proactively monitors conversation token depth, generates structured HANDOVER.md snapshots at phase milestones, and enables zero-loss resumption in new chat sessions.
---

# Conversation Handoff Sentinel & Zero-Loss Resumption Protocol

## Purpose
Prevent quality degradation caused by context window saturation and sudden token cutoffs. This skill provides two core capabilities:
1. **Context Proactive Reminder**: Alert the user to switch conversations at optimal milestones (e.g. after completing a major phase or when context gets deep).
2. **Deterministic Handover**: Automatically snapshot the active development state to `HANDOVER.md` so any new conversation can resume seamlessly within 5 seconds.

## Handover Snapshot Schema (`HANDOVER.md`)
Whenever a task or phase concludes, the Sentinel verifies or updates `HANDOVER.md` at the project root with:
- **Active Phase**: Current phase being worked on.
- **Completed Deliverables**: Exact endpoints, models, components created.
- **Verified Metrics**: Passing test count, linter status, build verification.
- **Git Context**: Latest commit hash, branch, clean working tree confirmation.
- **Immediate Next Steps**: Concrete step-by-step checklist for the subsequent phase.
- **1-Click Resumption Prompt**: A short, copy-pasteable prompt for the user to paste into a new conversation.

## Automatic Bootstrap Protocol (New Conversation)
Whenever a user starts a new conversation in this workspace and mentions "tiếp tục", "resume", or asks what to do next:
1. **Step 1**: Check `HANDOVER.md` and `PROGRESS.md` immediately.
2. **Step 2**: Run `git log -n 3 --oneline` and `git status` to verify current tree.
3. **Step 3**: State the exact resumed phase to the user and continue work without asking redundant questions.

## Reminder Threshold Rules
Trigger a proactive handover reminder when:
- A complete development Phase (e.g., Phase 5, Phase 6) is verified, committed, and pushed.
- The conversation context contains extensive logs, multiple subagents, or exceeds 15 user turns.
