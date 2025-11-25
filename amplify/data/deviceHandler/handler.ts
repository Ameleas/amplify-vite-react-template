import type { Schema } from '../resource'

export const handler: Schema["AddTelemetry"]["functionHandler"] =  async (event, context) => {
    return {
        device_id: event.arguments.device_id,
        timestamp: 1,
        temperature: 1,
        humidity: 1,
        owner: event.arguments.owner,
        createdAt: new Date(event.arguments.timestamp).toISOString(),
        updatedAt: new Date(event.arguments.timestamp).toISOString(),
    };
};