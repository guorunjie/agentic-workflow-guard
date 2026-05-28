---
name: Platform coverage request
about: Request scanner support for another workflow, agent, CI, or low-code platform
title: "[platform]: "
labels: enhancement, platform
---

## Platform


## Risk pattern

Describe the path from untrusted input to agent decision to side effect.


## Example files or exports

Use synthetic examples only. Do not include real secrets, private workflow exports, or customer data.

```text

```

## Expected rules

- [ ] AWI001 untrusted workflow context reaches a prompt
- [ ] AWI002 model output reaches shell or workflow command
- [ ] AWI005 low-code AI reaches side effects
- [ ] AWI006 broad MCP tool exposure
- [ ] AWI007 secrets visible to agent context
- [ ] AWI008 missing explicit safety controls
- [ ] AWI009 low-code automation side effect chain
- [ ] AWI010 browser side effect

## Fixture checklist

- [ ] Vulnerable fixture can be added
- [ ] Safe fixture can be added
- [ ] Benchmark expected rules are clear
