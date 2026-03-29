# VibePing

VibePing is a TypeScript monorepo for watching local project activity and sending useful notifications when something important changes.

## Workspace overview

- `apps/watcher`: Electron + TypeScript desktop app for monitoring local folders with a starter mock UI.
- `apps/backend`: Node.js backend for API endpoints and Discord notification delivery.
- `packages/shared`: Shared types and constants used by both apps.

## Structure

This repository uses `pnpm` workspaces and a shared TypeScript base config to keep the setup small and consistent.
