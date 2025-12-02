## IoT Weather & Environment Monitoring System

A cloud-connected ESP32 telemetry and weather data platform built with AWS Amplify, IoT Core, and React.

## Introduction

This project collects environmental data — temperature, humidity, and light levels — using an ESP32 microcontroller. The device processes the sensor values locally and publishes them securely to the cloud, where the data is stored and presented as graphs on a web dashboard.

As a long-time sailor, I also integrated real-time weather readings from SMHI (the Swedish Meteorological and Hydrological Institute).
Weather data from the lighthouse station Svenska Högarna is fetched through SMHI’s REST API and displayed in a dedicated view.

This project serves as a full IoT pipeline demonstration: edge device → cloud ingestion → database → serverless processing → frontend visualization.

## Hardware

ESP32

DHT11 — Temperature & humidity sensor

RGB Light sensor

## Software & Cloud Services
AWS

IoT Core – Secure device communication (MQTT + mTLS)

Lambda – Serverless processing (multiple functions)

DynamoDB – Hot storage for device telemetry and SMHI data

S3 – Cold storage for long-term telemetry archiving

Amplify (Gen 2) – Code-first fullstack framework & hosting

## Development Tools

Arduino IDE – ESP32 programming

Node.js

React – Frontend

Draw.io – Architecture diagrams

## IoT Environment

All ESP32 source code and setup instructions can be found here:
👉 https://github.com/Ameleas/AWS-IoT-Core

The ESP32 communicates with AWS IoT Core using MQTT over mTLS, ensuring encrypted, authenticated device connections.

## System Flow

<img width="945" height="652" alt="image" src="https://github.com/user-attachments/assets/47d38c9e-9a45-429d-a265-e565dc7c20fe" />


The system is divided into separate serverless Lambda functions, each responsible for its own task — processing telemetry, writing to DynamoDB, archiving to S3, and interacting with SMHI weather data.

Amplify handles:

Automated creation of DynamoDB tables

Deployment of Lambda functions

Frontend hosting

Static file distribution

API routes and permissions

When the Amplify project is deployed, the following DynamoDB tables are automatically created via amplify/data/resources.ts:

Devices

Telemetry

SMHI

Lambda functions are created from your code in amplify/functions/.../handler.ts.
To connect a Lambda to a DynamoDB table, additional configuration is set in AWS after deployment.

Despite the initial learning curve, Amplify’s code-first approach makes it possible to build full cloud applications with minimal configuration.

## Security

All IoT communication uses MQTT with mutual TLS authentication (mTLS).

AWS IoT Core uses MFA-protected login.

IAM Policies restrict device and user access.

Every user session is stored with a unique owner identifier, ensuring data separation.

All traffic is encrypted end-to-end.

## Scalability

This system is built to scale horizontally:

Users

You can onboard unlimited users.
Amplify manages authentication and per-user data ownership automatically.

Weather Stations

The SMHI integration can easily be extended to collect data from multiple stations and allow users to choose which station to view.

Devices

New IoT devices can be added in IoT Core and linked to new or existing users, each with its own telemetry.

## Images

<img width="3129" height="1980" alt="login" src="https://github.com/user-attachments/assets/232a7ef6-5bf0-4c8a-84f3-8a801cf3ddc6" />
<img width="3123" height="1965" alt="devices view" src="https://github.com/user-attachments/assets/52af6a5e-0e2f-4bc7-b054-a3a34c7d79e5" />
<img width="3666" height="1890" alt="tables" src="https://github.com/user-attachments/assets/4a757de6-d923-4dca-b93a-a637a36e1bd1" />

## Acknowledgements

Special thanks to Johan Holmberg, whose guidance and shared code were instrumental in completing this project. His patience and structured teaching have been invaluable.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
