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
  MenuButton,
  TextField
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

export default function App() {
  const { user, signOut } = useAuthenticator();

  // ----------- Välj device eller smhi -----------
  const [view, setView] = useState<'menu' | 'devices' | 'smhi'>('menu');

  return (
    <View className="App">
      <Flex direction="column" padding="2rem"
      style={{width: "100%", alignItems: "center"}}>

        <Heading level={1}>Welcome {user?.signInDetails?.loginId}</Heading>

        {/* ----------- STARTMENY ----------- */}
        {view === 'menu' && (
          <div className="page-conainer">
          <Flex justifyContent="center" width="100%">
            <Card variation="outlined" marginTop="2rem">
              <Heading level={3}>Select Data Source</Heading>
              <Divider marginTop="1rem" marginBottom="2rem"/>

              <Flex direction="column" gap="2rem">
                <Button onClick={() => setView('devices')}>Devices</Button>
                <Button onClick={() => setView('smhi')}>SMHI</Button>
              </Flex>
            </Card>
          </Flex>
          </div>
        )}

        {/* ----------- DEVICES VIEW ----------- */}
        {view === 'devices' && (
          <div className="page-conainer">
            <DevicesView onBack={() => setView('menu')} />
          </div>
        )}

        {/* ----------- SMHI VIEW ----------- */}
        {view === 'smhi' && (
          <div className="page-conainer">
            <SmhiView onBack={() => setView('menu')} />
          </div>
        )}

        <Button variation="primary" onClick={signOut} marginTop="2rem" style={{margin: "0 auto"}}>Sign out</Button>
      </Flex>
    </View>
  );
}

/* ============================================================
   DEVICES VIEW
   ============================================================ */
function DevicesView({ onBack }: { onBack: () => void }) {

  const { user } = useAuthenticator();
  const [devices, setDevices] = useState<Array<Schema["Devices"]["type"]>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [telemetryData, setTelemetryData] = useState<Array<Schema["Telemetry"]["type"]>>([]);
  const [timeRange, setTimeRange] = useState<'hour' | 'week' | 'all'>('all');

  useEffect(() => {
    client.models.Devices.observeQuery().subscribe({
      next: (data) => {
        setDevices([...data.items])
      },
    });
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      client.models.Telemetry.list({
        filter: { device_id: { eq: selectedDevice } },
        limit: 10000
      }).then(response => {
        const sortedData = [...response.data].sort((a, b) =>
          (a.timestamp || 0) - (b.timestamp || 0)
        );

        const now = Date.now();
        let filtered = sortedData;

        if (timeRange === 'hour') {
          filtered = sortedData.filter(i => (i.timestamp || 0) >= now - 3600000);
        } else if (timeRange === 'week') {
          filtered = sortedData.filter(i => (i.timestamp || 0) >= now - 7 * 86400000);
        }
        setTelemetryData(filtered);
      });
    }
  }, [selectedDevice, timeRange]);

  function createDevice() {
    const id = String(window.prompt("Device ID"));
    client.models.Devices.create({ device_id: id, owner: user.userId });
  }

  function deleteDevice(device_id: string) {
    client.models.Devices.delete({ device_id });
    if (selectedDevice === device_id) setSelectedDevice(null);
  }

    // Om en device är vald, visa telemetri-vyn
  if (selectedDevice) {
    return (
      <View>
        <Button variation="link" onClick={() => setSelectedDevice(null)} marginBottom="2rem">
          ← Back
        </Button>

        <Card variation="outlined">
          <Heading level={3}>Telemetry – Device {selectedDevice}</Heading>
          <Divider marginTop="1rem" marginBottom="1rem"/>

          {telemetryData.length > 0 ? (
            <TelemetryChart data={telemetryData} />
          ) : (
            <Text>No telemetry available.</Text>
          )}
        </Card>
      </View>
    );
  }

  // Annars visa device-listan
  return (
    <View>
      <Button variation="link" onClick={onBack} marginBottom="1rem">
        ← Back
      </Button>

      <Heading level={2} marginTop="1rem">Devices</Heading>

      <Card variation="outlined" marginTop="1rem" width="100%">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading level={3}>Your Devices</Heading>
          <Button onClick={createDevice}>Add Device</Button>
        </Flex>

        <Divider marginTop="1rem" marginBottom="1rem"/>

        <Collection items={devices} type="list" direction="column" gap="1rem">
          {(item, index) => (
            <Card key={index} variation="outlined">
              <Flex justifyContent="space-between" alignItems="center">
                <Flex direction="column">
                  <Text>
                    <strong>Status:</strong>{" "}
                    <Badge variation={item?.status === "online" ? "success" : "warning"}>
                      {item?.status}
                    </Badge>
                  </Text>
                  <Text><strong>ID:</strong> {item.device_id}</Text>
                </Flex>

                <Flex gap="0.5rem">
                  <Menu
                    trigger={
                      <MenuButton>View Data</MenuButton>
                    }
                  >
                    <MenuItem onClick={() => { 
                      setSelectedDevice(item.device_id); 
                      setTimeRange('hour'); 
                    }}>
                      Last Hour
                    </MenuItem>
                    <MenuItem onClick={() => { 
                      setSelectedDevice(item.device_id); 
                      setTimeRange('week'); 
                    }}>
                      Last Week
                    </MenuItem>
                    <MenuItem onClick={() => { 
                      setSelectedDevice(item.device_id); 
                      setTimeRange('all'); 
                    }}>
                      All Data
                    </MenuItem>
                  </Menu>

                  <Button variation="destructive" onClick={() => deleteDevice(item.device_id)}>
                    Delete
                  </Button>
                </Flex>
              </Flex>
            </Card>
          )}
        </Collection>
      </Card>
    </View>
  );
}

