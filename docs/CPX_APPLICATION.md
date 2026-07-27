# CPX Research application packet

## Application values

- Application name: `RewardBridge Network`
- Application type: Website / Web application
- Active URL: `https://6028ef2dad7c557eb4.v2.appdeploy.ai/`
- Integration method requested: API Mobile + Web
- Primary language: English
- Initial market: United States
- Currency: USD
- Audience: Adults 18+
- Status: Controlled beta / prelaunch

Do not use `https://rewardbridge.freehosting.dev/` as the CPX application URL until the InfinityFree copy is uploaded, verified, and intentionally made active.

## Description

RewardBridge Network is a hosted survey and rewards infrastructure platform for web application publishers.

RewardBridge owns and operates the hosted survey interface, API infrastructure, user attribution, fraud controls, transaction ledger, provider reconciliation, and payout administration.

Approved third-party web applications will connect through project-specific API credentials and short-lived user sessions. RewardBridge will assign stable external user identifiers, maintain project attribution through sub-ID fields, enforce reward and payout rules, process reversals, and release publisher funds only after the corresponding CPX Research revenue has been received and reconciled.

The publisher withdrawal minimum is $25. Participating publishers may set their own end-user payout minimum, but never below $2.

External partner traffic remains disabled until CPX Research approves the managed distribution structure in writing.

## Traffic source description

Initial traffic will originate from the RewardBridge Network website. After written CPX approval, selected third-party web applications may refer authenticated users into short-lived RewardBridge-hosted survey sessions. Each partner project and user will be separately attributable through internal project identifiers, stable external user identifiers, and CPX sub-ID parameters.

RewardBridge will review each partner application before activation and may suspend any project or user associated with fraud, duplicate accounts, abnormal completion activity, reversals, or policy violations.

## Reward model

Rewards are funded only by validated CPX Research survey revenue. Survey activity first appears as pending and does not become withdrawable based solely on a browser callback or postback. RewardBridge releases publisher and end-user balances only after the corresponding provider payment has been received and reconciled.

- Publisher withdrawal minimum: $25
- Lowest permitted end-user payout minimum: $2
- Publishers may select a higher end-user payout minimum
- Reversals, invalid responses, fraud findings, payment-provider fees, and required reserves may reduce pending or future balances

## Support approval request

Subject: `RewardBridge managed survey platform approval request`

Message:

> Hello,
>
> I am preparing a new application called RewardBridge Network:
>
> https://6028ef2dad7c557eb4.v2.appdeploy.ai/
>
> RewardBridge is a hosted survey and rewards infrastructure platform that I own and operate. RewardBridge will control the CPX integration, hosted survey experience, stable user identifiers, project attribution, fraud controls, transaction ledger, reversals, provider reconciliation, and payout administration.
>
> Approved third-party web application publishers would integrate using project-specific API credentials. Their authenticated users would receive short-lived RewardBridge-hosted survey sessions. Each publisher project would be separately identified through internal project IDs and CPX sub-ID parameters. RewardBridge would receive CPX publisher payments and pay approved publishers only after CPX funds are received and reconciled.
>
> External partner traffic will remain disabled until CPX Research approves this structure in writing.
>
> Please confirm whether CPX permits this managed distribution or subpublisher structure; whether each partner website or application must be submitted individually; whether each partner domain must be listed; whether subid_1 and subid_2 are acceptable for project attribution; which postback placeholders should be used for transaction ID, external user ID, publisher payout, status, reversals, subid_1, and subid_2; and whether API Mobile + Web is the preferred integration method.
>
> Thank you.

## Do not commit

Never place these values in this public repository:

- CPX secure hash
- CPX postback token
- PayPal client secret
- Supabase secret key or service-role key
- InfinityFree FTP password
