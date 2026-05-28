## Summary

- 

## Verification

- [ ] `npm test`
- [ ] `npm run release:sync:check`
- [ ] `npm run docs:build`
- [ ] `npm run release:check`
- [ ] `node ./bin/agentic-workflow-guard.js benchmark`
- [ ] `git diff --check`

## Contribution Type

- [ ] Scanner/platform coverage
- [ ] Fix recipe
- [ ] Rule pack or marketplace metadata
- [ ] Benchmark fixture
- [ ] Agent/skill output
- [ ] Documentation
- [ ] Release or packaging

## Safety Checklist

- [ ] No real secrets, tokens, customer data, or private workflow exports are included.
- [ ] New vulnerable fixtures are paired with safe fixtures.
- [ ] Generated static metadata was updated with `npm run release:sync` when needed.
- [ ] Agent outputs were regenerated when `skillpack.yaml` changed.
- [ ] Automatic fixes remain low-risk and reviewable.