/* ============================================================
   TELEMETRY CHART
   ============================================================ */
function TelemetryChart({ data }: { data: Array<Schema["Telemetry"]["type"]> }) {
  const chartLabels = data.map(item =>
    new Date(item.timestamp || 0).toLocaleString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  );

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: data.map(i => i.temperature),
        borderColor: "rgb(75,192,192)",
        tension: 0.1,
      },
      {
        label: "Humidity (%)",
        data: data.map(i => i.humidity),
        borderColor: "rgb(153,102,255)",
        tension: 0.1,
      },
      {
        label: "Light (%)",
        data: data.map(i => i.light),
        borderColor: "rgba(253, 100, 12, 1)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: "top" as const 
      } 
    }
  };

  return (
    <div style={{ height: "350px" }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}

/* ============================================================
   SMHI VIEW
   ============================================================ */

function WindDirectionCompass({ direction }: { direction: number }) {
  return (
    <div style={{
      width: 120,
      height: 120,
      borderRadius: "50%",
      border: "3px solid #444",
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: "2rem"
    }}>
      {/* Pil */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft: "2px solid transparent",
        borderRight: "2px solid transparent",
        borderBottom: "80px solid red",
        position: "absolute",
        transform: `rotate(${direction}deg)`,
      }} />
      <div style={{ position: "absolute", bottom: 4, fontSize: 12 }}>S</div>
      <div style={{ position: "absolute", top: 4, fontSize: 12 }}>N</div>
      <div style={{ position: "absolute", left: 4, fontSize: 12 }}>W</div>
      <div style={{ position: "absolute", right: 4, fontSize: 12 }}>E</div>
    </div>
  );
}

