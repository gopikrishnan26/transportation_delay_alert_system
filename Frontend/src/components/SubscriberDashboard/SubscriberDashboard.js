import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../utils/api";
import "./SubscriberDashboard.css"; // ← Import external CSS

function SubscriberDashboard() {
  const navigate = useNavigate();
  const [mobileNo, setMobileNo] = useState("");
  const [name, setName] = useState("");
  const [routeName, setRouteName] = useState("");
  const [stopName, setStopName] = useState("");

  const [originalMobile, setOriginalMobile] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [originalRoute, setOriginalRoute] = useState("");
  const [originalStop, setOriginalStop] = useState("");

  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const userID = localStorage.getItem("userID");

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

  useEffect(() => {
    const loadProfile = async () => {
      if (!userID) return;

      try {
        const res = await fetch(`${API_BASE}/subscriber/${userID}`);
        const data = await res.json();

        setMobileNo(data.mobileNo || "");
        setName(data.name || data.username || data.fullName || "");
        setRouteName(data.routeName || "");
        setStopName(data.stopName || "");

        // Save original values
        setOriginalMobile(data.mobileNo || "");
        setOriginalName(data.name || data.username || data.fullName || "");
        setOriginalRoute(data.routeName || "");
        setOriginalStop(data.stopName || "");

      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, [userID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;

    try {
      const res = await fetch(`${API_BASE}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: parseInt(userID, 10),
          mobileNo,
          routeName,
          stopName
        })
      });

      const data = await res.json();
      setStatusMsg(data.message);

      // Save new original values
      setOriginalMobile(mobileNo);
      setOriginalName(name);
      setOriginalRoute(routeName);
      setOriginalStop(stopName);

      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setMobileNo(originalMobile);
    setName(originalName);
    setRouteName(originalRoute);
    setStopName(originalStop);
    setIsEditing(false);
  };

  return (
    <div className="sd-container">
      <div className="sd-navbar">
        <div className="title">Subscriber Dashboard</div>
        <button className="btn-nav" onClick={() => navigate("/")}>
          Home
        </button>
      </div>

      <div className="sd-content">
        <h2>Subscribe for Delay Alerts</h2>

        <form onSubmit={handleSubmit} className="sd-form">
          <label className="input-label">Mobile Number</label>
          <input value={mobileNo} readOnly className="input-field" />

          <label className="input-label">Name</label>
          <input value={name} readOnly className="input-field" />

          <label className="input-label">Route Name</label>
          <select
            value={routeName}
            className="input-field"
            onChange={(e) => setRouteName(e.target.value)}
            disabled={!isEditing}
            required
          >
            <option value="">Select Route</option>
            {routes.map((r) => (
              <option key={r.routeID} value={r.routeName}>
                {r.routeName}
              </option>
            ))}
          </select>

          <label className="input-label">Stop Name</label>
          <select
            value={stopName}
            className="input-field"
            onChange={(e) => setStopName(e.target.value)}
            disabled={!isEditing}
            required
          >
            <option value="">Select Stop</option>
            {stops.map((s) => (
              <option key={s.stopID} value={s.stopName}>
                {s.stopName}
              </option>
            ))}
          </select>

          <div className="button-row">
            <button
              type="button"
              className={`btn edit-btn ${isEditing ? "disabled" : ""}`}
              onClick={() => setIsEditing(true)}
              disabled={isEditing}
            >
              Edit
            </button>

            <button
              type="submit"
              className={`btn save-btn ${!isEditing ? "disabled" : ""}`}
              disabled={!isEditing}
            >
              Save
            </button>

            {isEditing && (
              <button
                type="button"
                className="btn cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {statusMsg && <p className="status-msg">{statusMsg}</p>}
      </div>
    </div>
  );
}

export default SubscriberDashboard;