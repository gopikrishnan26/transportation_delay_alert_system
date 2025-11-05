import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../utils/api";

function SubscriberDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [routeName, setRouteName] = useState("");
  const [stopName, setStopName] = useState("");
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/routes`).then(r => r.json()).then(setRoutes).catch(console.error);
  }, []);

  useEffect(() => {
    const selected = routes.find(r => r.routeName === routeName);
    if (selected) {
      fetch(`${API_BASE}/bus-stops/${selected.routeID}`).then(r => r.json()).then(setStops).catch(console.error);
    } else {
      setStops([]);
    }
  }, [routeName, routes]);

  const handleLoadExisting = async () => {
    if (!mobileNo) return;
    try {
      const res = await fetch(`${API_BASE}/subscribers/${mobileNo}`);
      if (!res.ok) { setStatusMsg("No existing subscription found"); return; }
      const data = await res.json();
      setName(data.name || "");
      setRouteName(data.routeName || "");
      setStopName(data.stopName || "");
      setStatusMsg("Loaded your existing subscription");
    } catch (e) { console.error(e); setStatusMsg("Failed to load subscription"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, routeName, stopName, mobileNo })
      });
      const data = await res.json();
      setStatusMsg(data.message || "Saved");
    } catch (e) { console.error(e); setStatusMsg("Failed to save"); }
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
      {/* Navbar (same style as driver) */}
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
          <input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="Mobile Number" required />

          <select value={routeName} onChange={(e) => setRouteName(e.target.value)} required>
            <option value="">Select Route</option>
            {routes.map(r => (
              <option key={r.routeID} value={r.routeName}>{r.routeName}</option>
            ))}
          </select>

          <select value={stopName} onChange={(e) => setStopName(e.target.value)} required>
            <option value="">Select Stop</option>
            {stops.map(s => (
              <option key={s.stopID} value={s.stopName}>{s.stopName}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" style={{ background: "#2e7d32", color: "#fff", border: "none", padding: "0.5rem 0.9rem", borderRadius: 4, cursor: "pointer" }}>Save</button>
            <button type="button" onClick={handleLoadExisting} style={{ background: "#616161", color: "#fff", border: "none", padding: "0.5rem 0.9rem", borderRadius: 4, cursor: "pointer" }}>Load Existing</button>
            <button type="button" onClick={handleReportLate} style={{ background: "#f57c00", color: "#fff", border: "none", padding: "0.5rem 0.9rem", borderRadius: 4, cursor: "pointer" }}>Report Late</button>
          </div>
        </form>

        {statusMsg && <p style={{ marginTop: "1rem" }}>{statusMsg}</p>}
      </div>
    </div>
  );
}

export default SubscriberDashboard;