function SmhiView({ onBack }: { onBack: () => void }) {
  const [stationId, setStationId] = useState('99280');
  const [smhiData, setSmhiData] = useState<Array<Schema["SMHI"]["type"]>>([]);
  const [loading, setLoading] = useState(false);
  const [latestData, setLatestData] = useState<Schema["SMHI"]["type"] | null>(null);

  async function loadSmhiData() {
    if (!stationId) return;
    
    setLoading(true);
    try {
      console.log("Fetching SMHI data for station:", stationId);
      
      const response = await client.models.SMHI.list({
        filter: { device_id: { eq: stationId } },
        limit: 10000
      });

      console.log("Raw response:", response);
      console.log("Data items:", response.data);
      console.log("Number of items:", response.data.length);

      if (response.data.length === 0) {
        alert(`No data found for station ${stationId}. Make sure data has been collected for this station.`);
        setSmhiData([]);
        setLatestData(null);
        setLoading(false);
        return;
      }

      // Konvertera timestamp från string till number om nödvändigt
      const dataWithNumericTimestamp = response.data.map(item => ({
        ...item,
        timestamp: typeof item.timestamp === 'string' 
          ? new Date(item.timestamp).getTime() 
          : item.timestamp
      }));

      const sortedData = [...dataWithNumericTimestamp].sort((a, b) =>
        (a.timestamp || 0) - (b.timestamp || 0)
      );

      let filtered = sortedData;

      console.log("Filtered data:", filtered);
      setSmhiData(filtered);
      
      // Spara senaste mätningen
      if (filtered.length > 0) {
        setLatestData(filtered[filtered.length - 1]);
      }
    } catch (error) {
      console.error("Failed to load SMHI data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Formatera labels för grafer
  const chartLabels = smhiData.map(item =>
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
    datasets: [{
      label: 'Temperature (°C)',
      data: smhiData.map(i => i.temperature),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  };

  // Vind data
  const windData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Wind Speed (m/s)',
        data: smhiData.map(i => i.wind_speed),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1
      },
      {
        label: 'Wind Gust Max (m/s)',
        data: smhiData.map(i => i.wind_gust_max),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };

  // Sikt data
  const visibilityData = {
    labels: chartLabels,
    datasets: [{
      label: 'Visibility (km)',
      data: smhiData.map(i => i.visibility),
      borderColor: 'rgb(255, 206, 86)',
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" as const } },
    scales: { y: { beginAtZero: false } }
  };

  return (
    <View>
      <Button variation="link" onClick={onBack}>← Back</Button>

      <Heading level={2} marginTop="1rem">SMHI Weather Station</Heading>

      <Card variation="outlined" marginTop="1rem" width="100%">
        <Flex direction="column" gap="1rem">
          <Heading level={4}>Station ID (e.g., 99280 for Svenska Högarna)</Heading>
          <TextField 
            label=""
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
          />

          <Flex gap="1rem">

            <Button 
              isDisabled={!stationId} 
              onClick={loadSmhiData}
              isLoading={loading}
            >
              Load Data
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Senaste mätningen - Översikt */}
      {latestData && (
        
        <Card variation="outlined" marginTop="14rem">
          <Heading level={3}>Current Conditions</Heading>
          <Divider marginTop="1rem" marginBottom="1rem"/>
          
          <Flex direction="row" wrap="wrap" gap="2rem">
            <View>
              <Text fontSize="0.9rem" color="gray">Temperature</Text>
              <Heading level={2}>{latestData.temperature?.toFixed(1)}°C</Heading>
            </View>
            
            <View>
              <Text fontSize="0.9rem" color="gray">Wind Speed</Text>
              <Heading level={2}>{latestData.wind_speed?.toFixed(1)} m/s</Heading>
            </View>
            
            <View>
              <Text fontSize="0.9rem" color="gray">Wind Gust</Text>
              <Heading level={2}>{latestData.wind_gust_max?.toFixed(1)} m/s</Heading>
            </View>
            
            <View>
              <Text fontSize="0.9rem" color="gray">Wind Direction</Text>
              <Heading level={2}>{latestData.wind_direction?.toFixed(0)}°</Heading>
            </View>
            
            <View>
              <Text fontSize="0.9rem" color="gray">Visibility</Text>
              <Heading level={2}>{latestData.visibility?.toFixed(0)} km</Heading>
            </View>
          </Flex>

          <Text marginTop="1rem" fontSize="0.8rem" color="gray">
            Last updated: {new Date(latestData.timestamp || 0).toLocaleString('sv-SE')}
          </Text>
        </Card>
      )}

      {/* Grafer */}
      {smhiData.length > 0 && (
        <Card variation="outlined" marginTop="2rem">
          <Flex direction="row" justifyContent="space-between" alignItems="center">
            <Heading level={3}>Weather Trends - Station {stationId}</Heading>
            <Badge size="large">
              {smhiData.length} readings
            </Badge>
          </Flex>
          <Divider marginTop="1rem" marginBottom="1rem"/>

          <Flex direction="row" gap="2rem" wrap="wrap">

          {/* Temperatur */}
          <View style={{ flex: 1, minWidth: "300px" }}>
            <Heading level={5}>Temperature (°C)</Heading>
            <div style={{ height: "260px" }}>
              <Line data={temperatureData} options={chartOptions} />
            </div>
          </View>

           {/* Sikt */}
          <View style={{ flex: 1, minWidth: "300px" }}>
            <Heading level={5}>Visibility (km)</Heading>
            <div style={{ height: "260px" }}>
              <Line data={visibilityData} options={chartOptions} />
            </div>
          </View>
       
          </Flex>

          <Divider marginTop="2rem" marginBottom="1rem"/>

          <Flex direction="row" gap="2rem" alignItems="center" wrap="wrap">

          {/* Vind */}
          <View style={{ flex: 3, minWidth: "400px" }}>
            <Heading level={5}>Wind Speed & Gusts (m/s)</Heading>
            <div style={{ height: "300px" }}>
              <Line data={windData} options={chartOptions} />
            </div>
          </View>

          {/* Vindriktning-kompass */}
          <View style={{ flex: 1 }}>
            {latestData && (
              <>
                <Heading level={5}>Wind Direction</Heading>
                <WindDirectionCompass direction={latestData.wind_direction || 0} />
              </>
            )}
            </View>
          </Flex>
        </Card>
      )}

      {!loading && smhiData.length === 0 && (
        <Card variation="outlined" marginTop="2rem">
          <Text>No data available. Enter a station ID and click "Load Data".</Text>
        </Card>
      )}
    </View>
  );
}