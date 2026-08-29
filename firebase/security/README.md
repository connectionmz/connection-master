# Market security rules — local draft

These files cover only the Market/store quotation paths audited in this branch.
They are intentionally **not referenced by `firebase.json`** and must not be
deployed as a complete project ruleset. The current remote Database and Storage
rules were not downloaded or changed during this work.

Before integration:

1. Export the complete rulesets from the intended non-production Firebase project.
2. Merge the scoped branches from `database.market.rules.json` and the Storage
   matches from `storage.market.rules` into those complete rulesets.
3. Add emulator tests for authenticated customer, store owner, unrelated user,
   anonymous visitor, immutable quote fields, and metric increments.
4. Test against the staging project only. Review the diff before any deploy.

The client changes supporting these rules are:

- store and product mutations use `stores/{auth.uid}`;
- product/logo uploads use owner-scoped Storage paths;
- direct store quotations require authentication;
- public product views/clicks write to constrained metric branches rather than
  mutating public catalogue data under `stores`;
- detailed global click logs are no longer written by public clients.
