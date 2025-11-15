import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../utils/api";

function SubscriberDashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [routeName, setRouteName] = useState("");
  const [stopName, setStopName] = useState("");
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const userID = localStorage.getItem("userID");
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetch(`${API_BASE}/routes`)
      .then((r) => r.json())
      .then(setRoutes)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const selected = routes.find((r) => r.routeName === routeName);
    if (selected) {
      fetch(`${API_BASE}/bus-stops/${selected.routeID}`)
        .then((r) => r.json())
        .then(setStops)
        .catch(console.error);
    } else {
      setStops([]);
    }
  }, [routeName, routes]);

  // AUTO-LOAD profile + subscription for logged-in user
  useEffect(() => {
    const loadProfile = async () => {
      if (!userID) {
        setStatusMsg("Not logged in");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/subscriber/${userID}`);
        if (!res.ok) {
          setStatusMsg("Failed to load profile");
          return;
        }
        const data = await res.json();
        setUsername(data.username || "");
        setMobileNo(data.mobileNo || "");
        setRouteName(data.routeName || "");
        setStopName(data.stopName || "");
        setStatusMsg("");
      } catch (e) {
        console.error(e);
        setStatusMsg("Failed to load profile");
      }
    };
    loadProfile();
  }, [userID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userID) {
      setStatusMsg("Not logged in");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: parseInt(userID, 10), mobileNo, routeName, stopName })
      });
      const data = await res.json();
      setStatusMsg(data.message || "Saved");
      if (res.ok) setIsEditing(false);
    } catch (e) {
      console.error(e);
      setStatusMsg("Failed to save");
    }
  };

  const handleReportLate = async () => {
    if (!routeName || !stopName || !mobileNo) { setStatusMsg("Fill route, stop and mobile"); return; }
    try {
      const res = await fetch(`${API_BASE}/report-late`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeName, stopName, mobileNo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Report failed");
      setStatusMsg(`Reported. Reason: ${data.reason}. Affected stops: ${data.affectedStops.join(", ")}`);
    } catch (e) { console.error(e); setStatusMsg("Failed to report late"); }
  };

  return (
    <div style={{ padding: "0", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        backgroundColor: "#0d47a1",
        color: "#fff"
      }}>
        <div style={{ fontWeight: 600 }}>Subscriber Dashboard</div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "#1976d2", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: 4, cursor: "pointer" }}
          >
            Home
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1rem", flex: 1 }}>
        <h2 style={{ marginTop: 0 }}>Subscribe for Delay Alerts</h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}>
          {/* Name: readonly - must not be changed */}
          <input value={username} placeholder="Name" readOnly />

          {/* Mobile: editable when isEditing true */}
          <input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="Mobile Number" required disabled={!isEditing} />

          <select value={routeName} onChange={(e) => setRouteName(e.target.value)} required disabled={!isEditing}>
            <option value="">{/* Leave blank display if no route */}Select Route</option>
            {routes.map(r => (
              <option key={r.routeID} value={r.routeName}>{r.routeName}</option>
            ))}
          </select>

          <select value={stopName} onChange={(e) => setStopName(e.target.value)} required disabled={!isEditing}>
            <option value="">{/* Leave blank display if no stop */}Select Stop</option>
            {stops.map(s => (
              <option key={s.stopID} value={s.stopName}>{s.stopName}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={() => setIsEditing(true)} style={{ background: "#0288d1", color: "#fff", border: "none", padding: "0.5rem 0.9rem", borderRadius: 4, cursor: "pointer" }}>
              Edit
            </button>

            <button type="submit" disabled={!isEditing} style={{ background: isEditing ? "#2e7d32" : "#9e9e9e", color: "#fff", border: "none", padding: "0.5rem 0.9rem", borderRadius: 4, cursor: isEditing ? "pointer" : "not-allowed" }}>
              Save
            </button>

            <button type="button" onClick={handleReportLate} style={{ background: "#f57c00", color: "#fff", border: "none", padding: "0.5rem 0.9rem", borderRadius: 4, cursor: "pointer" }}>
              Report Late
            </button>
          </div>
        </form>

        {statusMsg && <p style={{ marginTop: "1rem" }}>{statusMsg}</p>}
      </div>
    </div>
  );
}

export default SubscriberDashboard;