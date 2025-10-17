import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [activeForm, setActiveForm] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busStops, setBusStops] = useState([]);

  const [addDriverData, setAddDriverData] = useState({
    driverName: "",
    mobileNo: "",
  });

  const [assignDriverData, setAssignDriverData] = useState({
    routeID: "",
    driverID: "",
  });

  const [addBusStopData, setAddBusStopData] = useState({
    routeID: "",
    stopName: "",
    arrivalTime: "",
    departureTime: "",
  });

  const [changeDriverData, setChangeDriverData] = useState({
    routeID: "",
    newDriverID: "",
  });

  const [modifyBusStopData, setModifyBusStopData] = useState({
    routeID: "",
    stopID: "",
    stopName: "",
    arrivalTime: "",
    departureTime: "",
  });

  const [newRoute, setNewRoute] = useState({
    routeName: "",
    numStops: "",
  });

  useEffect(() => {
    fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/drivers")
      .then((res) => res.json())
      .then((data) => setDrivers(data))
      .catch((err) => console.error(err));

    fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/routes")
      .then((res) => res.json())
      .then((data) => setRoutes(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (modifyBusStopData.routeID) {
      fetch(`https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/bus-stops/${modifyBusStopData.routeID}`)
        .then((res) => res.json())
        .then((data) => setBusStops(data))
        .catch((err) => console.error(err));
    }
  }, [modifyBusStopData.routeID]);

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    const res = await fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/assign-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignDriverData),
    });
    const data = await res.json();
    alert(data.message);
  };

  const handleAddBusStop = async (e) => {
    e.preventDefault();
    const res = await fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/add-bus-stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addBusStopData),
    });
    const data = await res.json();
    alert(data.message);
  };

  const handleChangeDriver = async (e) => {
    e.preventDefault();
    const res = await fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/change-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changeDriverData),
    });
    const data = await res.json();
    alert(data.message);
  };

  const handleRemoveBusStop = async (stopID) => {
    const res = await fetch(`https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/remove-bus-stop/${stopID}`, {
      method: "DELETE",
    });
    const data = await res.json();
    alert(data.message);
    setModifyBusStopData({ ...modifyBusStopData });
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    const res = await fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/addDriver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addDriverData),
    });
    const data = await res.json();
    alert(data.message);
    
  }

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      <div className="button-group">
        <button onClick={() => setActiveForm("assignDriver")}>Assign Driver</button>
        <button onClick={() => setActiveForm("addBusStop")}>Add Bus Stop</button>
        <button onClick={() => setActiveForm("changeDriver")}>Change Driver</button>
        <button onClick={() => setActiveForm("modifyBusStop")}>Modify Bus Stops</button>
        <button onClick={() => setActiveForm("addRoute")}>Add Route</button>
        <button onClick={() => setActiveForm("addDriver")}>Add Driver</button>
      </div>

      <div className="form-container">
        {/* Assign Driver */}
        {activeForm === "assignDriver" && (
          <form onSubmit={handleAssignDriver} className="dashboard-form">
            <h3>Assign Driver to Route</h3>
            <select
              required
              value={assignDriverData.routeID}
              onChange={(e) =>
                setAssignDriverData({ ...assignDriverData, routeID: e.target.value })
              }
            >
              <option value="">Select Route</option>
              {routes.map((r) => (
                <option key={r.routeID} value={r.routeID}>
                  {r.routeName}
                </option>
              ))}
            </select>

            <select
              required
              value={assignDriverData.driverID}
              onChange={(e) =>
                setAssignDriverData({ ...assignDriverData, driverID: e.target.value })
              }
            >
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d.userID} value={d.userID}>
                  {d.mobileNo}
                </option>
              ))}
            </select>

            <button type="submit">Assign</button>
          </form>
        )}

        {/* Add Bus Stop */}
        {activeForm === "addBusStop" && (
          <form onSubmit={handleAddBusStop} className="dashboard-form">
            <h3>Add Bus Stop</h3>
            <select
              required
              value={addBusStopData.routeID}
              onChange={(e) =>
                setAddBusStopData({ ...addBusStopData, routeID: e.target.value })
              }
            >
              <option value="">Select Route</option>
              {routes.map((r) => (
                <option key={r.routeID} value={r.routeID}>
                  {r.routeName}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Stop Name"
              required
              value={addBusStopData.stopName}
              onChange={(e) =>
                setAddBusStopData({ ...addBusStopData, stopName: e.target.value })
              }
            />

            <input
              type="time"
              required
              value={addBusStopData.arrivalTime}
              onChange={(e) =>
                setAddBusStopData({ ...addBusStopData, arrivalTime: e.target.value })
              }
            />

            <input
              type="time"
              value={addBusStopData.departureTime}
              onChange={(e) =>
                setAddBusStopData({ ...addBusStopData, departureTime: e.target.value })
              }
            />

            <button type="submit">Add Stop</button>
          </form>
        )}

        {/* Change Driver */}
        {activeForm === "changeDriver" && (
          <form onSubmit={handleChangeDriver} className="dashboard-form">
            <h3>Change Driver</h3>
            <select
              required
              value={changeDriverData.routeID}
              onChange={(e) =>
                setChangeDriverData({ ...changeDriverData, routeID: e.target.value })
              }
            >
              <option value="">Select Route</option>
              {routes.map((r) => (
                <option key={r.routeID} value={r.routeID}>
                  {r.routeName}
                </option>
              ))}
            </select>

            <select
              required
              value={changeDriverData.newDriverID}
              onChange={(e) =>
                setChangeDriverData({ ...changeDriverData, newDriverID: e.target.value })
              }
            >
              <option value="">Select New Driver</option>
              {drivers.map((d) => (
                <option key={d.userID} value={d.userID}>
                  {d.email}
                </option>
              ))}
            </select>

            <button type="submit">Change</button>
          </form>
        )}

        {/* Modify Bus Stops */}
        {activeForm === "modifyBusStop" && (
          <div className="dashboard-form">
            <h3>Modify Bus Stops</h3>
            <select
              value={modifyBusStopData.routeID}
              onChange={(e) =>
                setModifyBusStopData({ ...modifyBusStopData, routeID: e.target.value })
              }
            >
              <option value="">Select Route</option>
              {routes.map((r) => (
                <option key={r.routeID} value={r.routeID}>
                  {r.routeName}
                </option>
              ))}
            </select>

            <ul className="bus-stop-list">
              {busStops.map((stop) => (
                <li key={stop.stopID}>
                  <span>
                    {stop.stopName} — {stop.arrivalTime}
                  </span>
                  <button onClick={() => handleRemoveBusStop(stop.stopID)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add Route */}
        {activeForm === "addRoute" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/add-route", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRoute),
              });
              const data = await res.json();
              alert(data.message);
              fetch("https:transportationdelayalertapp-dhhpdnakdsg6cgdh.centralindia-01.azurewebsites.net/routes")
                .then((res) => res.json())
                .then((data) => setRoutes(data));
              setNewRoute({ routeName: "", numStops: "" });
            }}
            className="dashboard-form"
          >
            <h3>Add New Route</h3>
            <input
              type="text"
              placeholder="Route Name"
              required
              value={newRoute.routeName}
              onChange={(e) =>
                setNewRoute({ ...newRoute, routeName: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Number of Stops"
              min="0"
              value={newRoute.numStops}
              onChange={(e) =>
                setNewRoute({ ...newRoute, numStops: e.target.value })
              }
            />
            <button type="submit">Add Route</button>
          </form>
        )}

        {/* Add Driver Form */}
        {activeForm === "addDriver" && (
          <form onSubmit={handleAddDriver}>
            <h2>Add Driver</h2>
            <input
              type="text"
              placeholder="Driver Name"
              value={addDriverData.driverName}
              onChange={(e) => setAddDriverData({ ...addDriverData, driverName: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={addDriverData.mobileNo}
              onChange={(e) => setAddDriverData({ ...addDriverData, mobileNo: e.target.value})}
              required
            />
            <button type="submit">Add Driver</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;