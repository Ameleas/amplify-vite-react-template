import { defineFunction, secret } from '@aws-amplify/backend';

export const graphqlIoTCoreTelemetry = defineFunction({

  environment: {
    API_ENDPOINT: secret('CUSTOM_LAMBDA_GRAPHQL_ENDPOINT'), // this assumes you created a secret named "MY_API_KEY"
    API_KEY: secret('CUSTOM_LAMBDA_GRAPHQL_KEY') // this assumes you created a secret named "MY_API_KEY"
  },
  // optionally specify a name for the Function (defaults to directory name)
  name: 'graphqlIoTCoreTelemetry',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});