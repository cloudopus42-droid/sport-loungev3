# QA Agent — Autonomous Pre-Deploy Quality Gate

## When to Use

**ALWAYS before any `git push` or deploy.** This is non-negotiable.

## Workflow

### Step 1: Run the PowerShell QA script

```powershell
.\scripts\pre-deploy.ps1 -AutoFix -Verbose
```

This checks 7 categories:
1. **TypeScript type check** (server) — `npx tsc --noEmit`
2. **Client build** — `npx vite build`
3. **Unhandled promise rejections** — `.then()` without `.catch()`
4. **Silent catch blocks** — `catch(_) {}` or `catch {}`
5. **Text sizes below 9px** — accessibility minimum
6. **Touch targets below 44px** — interactive elements
7. **Error boundary presence** — must wrap App

### Step 2: If script finds ERRORS — fix them before proceeding

The script auto-fixes what it can (silent catches, small text). TypeScript and build errors require manual fixes.

### Step 3: After script passes, do a manual scan for these patterns

#### Client (`client/src/**/*.{ts,tsx}`)

| Pattern | Issue | Fix |
|---------|-------|-----|
| `useState<any>` | Untyped state | Define proper interface |
| `useRef<any>` | Untyped ref | Type the ref value |
| `as any` | Unsafe cast | Use proper type assertion |
| `(e: any)` | Untyped handler | Type the event parameter |
| Missing `AbortController` | Memory leak | Add cleanup in useEffect |
| Missing `URL.revokeObjectURL` | Object URL leak | Revoke in cleanup |
| `console.log` in non-error paths | Debug noise | Remove or use logger |
| `Math.random()` in render | Non-deterministic | Move to useMemo |

#### Server (`server/src/**/*.ts`)

| Pattern | Issue | Fix |
|---------|-------|-----|
| `.then()` without `.catch()` | Unhandled rejection | Add `.catch(() => {})` or `void` |
| `catch {}` or `catch (_) {}` | Silent error swallowing | Add `console.warn` |
| `req.user!.id` after auth | Non-null assertion | Add guard: `if (!req.user) return` |
| `as any` on DB results | Untyped data | Define interface for DB row |
| Missing `next(err)` in catch | Error handler bypass | Always call `next(err)` |
| `console.log` in production | Noise | Use conditional logger |

### Step 4: After all fixes, run the script again to verify

```powershell
.\scripts\pre-deploy.ps1 -Verbose
```

### Step 5: Only deploy if script reports DEPLOY OK

If DEPLOY BLOCKED → fix all ERRORS and re-run.

## Auto-Fix Capabilities

The script automatically fixes:
- Silent `catch {}` blocks → adds `console.warn`
- Text sizes below 9px → bumps to `text-[9px]`
- Detects (but doesn't auto-fix) unhandled promises, small touch targets

## Manual Fixes Required

These need human/AI intervention:
- TypeScript type errors
- Build failures
- Missing ErrorBoundary
- Memory leaks (useEffect cleanup)
- Object URL leaks

## Integration with CLAUDE.md

Add to CLAUDE.md Rules section:
```
- ALWAYS run `.\scripts\pre-deploy.ps1 -AutoFix` before any git push
- NEVER deploy if script reports DEPLOY BLOCKED
```

## Files

- `scripts/pre-deploy.ps1` — Main QA script
- `.claude/skills/qa-agent/SKILL.md` — This file
- `.claude/skills/qa-agent/skill.yaml` — Skill metadata
