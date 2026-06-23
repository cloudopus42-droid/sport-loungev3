---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.
---

# Skill Creator

This skill provides guidance for creating effective skills.

## About Skills

Skills are modular, self-contained packages that extend Claude's capabilities by providing
specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific
domains or tasks.

### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

### Progressive Disclosure

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed by Claude

## Skill Creation Process

### Step 1: Understand the Skill with Concrete Examples
Identify clear examples of how the skill will be used. Ask questions like:
- "What functionality should the skill support?"
- "Can you give examples of how this skill would be used?"
- "What would a user say that should trigger this skill?"

### Step 2: Plan the Reusable Skill Contents
For each concrete example, analyze:
1. How to execute on the example from scratch
2. What scripts, references, and assets would be helpful

### Step 3: Create the Skill Directory
Create a new directory under `agents/skills/` with SKILL.md and optional subdirectories.

### Step 4: Write SKILL.md
Include:
- YAML frontmatter with name and description
- Purpose of the skill
- When to use it
- Complete instructions referencing all bundled resources

### Step 5: Iterate
1. Use the skill on real tasks
2. Notice struggles or inefficiencies
3. Update SKILL.md or bundled resources
4. Implement changes and test again
