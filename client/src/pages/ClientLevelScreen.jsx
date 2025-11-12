import React, { useEffect, useState } from "react";
import AnalyticsCard from "../components/AnalyticsCard";
import { useNavigate } from "react-router-dom";

const ClientLevel = ({ category }) => {
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekOptions, setWeekOptions] = useState([]);
  const [weeksLoaded, setWeeksLoaded] = useState(false);
  const navigate = useNavigate();

  function formatIsoKeyLabel(key) {
    if (!key) return "";
    const k = Number(key);
    const year = Math.floor(k / 100);
    const week = k % 100;
    return `${year}-W${String(week).padStart(2, "0")}`;
  }

  // Fetch available weeks when category changes
  useEffect(() => {
    async function fetchWeeksAndSet() {
      setWeeksLoaded(false);
      try {
        const res = await fetch(`/api/clients/available-weeks?category=${category}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setWeekOptions(data);
          setSelectedWeek(data[data.length - 1]);
        } else {
          setWeekOptions([]);
          setSelectedWeek(null);
        }
      } catch {
        setWeekOptions([]);
        setSelectedWeek(null);
      } finally {
        setWeeksLoaded(true);
      }
    }

    if (category) fetchWeeksAndSet();
  }, [category]);

  // Fetch clients only after weeks are loaded and selectedWeek is finalized
  useEffect(() => {
    if (!weeksLoaded || !selectedWeek || !category) return;

    setLoading(true);
    fetch(`/api/clients/client-level-cards?category=${category}&week=${selectedWeek}`)
      .then(res => res.json())
      .then(data => setClientsData(Array.isArray(data) ? data : []))
      .catch(() => setClientsData([]))
      .finally(() => setLoading(false));
  }, [selectedWeek, category, weeksLoaded]);

  return (
    <div className="px-0 sm:px-0 lg:px-0">
      {/* Week Selector - Now stacks on mobile */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
        <span className="font-bold text-base sm:text-lg">Select Week:</span>
        <select
          value={selectedWeek ?? ""}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          className="bg-[#1a1d24] text-white px-3 py-2 rounded text-sm sm:text-base w-full sm:w-auto"
          disabled={!weeksLoaded || weekOptions.length === 0}
        >
          {weekOptions.map((week) => (
            <option key={week} value={week}>
              {formatIsoKeyLabel(week)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
        </div>
      ) : clientsData.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No clients found for this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-4">
          {clientsData.map(({ client, metrics, summary }) => (
            <div
              key={client.id}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => navigate(`/client/${client.id}/${client.category}`)}
            >
              <AnalyticsCard
                title={client.AdAccountName}
                metrics={metrics}
                summary={summary}
                category={client.category}
                width="100%"
                height="280px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientLevel;
