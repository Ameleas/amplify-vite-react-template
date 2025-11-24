import type { Handler } from 'aws-lambda';
 
const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;
 
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler: Handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
 
    let statusCode = 200;
    let response;
    let responseBody;
    let request;
 
    const headers = {
        'x-api-key': GRAPHQL_API_KEY,
        'Content-Type': 'application/json'
    }
 
    /** @type {import('node-fetch').RequestInit} */
 
    // Mutate
    request = new Request(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            query: `mutation MyMutation {
                    updateDevices(input: {
                        device_id: "${event.device_id}", 
                        status: "${event.eventType}"
                        }) 
                    {
                        device_id
                        status
                        owner
                        createdAt
                        updatedAt
                    }
                }
                `})
    });
 
    try {
        console.log("request: ", request)
        response = await fetch(request);
        console.log("response: ", response)
        responseBody = await response.json();
        console.log("Response Body: ", responseBody)
        if (responseBody.errors) statusCode = 400;
    } catch (error) {
        statusCode = 400;
        responseBody = {
            errors: [
                {
                    status: response?.status,
                    error: JSON.stringify(error),
                }
            ]
        };
    }
 
 
    return {
        statusCode,
        body: JSON.stringify(responseBody)
    };
 
};