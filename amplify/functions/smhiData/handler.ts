import type { Handler } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;
const AMPLIFY_SSM_ENV_CONFIG = process.env.AMPLIFY_SSM_ENV_CONFIG as string;

// SMHI parametrar för Svenska Högarna (station 99280)
// Ta emot station från GraphQL-resolvern
const INPUT_STATION_ID = (Event?.arguments?.stationId as string) || "99280";
const STATION_ID = INPUT_STATION_ID;

const PARAMETERS = {
  temperature: "1",
  windDirection: "3",
  windSpeed: "4",
  windGust: "21",
  visibility: "6"
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler: Handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log(`GRAPHQL_ENDPOINT: ${GRAPHQL_ENDPOINT}`);
    console.log(`GRAPHQL_API_KEY: ${GRAPHQL_API_KEY}`);
    console.log(`AMPLIFY_SSM_ENV_CONFIG: ${AMPLIFY_SSM_ENV_CONFIG}`);

    let statusCode = 200;
    let response;
    let responseBody;
    let request;

    const headers = {
        'x-api-key': GRAPHQL_API_KEY,
        'Content-Type': 'application/json'
    };

    try {
        // Hämta alla parametrar från SMHI
        const fetchPromises = Object.entries(PARAMETERS).map(async ([key, paramId]) => {
            const url = `https://opendata-download-metobs.smhi.se/api/version/latest/parameter/${paramId}/station/${STATION_ID}/period/latest-hour/data.json`;
            const smhiResponse = await fetch(url);
            
            if (smhiResponse.status === 200) {
                const data = await smhiResponse.json();
                return { key, data };
            } else {
                console.warn(`Failed to fetch ${key} (parameter ${paramId}):`, smhiResponse.status);
                return { key, data: null };
            }
        });

        const results = await Promise.all(fetchPromises);
        
        // Bygg item-objektet med all data
        const smhiData: any = {
            device_id: STATION_ID,
            device_type: "SMHI_Station",
            name: "Svenska Högarna"
        };

        results.forEach(({ key, data }) => {
            if (data && data.value && data.value.length > 0) {
                const latestValue = data.value[0];
                
                if (!smhiData.timestamp) {
                    smhiData.timestamp = latestValue.date;
                }
                
                switch(key) {
                    case 'temperature':
                        smhiData.temperature = parseFloat(latestValue.value);
                        break;
                    case 'windDirection':
                        smhiData.wind_direction = parseFloat(latestValue.value);
                        break;
                    case 'windSpeed':
                        smhiData.wind_speed = parseFloat(latestValue.value);
                        break;
                    case 'windGust':
                        smhiData.wind_gust_max = parseFloat(latestValue.value);
                        break;
                    case 'visibility':
                        smhiData.visibility = parseFloat(latestValue.value);
                        break;
                }
                
                console.log(`${key}:`, latestValue.value, latestValue.quality);
            }
        });

        console.log("Combined weather data:", smhiData);

        // Kontrollera om enheten finns och hämta owner
        request = new Request(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: `query MyQuery {
                    getDevices(device_id: "${STATION_ID}") {
                        device_id
                        owner
                    }
                }`
            })
        });

        console.log("request:", request);

        response = await fetch(request);
        responseBody = await response.json();

        console.log("responseBody:", responseBody);
        if (responseBody.errors) statusCode = 400;

        // Om enheten finns och en owner hittades, lägg till telemetri
        if (responseBody.data.getDevices?.owner) {
            request = new Request(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    query: `mutation MyMutation {
                        createTelemetry(input: {
                            device_id: "${smhiData.device_id}",
                            temperature: ${smhiData.temperature},
                            wind_direction: ${smhiData.wind_direction},
                            wind_speed: ${smhiData.wind_speed},
                            wind_gust_max: ${smhiData.wind_gust_max},
                            visibility: ${smhiData.visibility},
                            owner: "${responseBody.data.getDevices.owner}",
                            timestamp: ${smhiData.timestamp}
                        }) {
                            device_id
                            temperature
                            wind_direction
                            wind_speed
                            wind_gust_max
                            visibility
                            owner
                            timestamp
                            createdAt
                            updatedAt
                        }
                    }`
                })
            });

            response = await fetch(request);
            responseBody = await response.json();
            if (responseBody.errors) statusCode = 400;
        } else {
            statusCode = 404;
            responseBody = {
                errors: [{
                    message: `Device ${STATION_ID} not found or has no owner`
                }]
            };
        }

    } catch (error) {
        statusCode = 500;
        responseBody = {
            errors: [{
                status: 500,
                error: JSON.stringify(error),
            }]
        };
    }

    return {
        statusCode,
        body: JSON.stringify(responseBody)
    };
};