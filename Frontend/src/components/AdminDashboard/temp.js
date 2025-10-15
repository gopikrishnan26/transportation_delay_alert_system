import React, { useState, useEffect } from "react";

function AdminDashboard() {
  const [activeForm, setActiveForm] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");

  const [assignDriverData, setAssignDriverData] = useState({
    routeID: "",
    driverID: ""
  });

  const [addBusStopData, setAddBusStopData] = useState({
    routeID: "",
    stopName: "",
    arrivalTime: "",
    departureTime: ""
  });

  const [changeDriverData, setChangeDriverData] = useState({
    routeID: "",
    newDriverID: ""
  });

  const [modifyBusStopData, setModifyBusStopData] = useState({
    routeID: "",
    stopID: "",
    stopName: "",
    arrivalTime: "",
    departureTime: ""
  });

  const [newRoute, setNewRoute] = useState({
    routeName: "",
    numStops: "",
  });

// ---------- Fetch drivers and routes ----------
  useEffect(() => {
    fetch("http://localhost:5000/drivers")
      .then(res => res.json())
      .then(data => setDrivers(data))
      .catch(err => console.error(err));

    fetch("http://localhost:5000/routes")
      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.error(err));
  }, []);

  // ---------- Fetch bus stops when route selected ----------
  useEffect(() => {
    if (modifyBusStopData.routeID) {
      fetch(`http://localhost:5000/bus-stops/${modifyBusStopData.routeID}`)
        .then(res => res.json())
        .then(data => setBusStops(data))
        .catch(err => console.error(err));
    }
  }, [modifyBusStopData.routeID]);

  // ---------- Assign Driver ----------
  const handleAssignDriver = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/assign-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignDriverData)
    });
    const data = await res.json();
    alert(data.message);
  };

  // ---------- Add Driver ----------
  const handleAddDriver = async (e) => {
    e.preventDefault();

    if (!driverName || !driverMobile) {
      alert("Please fill all driver fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/addDriver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: driverName,
          mobile: driverMobile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Driver added successfully!");
        setDriverName("");
        setDriverMobile("");
        // Refresh driver list
        fetch("http://localhost:5000/drivers")
          .then((res) => res.json())
          .then((data) => setDrivers(data));
      } else {
        alert(`❌ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error adding driver:", err);
      alert("❌ Network or server error");
    }
  };

  // ---------- Add Bus Stop ----------
  const handleAddBusStop = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/add-bus-stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addBusStopData)
    });
    const data = await res.json();
    alert(data.message);
  };

  // ---------- Change Driver ----------
  const handleChangeDriver = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/change-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changeDriverData)
    });
    const data = await res.json();
    alert(data.message);
  };

  // ---------- Remove Bus Stop ----------
  const handleRemoveBusStop = async (stopID) => {
    const res = await fetch(`http://localhost:5000/remove-bus-stop/${stopID}`, {
      method: "DELETE"
    });
    const data = await res.json();
    alert(data.message);
    setModifyBusStopData({ ...modifyBusStopData });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Dashboard</h1>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setActiveForm("assignDriver")}>Assign Driver</button>
        <button onClick={() => setActiveForm("addBusStop")}>Add Bus Stops</button>
        <button onClick={() => setActiveForm("changeDriver")}>Change Driver</button>
        <button onClick={() => setActiveForm("modifyBusStop")}>Modify Bus Stops</button>
        <button onClick={() => setActiveForm("addDriver")}>Add Driver</button>
        <button onClick={() => setActiveForm("addRoute")}>Add Route</button>
      </div>

      {/* ---------------- Assign Driver Form ---------------- */}
      {activeForm === "assignDriver" && (
        <form onSubmit={handleAssignDriver} style={{ marginBottom: "2rem" }}>
          <h3>Assign Driver to Route</h3>
          <select
            required
            value={assignDriverData.routeID}
            onChange={e => setAssignDriverData({ ...assignDriverData, routeID: e.target.value })}
            style={{ backgroundColor: "#fff", color: "#000", padding: "5px", borderRadius: "5px" }}
          >
            <option value="">Select Route</option>
            {routes.map(r => (
              <option key={r.routeID} value={r.routeID}>{r.routeName}</option>
            ))}
          </select>

          <select
            required
            value={assignDriverData.driverID}
            onChange={e => setAssignDriverData({ ...assignDriverData, driverID: e.target.value })}
            style={{ backgroundColor: "#dde7ddff", color: "#000", padding: "5px", borderRadius: "5px" }}
          >
            <option value="">Select Driver</option>
            {drivers.map(d => (
              <option key={d.userID} value={d.userID}>{d.mobileNo}</option>
            ))}
          </select>

          <button type="submit">Assign</button>
        </form>
      )}

      {/* ---------------- Add Driver Form ---------------- */}
      {activeForm === "addDriver" && (
        <form onSubmit={handleAddDriver} style={{ marginBottom: "2rem" }}>
          <h3>Add Driver</h3>
          <input
            type="text"
            placeholder="Driver Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Mobile Number"
            value={driverMobile}
            onChange={(e) => setDriverMobile(e.target.value)}
            required
          />
          <button type="submit">Add Driver</button>
        </form>
      )}

      {/* ---------------- Add Bus Stops Form ---------------- */}
      {activeForm === "addBusStop" && (
        <form onSubmit={handleAddBusStop} style={{ marginBottom: "2rem" }}>
          <h3>Add Bus Stop</h3>
          <select
            required
            value={addBusStopData.routeID}
            onChange={e => setAddBusStopData({ ...addBusStopData, routeID: e.target.value })}
          >
            <option value="">Select Route</option>
            {routes.map(r => (
              <option key={r.routeID} value={r.routeID}>{r.routeName}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Stop Name"
            required
            value={addBusStopData.stopName}
            onChange={e => setAddBusStopData({ ...addBusStopData, stopName: e.target.value })}
          />

          <input
            type="time"
            required
            value={addBusStopData.arrivalTime}
            onChange={e => setAddBusStopData({ ...addBusStopData, arrivalTime: e.target.value })}
          />

          <input
            type="time"
            value={addBusStopData.departureTime}
            onChange={e => setAddBusStopData({ ...addBusStopData, departureTime: e.target.value })}
          />

          <button type="submit">Add Stop</button>
        </form>
      )}

      {/* ---------------- Change Driver Form ---------------- */}
      {activeForm === "changeDriver" && (
        <form onSubmit={handleChangeDriver} style={{ marginBottom: "2rem" }}>
          <h3>Change Driver for Route</h3>
          <select
            required
            value={changeDriverData.routeID}
            onChange={e => setChangeDriverData({ ...changeDriverData, routeID: e.target.value })}
          >
            <option value="">Select Route</option>
            {routes.map(r => (
              <option key={r.routeID} value={r.routeID}>{r.routeName}</option>
            ))}
          </select>

          <select
            required
            value={changeDriverData.newDriverID}
            onChange={e => setChangeDriverData({ ...changeDriverData, newDriverID: e.target.value })}
          >
            <option value="">Select New Driver</option>
            {drivers.map(d => (
              <option key={d.userID} value={d.userID}>{d.email}</option>
            ))}
          </select>

          <button type="submit">Change Driver</button>
        </form>
      )}

      {/* ---------------- Modify Bus Stops Form ---------------- */}
      {activeForm === "modifyBusStop" && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>Modify Bus Stops</h3>
          <select
            value={modifyBusStopData.routeID}
            onChange={e => setModifyBusStopData({ ...modifyBusStopData, routeID: e.target.value })}
          >
            <option value="">Select Route</option>
            {routes.map(r => (
              <option key={r.routeID} value={r.routeID}>{r.routeName}</option>
            ))}
          </select>

          <ul>
            {busStops.map(stop => (
              <li key={stop.stopID}>
                {stop.stopName} - {stop.arrivalTime}{" "}
                <button onClick={() => handleRemoveBusStop(stop.stopID)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------- Add Route Form ---------------- */}
        {activeForm === "addRoute" && (
        <form onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("http://localhost:5000/add-route", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                routeName: newRoute.routeName,
                numStops: newRoute.numStops,
                }),
            });
            const data = await res.json();
            alert(data.message);
            // Refresh routes
            fetch("http://localhost:5000/routes")
                .then((res) => res.json())
                .then((data) => setRoutes(data));
            setNewRoute({ routeName: "", numStops: "" });
        }}
        style={{ marginBottom: "2rem" }}
        >
            <h3>Add New Route</h3>
            <input
                type="text"
                placeholder="Route Name"
                required
                value={newRoute.routeName}
                onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })}
            />
            <input
                type="number"
                placeholder="Number of Bus Stops"
                min="0"
                value={newRoute.numStops}
                onChange={(e) => setNewRoute({ ...newRoute, numStops: e.target.value })}
            />
            <button type="submit">Add Route</button>
        </form>
        )}
    </div>
  );
}

export default AdminDashboard;