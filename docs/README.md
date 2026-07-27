# Docs

Written for AI agents first, humans second: short, opinionated, and explicit about *why*. Start at [AGENTS.md](../AGENTS.md).

| Doc | What it answers |
| --- | --- |
| [product.md](product.md) | What we sell, to whom, and what a subscriber actually receives |
| [roadmap.md](roadmap.md) | What we build, in what order, and what "done" means per phase |
| [stack.md](stack.md) | Which libraries and services, and the architectural rules that come with them |
| [content-model.md](content-model.md) | Courses, lessons, blocks, concepts, localisation, progress. **The contract** |
| [ux-architecture.md](ux-architecture.md) | Loading tiers, skeleton rules, the five states every surface ships with |
| [decisions/](decisions/) | Why things are the way they are. Read before undoing anything that looks missing |

## Maintenance

Stale context is worse than no context. When a decision changes, update the doc and its ADR in the same commit as the code. If a doc contradicts the code, say so rather than silently following one.

Keep these short. Detail that an agent can read from the code does not belong here — only what it cannot infer.
