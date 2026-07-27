# RewardBridge CPX-active mobile UX repair

Release date: July 27, 2026

## Production result

- Active frontend: `https://6028ef2dad7c557eb4.v2.appdeploy.ai/`
- CPX App ID: `34813`
- Managed network: enabled
- CPX completion reward: 45% of gross publisher revenue
- CPX bonus reward: 100% to the end user
- Platform fee: 25%
- Risk reserve: 10%
- Publisher margin: 20%
- Automatic publisher payout-review threshold: $25.00 cleared balance
- Publisher payment execution: owner-confirmed

## Screenshot defects repaired

### Project creation

Observed error:

```text
function gen_random_bytes(integer) does not exist
```

Root cause: pgcrypto is installed in the `extensions` schema while the function search path was restricted to `public`.

Repair: project-key generation now calls `extensions.gen_random_bytes(24)` explicitly.

### Reward-share precision

A second project-creation blocker appeared after the pgcrypto repair. The project column stored only two decimal places while the fixed publisher-pool reward share requires `69.230769` to produce a 45% gross end-user completion reward.

Repair: `user_reward_share_pct` now uses `numeric(9,6)` with an exact `69.230769` default and constraint.

### PayPal destination

Observed error:

```text
valid PayPal email required
```

Root cause: the deployed PostgreSQL regular expression was over-escaped.

Repair: the payout destination is normalized to lowercase and validated structurally without the faulty expression.

### Stale CPX approval state

Observed state:

```text
Disabled Pending CPX Approval
```

Repair:

- `platform_settings.managed_network_enabled=true`
- approved publisher account changed to `cpx_network_status='active'`
- public, dashboard, legal, owner, and footer copy now states CPX App 34813 is approved and active

## Active production records

```text
Publisher: Crimson
Publisher status: approved
CPX network status: active
Project: Crimson Forge
Project URL: https://crimsonforge.gamer.gd
Project status: active
End-user payout minimum: $5.00
PayPal destination: claytondsmith1011@gmail.com
PayPal destination status: pending verification
```

The setup operation did not create provider transactions, ledger entries, payout requests, rewards, or artificial balances.

## Mobile dashboard improvements

- Replaced four oversized stacked status cards with a compact 2×2 mobile summary.
- Added quick navigation chips for Projects, Payouts, and Economics.
- Added project-form title, instructions, Close and Cancel controls.
- Normalized project URLs before submission.
- Added finite-number validation for payout minimums.
- Improved project success copy.
- Added dismissible notices with automatic timeout.
- Added section anchors and mobile scroll offsets.
- Updated active-project credential safety guidance.
- Kept the existing RewardBridge visual language and payout economics.

## QA evidence

AppDeploy production deployment completed successfully.

```text
Frontend errors: 0
Backend errors: 0
Network errors: 0
E2E status: passed
Desktop QA screenshot: generated
Mobile QA screenshot: generated
```

## Files synchronized

- Production AppDeploy source
- GitHub `main`
- Supabase database functions and constraints
- Public legal pages
- Repository QA expectations
- Reproducible Supabase migration
- Full source ZIP release package

## Remaining owner action

Verify the submitted PayPal destination in the private owner dashboard. Automatic PayPal API dispatch remains disabled; real publisher payments are completed externally after review and recorded with a payment reference.
