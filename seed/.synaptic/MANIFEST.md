# SYNAPTIC-CORE Brain Manifest

## Metadata
- **standard**: synaptic-core
- **version**: 0.3.1
- **created**: {{CREATED_DATE}}
- **last_modified**: {{MODIFIED_DATE}}

## Identity
- **name**: {{BRAIN_NAME}}
- **role**: {{ROLE_SUMMARY}}

## Areas
<!-- List of work areas defined in knowledge/areas/ -->
- {{AREA_1}}
- {{AREA_2}}

## Domains
<!-- List of knowledge domains defined in knowledge/domains/ -->
- {{DOMAIN_1}}
- {{DOMAIN_2}}

## Worklines
<!-- Active work directions — see worklines/_active.yaml for details -->
<!-- Updated by /plan -->

## Capabilities
- **tools_available**: false
- **runtime**: none
<!-- Updated by bootstrap capability detection -->

## Skills
- init
- plan
- consolidate
- ingest
- discover
- audit
- upgrade
- help

## Skill Triggers

<!-- Semantic mapping: when the agent detects this context, suggest or use this tool.
     Populated by /discover or manually. -->

```yaml
triggers: []
  # - context: "SQL queries or database operations"
  #   tool: postgres-skill
  #   type: skill
  # - context: "Excel or CSV file operations"
  #   tool: excel-mcp
  #   type: mcp
  # - context: "CI/CD pipeline configuration"
  #   tool: deployment-skill
  #   type: skill
```
