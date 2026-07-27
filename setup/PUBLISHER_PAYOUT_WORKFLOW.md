# Publisher payout review workflow

## Production policy

```text
Automatic review threshold: $25.00 cleared publisher balance
Review amount: full eligible cleared publisher balance
Active review limit: one per publisher
Payout destination: verified PayPal email
Payment execution: owner-confirmed
Publisher-facing statuses: Under review, Processing, Paid, Action needed
```

Automatic PayPal API dispatch is disabled. The owner completes payment using the verified destination and records the resulting payment reference in RewardBridge.

## Financial state transitions

### 1. Eligible balance becomes available

Publisher margin is not available when CPX merely reports a transaction. It becomes available only after:

1. The CPX transaction is validated.
2. RewardBridge receives the related CPX funds.
3. The provider receipt is reconciled to the transaction.
4. Reversal and fraud checks permit release.

### 2. Automatic payout review

After a positive publisher-available ledger entry, the database checks the publisher’s total available balance.

When it is at least $25:

- the full eligible balance is rounded down to whole cents
- one payout request is created with internal status `review`
- trigger source is `automatic_threshold`
- the amount is removed from publisher `available`
- the same amount is added to publisher `held`
- an append-only `automatic_review_started` event is recorded
- an owner audit event is recorded

The unique active-payout index prevents a second active publisher payout from being created.

## Destination verification

A publisher submits a PayPal email from the publisher dashboard.

- New destinations begin as `pending`.
- Only the owner may mark a destination `verified`.
- Verifying one destination disables other active PayPal destinations for that publisher.
- A changed destination returns an active approved payout to review.
- The payout stores a destination snapshot so payment cannot be recorded against a silently changed destination.

The publisher sees only the destination and its verification state. Internal notes and payment evidence are owner-only.

## Owner review checklist

Before selecting **Approve**:

- confirm the publisher account is approved
- confirm payouts are not paused
- confirm the PayPal destination is verified
- confirm the payout amount matches held publisher balance
- confirm the associated publisher margin came from reconciled CPX cash receipts
- inspect CPX reversals and pending fraud signals
- inspect unusual IP, account, project, and transaction patterns
- confirm required identity, tax, sanctions, country, or legal checks
- add an internal note when useful

Approval changes the internal status from `review` to `queued`. The publisher sees `Processing`.

## Payment completion

After approval:

1. Pay the exact approved amount to the destination snapshot.
2. Confirm PayPal reports that the payment was sent to the intended destination.
3. Copy the PayPal transaction ID or another durable payment reference.
4. Enter the reference in the owner dashboard.
5. Select **Record paid** and confirm the action.

RewardBridge then:

- removes the amount from publisher `held`
- adds the amount to publisher `settled`
- sets the payout status to `paid`
- records payment time and owner identity
- stores the payment reference
- creates an append-only payout event
- creates an owner audit record
- checks whether any new remaining eligible balance also meets the $25 threshold

A payout cannot be recorded as paid unless it was approved first, has a verified matching destination, and includes a payment reference.

## Return to review

Use **Return to review** when payment has not been sent and additional checking is needed.

- Funds remain held.
- Approval metadata is cleared.
- The publisher status returns to `Under review`.
- Payment must not be sent until the payout is approved again.

## Payment failed

Use **Payment failed** only when payment was attempted but was not successfully completed.

Required actions:

- enter an internal reason
- confirm the payment did not complete or was returned
- select **Payment failed**

RewardBridge:

- removes the amount from held
- returns it to available through compensating entries
- sets the payout to `failed`
- pauses further automatic publisher payout review
- records the reason and audit events

Resolve the destination or payment issue, then select **Resume payouts**. If the available balance is still at least $25, a new automatic review is created.

## Rejected review

Use **Reject** when the payout should not proceed because of unresolved fraud, invalid information, legal risk, provider instruction, or another material problem.

- An internal reason is mandatory.
- Held funds return to available through compensating entries.
- The payout status becomes `rejected`.
- Publisher payouts are paused.
- Funds are not deleted; later recovery, reversal, or release decisions remain auditable.

Do not resume payouts until the reason is resolved and documented.

## Publisher-facing behavior

Publishers do not see internal execution details. Their dashboard shows:

- available publisher balance
- amount currently in payout review
- progress toward $25
- payout destination and verification state
- recent payout amount, date, masked destination, and simplified status

Public statuses map as follows:

| Internal status | Publisher status |
|---|---|
| `requested`, `review` | Under review |
| `queued`, `processing` | Processing |
| `paid` | Paid |
| `failed`, `rejected`, `canceled` | Action needed |

## Privacy and access boundaries

- Publishers cannot directly select internal `payout_requests` rows.
- Publishers use `get_my_publisher_payouts()`, which returns only safe fields.
- Owner queue data is returned only by `admin_list_publisher_payouts()` after an owner-email authorization check.
- Payment references, internal notes, destination snapshots, and payout events are not exposed to publishers.
- Ledger and payout-event history is append-only.

## Failure prevention controls

- one active payout per publisher
- advisory transaction lock during automatic review creation
- idempotent ledger keys for each reserve, release, settlement, failure, and rejection entry
- verified destination requirement
- destination snapshot comparison before recording payment
- approval required before paid status
- payment reference required before paid status
- payout pause after failure or rejection
- no automatic PayPal API dispatch
- owner audit entries for every sensitive transition

## Completed validation

A rollback-only production database test exercised:

```text
$30 available
→ automatic review
→ $30 held
→ owner approval
→ payment reference recorded
→ $30 settled
```

The final test state was:

```text
available: $0.00
held: $0.00
settled: $30.00
payout status: paid
payout events: 3
```

The transaction was rolled back. No synthetic user, publisher, payout, payout event, or ledger entry remains in production.
