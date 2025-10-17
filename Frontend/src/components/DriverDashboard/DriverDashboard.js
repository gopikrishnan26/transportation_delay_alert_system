import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DriverDashboard() {
  const navigate = useNavigate();
  const [routeName, setRouteName] = useState("");
  const [busStops, setBusStops] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");

  const driverID = localStorage.getItem("userId"); // get driverID from login
  const driverRole = localStorage.getItem("userRole");

  useEffect(() => {
    // Redirect to login if not a driver
    if (!driverID || driverRole !== "driver") {
      navigate("/login");
      return;
    }

    // Fetch route + bus stops assigned to this driver
    const fetchRoute = async () => {
      try {
        const res = await fetch(`https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/driver-route/${driverID}`);
        if (!res.ok) throw new Error("No route assigned");
        const data = await res.json();
        setRouteName(data.routeName);
        setBusStops(data.busStops);
      } catch (err) {
        console.error(err);
        alert("Error fetching route data. Please contact admin.");
      }
    };

    fetchRoute();
  }, [driverID, driverRole, navigate]);

  const calculateDelay = (stopName) => {
    const delayMinutes = Math.floor(Math.random() * 10) + 1; // simulate delay
    let message;

    if (delayMinutes > 5) {
      message = `[Simulated GenAI] Bus delayed by ${delayMinutes} mins near ${stopName}. Possible traffic congestion.`;
    } else {
      message = `✅ Bus is on time at ${stopName}.`;
    }

    setAlertMessage(message);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🚍 Driver Dashboard</h1>
      <h2>Welcome, {driverID}</h2>
      <h3>Route: {routeName}</h3>

      <div id="stopsSection">
        <h3>Your Route Stops</h3>
        {busStops.length > 0 ? (
          busStops.map((stop, idx) => (
            <button
              key={idx}
              onClick={() => calculateDelay(stop.stopName)}
              style={{ marginRight: "10px", marginBottom: "5px" }}
            >
              {stop.stopName} ({stop.arrivalTime})
            </button>
          ))
        ) : (
          <p>No bus stops assigned yet.</p>
        )}
      </div>

      {alertMessage && (
        <div id="alertSection" style={{ marginTop: "1rem", color: "red" }}>
          <h3>📢 Delay Alert Message:</h3>
          <p>{alertMessage}</p>
        </div>
      )}

      <button
        onClick={handleLogout}
        style={{ marginTop: "2rem", backgroundColor: "red", color: "#fff", padding: "0.5rem 1rem", border: "none", borderRadius: "5px" }}
      >
        Logout
      </button>
    </div>
  );
}

export default DriverDashboard;