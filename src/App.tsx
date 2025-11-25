import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { 
  Badge, 
  Button, 
  Card, 
  Collection, 
  Divider, 
  Flex, 
  Heading, 
  useAuthenticator, 
  View,
  Text
} from '@aws-amplify/ui-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [devices, setDevices] = useState<Array<Schema["Devices"]["type"]>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [telemetryData, setTelemetryData] = useState<Array<Schema["Telemetry"]["type"]>>([]);

  useEffect(() => {
    client.models.Devices.observeQuery().subscribe({
      next: (data) => {
        setDevices([...data.items])
      },
    });
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      // Hämta telemetridata för vald enhet
      client.models.Telemetry.list({
        filter: {
          device_id: {
            eq: selectedDevice
          }
        },
        limit: 100
      }).then(response => {
        // Sortera efter timestamp
        const sortedData = [...response.data].sort((a, b) => 
          (a.timestamp || 0) - (b.timestamp || 0)
        );
        setTelemetryData(sortedData);
      });
    }
  }, [selectedDevice]);

  function createDevice() {
    const device = String(window.prompt("Device ID"));
    client.models.Devices.create({ 
      device_id: device, 
      owner: user.userId 
    });
  }

  function deleteDevice(device_id: string) {
    client.models.Devices.delete({ device_id });
    if (selectedDevice === device_id) {
      setSelectedDevice(null);
    }
  }

  // Formatera data för grafen
  const chartData = telemetryData.map(item => ({
    time: new Date(item.timestamp || 0).toLocaleString('sv-SE', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    }),
    temperature: item.temperature,
    humidity: item.humidity// ? item.humidity / 10 : null, // Skala ner för läsbarhet
  }));

  return (
    <View className="App">
      <Flex direction="column" padding="2rem">
        <Heading level={1}>{user?.signInDetails?.loginId}'s Devices</Heading>
        
        <Card variation="outlined" marginTop="2rem">
          <Flex direction="row" justifyContent="space-between" alignItems="center">
            <Heading level={3}>Devices</Heading>
            <Button onClick={createDevice}>Add Device</Button>
          </Flex>
          
          <Divider marginTop="1rem" marginBottom="1rem" />
          
          <Collection
            items={devices}
            type="list"
            direction="column"
            gap="1rem"
          >
            {(item, index) => (
              <Card 
                key={index} 
                variation={selectedDevice === item.device_id ? "elevated" : "outlined"}
                backgroundColor={selectedDevice === item.device_id ? "blue.10" : undefined}
              >
                <Flex direction="row" justifyContent="space-between" alignItems="center">
                  <Flex direction="column" gap="0.5rem">
                    <Text>
                      <strong>Status:</strong>{" "}
                      <Badge variation={item?.status === "online" ? "success" : "warning"}>
                        {item?.status ? item?.status.charAt(0).toUpperCase() + String(item?.status).slice(1) : ""}
                      </Badge>
                    </Text>
                    <Text><strong>ID:</strong> {item.device_id}</Text>
                  </Flex>
                  <Flex gap="0.5rem">
                    <Button 
                      onClick={() => setSelectedDevice(item.device_id)}
                      variation={selectedDevice === item.device_id ? "primary" : undefined}
                    >
                      {selectedDevice === item.device_id ? "Selected" : "View Data"}
                    </Button>
                    <Button onClick={() => deleteDevice(item.device_id)} variation="destructive">
                      Delete
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            )}
          </Collection>
        </Card>

        {selectedDevice && (
          <Card variation="outlined" marginTop="2rem">
            <Heading level={3}>Weather Data - Device {selectedDevice}</Heading>
            <Divider marginTop="1rem" marginBottom="1rem" />
            
            {telemetryData.length > 0 ? (
              <>
                {/* Temperatur Graf */}
                <View marginBottom="2rem">
                  <Heading level={5}>Temperature (°C)</Heading>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#8884d8" 
                        name="Temperature (°C)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </View>

                {/* Vind Graf */}
                <View marginBottom="2rem">
                  <Heading level={5}>Humidity (%)</Heading>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#82ca9d" 
                        name="Humidity (%)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </View>

                <Text marginTop="1rem">
                  <strong>Total readings:</strong> {telemetryData.length}
                </Text>
              </>
            ) : (
              <Text>No telemetry data available for this device.</Text>
            )}
          </Card>
        )}

        <Button onClick={signOut} marginTop="2rem">Sign out</Button>
      </Flex>
    </View>
  );
}

export default App; 

/*import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
 
import {
  Badge,
  Button,
  Card,
  Collection,
  Divider,
  Flex,
  Heading,
  useAuthenticator,
  View
} from '@aws-amplify/ui-react';
 
const client = generateClient<Schema>();
 
 
function App() {
 
  const { user, signOut } = useAuthenticator();
 
  const [devices, setDevices] = useState<Array<Schema["Devices"]["type"]>>([]);
  useEffect(() => {
    client.models.Devices.observeQuery().subscribe({
      next: (data) => { setDevices([...data.items]) },
    });
  }, []);
 
  function createDevice() {
    const device = String(window.prompt("Device ID"));
    client.models.Devices.create({ device_id: device, owner: user.userId })
  }
 
  function deleteDevice(device_id: string) {
    client.models.Devices.delete({ device_id })
  }
 
 
  //const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
 
  //useEffect(() => {
  // client.models.Todo.observeQuery().subscribe({
  //   next: (data) => setTodos([...data.items]),
  // });
  //}, []);
 
  // function createTodo() {
  //client.models.Todo.create({ content: window.prompt("Todo content") });
  //}
 
 
  //function deleteTodo(id: string) {
  //client.models.Todo.delete({ id })
  // }
 
  return (
    <main>
      <h1>{user?.signInDetails?.loginId}'s Devices</h1>
      <Divider padding="xs" />
      <h3>Devices</h3>
      {
        <Button
          variation="primary"
          loadingText=""
          onClick={createDevice}
        >
          Add Device
        </Button>
      }
      <Divider padding="xs" />
 
      <Collection
        items={devices}
        type="list"
        direction="row"
        gap="20px"
        wrap="nowrap"
      >
        {(item, index) => (
          <Card
            key={index}
            borderRadius="medium"
            maxWidth="20rem"
            variation="outlined"
          >
            <View padding="xs">
              <Flex>
                {/* Last Seen: {telemetries[telemetries.length - 1]?.timestamp ? moment(telemetries[telemetries.length - 1].timestamp).fromNow() : ""} */ /*}

              </Flex>
              <Flex>
                Status:
                <Badge variation={(item?.status == "connected") ? "success" : "error"} key={item.device_id}>
                  {item?.status ? item?.status.charAt(0).toUpperCase() + String(item?.status).slice(1) : ""}
                </Badge>
              </Flex>
              <Divider padding="xs" />
              <Heading padding="medium">ID: {item.device_id}</Heading>
              <Button variation="destructive" isFullWidth onClick={() => deleteDevice(item.device_id)}>
                Delete
              </Button>
            </View>
          </Card>
        )}
      </Collection>
      <View padding="xs"></View>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
 
export default App;*/