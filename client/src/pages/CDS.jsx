import React, { useEffect, useState } from "react";
import AnalyticsCard from "../components/AnalyticsCard";
import GraphSection from "../components/Graph1";
import { useParams, useNavigate } from "react-router-dom";

const CARD_WIDTH = 500;
const CARD_HEIGHT = 340;

const ClientDetails = () => {
  const { clientId, category } = useParams();
  const [history, setHistory] = useState([]);
  const [selectedCard, setSelectedCard] = useState(0);
  const [clients, setClients] = useState([]);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const navigate = useNavigate();

  function formatIsoKeyLabel(key) {
    if (!key) return "";
    const k = Number(key);
    const year = Math.floor(k / 100);
    const week = k % 100;
    return `${year}-W${String(week).padStart(2, "0")}`;
  }

  // Fetch all clients for the category
  useEffect(() => {
    async function fetchClients() {
      // get latest ISO week for category then fetch clients
      try {
        const weeksRes = await fetch(
          `/api/clients/available-weeks?category=${category}`
        );
        const weeks = await weeksRes.json();
        setAvailableWeeks(weeks || []);
        const latest =
          Array.isArray(weeks) && weeks.length > 0
            ? weeks[weeks.length - 1]
            : null;
        const res = await fetch(
          `/api/clients/client-level-cards?category=${category}&week=${latest}`
        );
        const data = await res.json();
        setClients(Array.isArray(data) ? data.map((d) => d.client) : []);
      } catch (err) {
        setClients([]);
      }
    }
    if (category) fetchClients();
  }, [category]);

  // Fetch metric history for the selected client
  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch(
        `/api/clients/client-metric-history?clientId=${clientId}&category=${category}`
      );
      const data = await res.json();
      setHistory(data);
    }
    fetchHistory();
  }, [clientId, category]);

  if (history.length === 0) {
    return <div className="text-gray-400">Loading client data...</div>;
  }

  const metricsFields =
    category === "LEADS"
      ? ["bb", "cpm", "ctra", "ctrl", "leads", "cpl"]
      : ["bb", "cpm", "ctra", "ctrl", "catc", "cgb", "cpa", "roas", "aov"];

  // Helper for percent change
  function formatPercentChange(current, previous) {
    if (current == null || previous == null) return "N/A";
    if (previous === 0) {
      if (current === 0) return "0%";
      if (current > 0) return "New";
    }
    const rawChange = ((current - previous) / Math.abs(previous)) * 100;
    if (isNaN(rawChange)) return "N/A";
    const rounded = Math.round(rawChange);
    return (rounded > 0 ? "+" : "") + rounded + "%";
  }

  // Build cardsData with percent change
  const cardsData = history.map((weekObj, idx) => {
    const prevWeekObj = history[idx + 1];
    const metrics = metricsFields.reduce((acc, key) => {
      const currentValue = weekObj[key];
      const previousValue = prevWeekObj ? prevWeekObj[key] : null;
      acc[key] = {
        value: currentValue,
        change: formatPercentChange(currentValue, previousValue),
      };
      return acc;
    }, {});
    return {
      id: idx,
      title: `Week ${weekObj.week}`,
      metrics,
      summary: weekObj.summary,
      summaryStatus: weekObj.summaryStatus,
    };
  });

  const graphData = metricsFields.map((key) => ({
    name: key.toUpperCase(),
    data: history.slice().reverse().map((weekObj) => Number(weekObj[key]) || 0),
  }));

  // Handler for client selection
  function handleClientChange(e) {
    const selectedId = e.target.value;
    if (selectedId && selectedId !== clientId) {
      navigate(`/client/${selectedId}/${category}`);
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-[#0b0b0f]">
      <div className="w-full px-2">
        {/* Client selection dropdown */}
        <div className="mb-6 flex gap-4 items-center">
          <span className="font-bold text-lg">Select Client:</span>
          <select
            value={clientId}
            onChange={handleClientChange}
            className="bg-[#1a1d24] text-white px-3 py-2 rounded min-w-[200px]"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.AdAccountName}
              </option>
            ))}
          </select>
        </div>
        {/* Optional: show selected week label */}
        <div className="mb-4">
          Week:{" "}
          {availableWeeks.length
            ? formatIsoKeyLabel(
                availableWeeks[availableWeeks.length - 1]
              )
            : "N/A"}
        </div>
        {/* Sleek grid layout: left = card, right = graphs */}
        <div
          className="grid gap-8 w-full"
          style={{
            gridTemplateColumns: `${CARD_WIDTH}px 1fr`,
          }}
        >
          <div className="flex flex-col gap-6 w-full">
            {cardsData.map((card, idx) => (
              <div
                key={card.id}
                // Remove ring-2 and ring-[#d4ac68] for selected card
                className="transition-all duration-200"
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  background: "transparent",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedCard(idx)}
              >
                <AnalyticsCard
                  title={card.title}
                  metrics={card.metrics}
                  summary={card.summary}
                  category={category}
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-8 w-full">
            <GraphSection
              metrics={metricsFields.map((k) => k.toUpperCase())}
              graphData={graphData}
              height={CARD_HEIGHT}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;