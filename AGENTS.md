# Agent guide

## Primary doc

**Read and update [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** for all non-trivial work.

That file is the living source of truth for product intent, domain model, UI, stack, deferred scope, and implementation status.

## Before you start

1. Read the **Status** section in `docs/ARCHITECTURE.md`.
2. Skim any sections you will touch (domain, map, layers panel, search).

## When you change the system

Update `docs/ARCHITECTURE.md` **in the same change** if you alter:

- behavior or UX
- domain model / tree mutations
- stack or monorepo layout
- deferred or future scope

Keep the top **Status** block current (`Last updated`, Implemented, In progress, Next).

## Do not

- Invent parallel design docs without linking from Architecture
- Leave design-only knowledge in `.cursor/plans/` — Architecture wins
- Put secrets (tokens) in docs; env var **names** only

## README

Keep `README.md` for install/run only. Deep design stays in Architecture.
