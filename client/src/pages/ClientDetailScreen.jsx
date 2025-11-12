import AnalyticsCard from '../components/AnalyticsCard'
import GraphSection from '../components/Graph'

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const ClientDetails = () => {
  const { clientId, category } = useParams();
  const [history, setHistory] = useState([]);
  const [selectedCard, setSelectedCard] = useState(0);
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  // Helper to format numeric ISO key (YYYYWW -> "YYYY-WW")
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
      const res = await fetch(`/api/clients/client-level-cards?category=${category}&week=1`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data.map(d => d.client) : []);
    }
    fetchClients();
  }, [category]);

  // Fetch metric history for the selected client
  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch(`/api/clients/client-metric-history?clientId=${clientId}&category=${category}`);
      const data = await res.json();
      setHistory(data);
    }
    fetchHistory();
  }, [clientId, category]);

  if (history.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-400 text-center">Loading client data...</div>
      </div>
    );
  }

  const metricsFields = category === "LEADS"
    ? ["bb", "cpm", "ctra", "ctrl", "leads", "cpl"]
    : ["bb", "cpm", "ctra", "ctrl", "catc", "cgb", "cpa", "roas", "aov"];

  // --- ISO helpers (client-side, if you want to match week logic) ---
  function getISOPrevKey(key) {
    const year = Math.floor(key / 100);
    const week = key % 100;
    if (week > 1) return year * 100 + (week - 1);
    // previous year's last ISO week
    const dec31 = new Date(Date.UTC(year - 1, 11, 31));
    const d = new Date(Date.UTC(dec31.getUTCFullYear(), dec31.getUTCMonth(), dec31.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() * 100 + weekNo;
  }

  // --- Format percent change (copied from backend) ---
  function formatPercentChange(current, previous) {
    if (current == null && previous == null) return "N/A";

    // Case: new client (only one week of data)
    if (previous == null || previous === 0) {
      if (!current || current === 0) return "0%";
      return `+${Math.round(current * 100)}%`; // absolute increase from 0
    }

    const rawChange = ((current - previous) / Math.abs(previous)) * 100;
    if (isNaN(rawChange)) return "N/A";

    const rounded = Math.round(rawChange);

    // Show the real value if between -15% and +15%
    if (rounded >= -15 && rounded <= 15) {
      return (rounded > 0 ? "+" : "") + rounded + "%";
    }

    return (rounded > 0 ? "+" : "") + rounded + "%";
  }

  // --- Build metrics for each week like getMetricWithChange ---
  function buildMetricsWithChange(history, metricsFields) {
    return history.map((weekObj, idx) => {
      // Find previous week by ISO key (not just idx+1, but this is fine if history is sorted desc)
      const prevWeekObj = history[idx + 1];
      const metrics = metricsFields.reduce((acc, field) => {
        const currentValue = weekObj ? weekObj[field] : null;
        const previousValue = prevWeekObj ? prevWeekObj[field] : null;
        if (field === 'bb' || field === 'leads') {
          acc[field] = {
            value: currentValue,
            change: null
          };
        } else {
          acc[field] = {
            value: currentValue,
            change: formatPercentChange(currentValue, previousValue)
          };
        }
        return acc;
      }, {});
      return {
        id: idx,
        title: formatIsoKeyLabel(weekObj.week),
        metrics,
        summary: weekObj.summary,
        summaryStatus: weekObj.summaryStatus
      };
    });
  }

  // Use the new function to build cardsData
  const cardsData = buildMetricsWithChange(history, metricsFields);

  const graphData = metricsFields.map(key => ({
    name: key.toUpperCase(),
    data: history.slice().reverse().map(weekObj => {
      const metric = weekObj[key];
      return {
        week: weekObj.week,
        value: metric && typeof metric === "object" ? Number(metric.value) || 0 : Number(metric) || 0
      };
    })
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
      <div className="w-full px-0 sm:px-0 lg:px-0 py-4">
        {/* Client selection dropdown */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
          <span className="font-bold text-base sm:text-lg">Select Client:</span>
          <select
            value={clientId}
            onChange={handleClientChange}
            className="bg-[#1a1d24] text-white px-3 py-2 rounded text-sm sm:text-base w-full sm:w-auto sm:min-w-[200px]"
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.AdAccountName}
              </option>
            ))}
          </select>
        </div>

        {/* Responsive layout: graphs first on mobile/tablet, side-by-side on desktop */}
        <div className="flex flex-col lg:grid lg:gap-8 w-full" 
             style={{ 
               gridTemplateColumns: 'clamp(400px, 35vw, 500px) 1fr' 
             }}>
          
          {/* Graphs Section - Shows first on mobile/tablet */}
          <div className="w-full order-1 lg:order-2 mb-6 lg:mb-0">
            <div className="block lg:hidden">
              {/* Mobile: Show individual metric graphs */}
              <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-4 sm:gap-6">
                {metricsFields.map((field, idx) => {
                  const singleGraphData = [{
                    name: field.toUpperCase(),
                    data: history.slice().reverse().map(weekObj => {
                      const metric = weekObj[field];
                      return {
                        week: weekObj.week,
                        value: metric && typeof metric === "object" ? Number(metric.value) || 0 : Number(metric) || 0
                      };
                    })
                  }];
                  
                  return (
                    <div key={field} className="w-full">
                      <GraphSection
                        metrics={[field.toUpperCase()]}
                        graphData={singleGraphData}
                        height={280}
                        columnsPerRow={1}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="hidden lg:block">
              {/* Desktop: Show all graphs together */}
              <GraphSection
                metrics={metricsFields.map((k) => k.toUpperCase())}
                graphData={graphData}
                height={340}
              />
            </div>
          </div>

          {/* Cards Section - Shows after graphs on mobile/tablet */}
          <div className="flex flex-col gap-4 sm:gap-6 w-full order-2 lg:order-1">
            {cardsData.map((card, idx) => (
              <div
                key={card.id}
                className="transition-all duration-200 w-full"
                style={{
                  background: "transparent",
                  cursor: "pointer",
                  minHeight: "240px"
                }}
                onClick={() => setSelectedCard(idx)}
              >
                <AnalyticsCard
                  title={card.title}
                  metrics={card.metrics}
                  summary={card.summary}
                  category={category}
                  width="100%"
                  height="auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;