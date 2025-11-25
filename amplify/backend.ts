import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
 
import { graphqlIoTCoreTelemetry } from './functions/deviceTelemetry/resource';
import { graphqlIoTCoreStatus } from './functions/deviceOnlineStatus/resource';
 
defineBackend({
  auth,
  data,
  graphqlIoTCoreTelemetry,
  graphqlIoTCoreStatus,
});
