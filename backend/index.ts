import { router, json } from '@appdeploy/sdk';

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'GET /api/platform-status': [async () => json({
    managedNetworkEnabled: true,
    publisherPayoutMinimum: 25,
    userPayoutFloor: 2,
    activation: 'CPX App 34813 active'
  })]
});
