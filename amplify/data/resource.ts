import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";

const iotCoreHandler = defineFunction({
  entry: './deviceHandler/handler.ts'
})

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({

  Devices: a
    .model({
      device_id: a.string().required(),
      owner: a.string().required(),
      status: a.string()
    })
    .identifier(['device_id'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

  Telemetry: a
    .model({
      device_id: a.string().required(),
      timestamp: a.timestamp().required(),
      temperature: a.float(),
      humidity: a.float(),
      owner: a.string().required()
    })
    //.identifier(['device_id'])
    .identifier(['device_id', 'timestamp'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

    AddTelemetry: a
    .mutation()
    .arguments({
      device_id: a.string().required(),
      timestamp: a.timestamp().required(),
      temperature: a.float(),
      humidity: a.float(),
      owner: a.string().required()
    }
    )
    .returns(a.ref("Telemetry"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(iotCoreHandler)),
});



export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>