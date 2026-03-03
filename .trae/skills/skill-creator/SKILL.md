---
name: "skill-creator"
description: "MANDATORY tool for creating SKILLs. Invoke when user wants to create, add, or customize any skill in the workspace."
---

# Skill Creator

This skill helps create new SKILLs for the workspace.

## SKILL Structure

A valid SKILL requires:

1. **Directory**: `.trae/skills/<skill-name>/`
2. **File**: `SKILL.md` inside the directory

## SKILL.md Format

```markdown
---
name: "<skill-name>"
description: "<concise description covering: (1) what the skill does, (2) when to invoke it. Keep it under 200 characters>"
---

# <Skill Title>

<Detailed instructions, usage guidelines, and examples>
```

## Required Fields

| Field | Location | Description |
|-------|----------|-------------|
| `name` | frontmatter | Unique identifier for the skill |
| `description` | frontmatter | What the skill does AND when to invoke it |
| `detail` | body | Full markdown content after frontmatter |

## Creation Steps

1. Create directory: `.trae/skills/<skill-name>/`
2. Create `SKILL.md` with proper frontmatter and content
3. Validate the structure is correct
