import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import './App.css';
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
  Text,
  Menu,
  MenuItem,
  MenuButton
} from '@aws-amplify/ui-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrera Chart.js komponenter
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [devices, setDevices] = useState<Array<Schema["Devices"]["type"]>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [telemetryData, setTelemetryData] = useState<Array<Schema["Telemetry"]["type"]>>([]);
  const[timeRange, setTimeRange] = useState<'hour' | 'week' | 'all'>('all');

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
        limit: 10000
      }).then(response => {
        // Sortera efter timestamp
        const sortedData = [...response.data].sort((a, b) => 
          (a.timestamp || 0) - (b.timestamp || 0)
        );

        //Filtrera baserat på vald tidsram
        const now = Date.now();
        let filteredData = sortedData;

        if (timeRange === 'hour') {
          const oneHourAgo = now - (60 * 60 * 1000);
          filteredData = sortedData.filter(item => (item.timestamp || 0) >= oneHourAgo);
        } else if (timeRange === 'week') {
          const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
          filteredData = sortedData.filter(item => (item.timestamp || 0) >= oneWeekAgo);
        }
        setTelemetryData(filteredData);
      });
    }
  }, [selectedDevice, timeRange]);

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

  // Formatera labels för X-axeln
  const chartLabels = telemetryData.map(item => 
    new Date(item.timestamp || 0).toLocaleString('sv-SE', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    })
  );

  // Temperatur data
  const temperatureData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: telemetryData.map(item => item.temperature),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const humidityData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Humidity (%)',
        data: telemetryData.map(item => item.humidity),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.1
      }
    ] 
  };

  // Vind data
  //const windData = {
  //  labels: chartLabels,
  //  datasets: [
  //    {
  //      label: 'Wind Speed (m/s)',
  //      data: telemetryData.map(item => item.wind_speed),
  //      borderColor: 'rgb(54, 162, 235)',
  //      backgroundColor: 'rgba(54, 162, 235, 0.2)',
  //      tension: 0.1
  //    },
  //    {
  //      label: 'Wind Gust Max (m/s)',
  //      data: telemetryData.map(item => item.wind_gust_max),
  //      borderColor: 'rgb(255, 99, 132)',
  //      backgroundColor: 'rgba(255, 99, 132, 0.2)',
  //      tension: 0.1
  //    }
  //  ]
  //};

  // Sikt data
  //const visibilityData = {
  //  labels: chartLabels,
  //  datasets: [
  //    {
  //      label: 'Visibility (km/10)',
  //      data: telemetryData.map(item => item.visibility ? item.visibility / 10 : null),
  //      borderColor: 'rgb(255, 206, 86)',
  //      backgroundColor: 'rgba(255, 206, 86, 0.2)',
  //      tension: 0.1
  //    }
  //  ]
  //};

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

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
                    <Menu
                      menuAlign="end"
                      trigger={
                        <MenuButton 
                          variation={selectedDevice === item.device_id ? "primary" : undefined}
                        >
                          {selectedDevice === item.device_id ? "Selected" : "View Data"}
                        </MenuButton>
                      }
                    >
                      <MenuItem 
                        onClick={() => {
                          setSelectedDevice(item.device_id);
                          setTimeRange('hour');
                        }}
                      >
                        Last Hour
                      </MenuItem>
                      <MenuItem 
                        onClick={() => {
                          setSelectedDevice(item.device_id);
                          setTimeRange('week');
                        }}
                      >
                        Last Week
                      </MenuItem>
                      <MenuItem 
                        onClick={() => {
                          setSelectedDevice(item.device_id);
                          setTimeRange('all');
                        }}
                      >
                        All Data
                      </MenuItem>
                    </Menu>
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
            <Flex direction="row" justifyContent="space-between" alignItems="center">
              <Heading level={3}>Weather Data - Device {selectedDevice}</Heading>
              <Badge size="large">
                {timeRange === 'hour' ? 'Last Hour' : timeRange === 'week' ? 'Last Week' : 'All Data'}
              </Badge>
            </Flex>
            <Divider marginTop="1rem" marginBottom="1rem" />

            
            {telemetryData.length > 0 ? (
              <>
                {/* Temperatur Graf */}
                <View marginBottom="2rem">
                  <Heading level={5}>Temperature (°C)</Heading>
                  <div style={{ height: '300px' }}>
                    <Line data={temperatureData} options={chartOptions} />
                  </div>
                </View>

                
                {/* Luftfuktighet Graf */}
                <View marginBottom="2rem">
                  <Heading level={5}>Humidity (%)</Heading>
                  <div style={{ height: '300px' }}>
                    <Line data={humidityData} options={chartOptions} />
                  </div>
                </View>

                <Text marginTop="1rem">
                  <strong>Total readings:</strong> {telemetryData.length}
                </Text>
              </>
            ) : (
              <Text>No telemetry data available for this device.</Text>
            )}
            <Divider marginTop="2rem" marginBottom="1rem" />
            <Button onClick={() => setSelectedDevice(null)}
              variation="link"
            >Back to Devices
              </Button>
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