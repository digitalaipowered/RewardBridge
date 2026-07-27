# InfinityFree staging setup

The active RewardBridge site remains on AppDeploy until the InfinityFree copy is manually verified.

## Current hosting values

- Future domain: `https://rewardbridge.freehosting.dev/`
- FTP hostname: `ftpupload.net`
- FTP port: `21`
- Protocol: explicit FTPS
- Remote website directory: `/htdocs/`

## Security first

The hosting password was visible in a screenshot. Rotate it in InfinityFree before using FTP or GitHub Actions. Do not reuse the old value and do not commit the replacement to this repository.

## Add GitHub repository secrets

Open the RewardBridge repository, then:

1. Open **Settings**.
2. Open **Secrets and variables**.
3. Open **Actions**.
4. Add `INFINITYFREE_FTP_USERNAME` using the FTP username shown in InfinityFree's FTP Details section.
5. Add `INFINITYFREE_FTP_PASSWORD` using the newly rotated FTP password.

Do not use the normal InfinityFree dashboard password unless the FTP Details section confirms it is the FTP password.

## Run a staging upload

1. Open the repository's **Actions** tab.
2. Select **Stage RewardBridge on InfinityFree**.
3. Select **Run workflow**.
4. Enter `DEPLOY` in the confirmation field.
5. Start the workflow.

The workflow mirrors the currently verified AppDeploy frontend, confirms the legal pages exist, scans for common secret markers, rejects files above InfinityFree's 10 MB limit, creates a safe `.htaccess`, and uploads the release to `/htdocs/`.

It does not delete the entire hosting directory. Files tracked by the FTP deployment state may be updated or removed when the mirrored release changes.

## Verification checklist

Do not switch the active URL until all items pass:

- Homepage loads over HTTPS.
- Mobile layout scrolls correctly.
- Privacy, Platform Terms, Publisher Agreement, Rewards Terms, and Contact pages load.
- Magic Link email is sent.
- Magic Link returns to the intended site rather than AppDeploy.
- Publisher application can be submitted.
- Owner account can see pending applications.
- No CPX survey wall is available while the managed-network lock is disabled.
- Browser console contains no persistent JavaScript or CORS errors.
- `https://rewardbridge.freehosting.dev/` is added to Supabase Auth redirect URLs before testing Magic Link on that host.

## Rollback

The AppDeploy site remains active during staging. If the InfinityFree copy fails, do not change the Supabase active-site setting. Correct the release and rerun the workflow.
