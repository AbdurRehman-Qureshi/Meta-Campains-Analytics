import React from "react";

const AnalyticsCard = ({ title, metrics, summary, category, width = 445, height = 350 }) => {
  const metricLabels = category === "LEADS"
    ? [
        { key: "bb", label: "BB" },
        { key: "cpm", label: "CPM" },
        { key: "ctra", label: "CTRA" },
        { key: "ctrl", label: "CTRL" },
        { key: "leads", label: "LEADS" },
        { key: "cpl", label: "CPL" },
      ]
    : [
        { key: "bb", label: "BB" },
        { key: "cpm", label: "CPM" },
        { key: "ctra", label: "CTRA" },
        { key: "ctrl", label: "CTRL" },
        { key: "catc", label: "CATC" },
        { key: "cgb", label: "CGB" },
        { key: "cpa", label: "CPA" },
        { key: "roas", label: "ROAS" },
        { key: "aov", label: "AOV" },
      ];

  return (
    <div
      className="rounded-xl shadow-lg flex flex-col justify-between"
      style={{
        // background: "#090B0CFA",
        width,
        minWidth: width,
        maxWidth: width,
        height,
        minHeight: height,
        maxHeight: height,
        color: "#f2f2f2",
        fontFamily: "Inter, sans-serif",
        padding: "0px 0px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold" style={{ color: "#f2f2f2" }}>
          {title}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-row items-center justify-between w-full mb-4">
        {metricLabels.map((metric) => (
          <div
            key={metric.key}
            className="flex flex-col "
            style={{ minWidth: "52px" }}
          >
            <span className="text-sm text-[#f2f2f2] font-sm mb-2">{metric.label}</span>
            <span
              className="font-sm text-sm"
              style={{
                color:
                  metric.key === "bb" || metric.key === "leads"
                    ? "#f2f2f2"
                    : metrics && metrics[metric.key] && metrics[metric.key].change !== undefined
                    ? metrics[metric.key].change === "15%"
                      ? "#f2f2f2"
                      : metrics[metric.key].change.startsWith("-")
                      ? "#e57373"
                      : "#6fcf97"
                    : "#f2f2f2",  
              }}
            >
              {metrics && metrics[metric.key]
               ? metric.key === "bb"
                 ? (metrics[metric.key].value !== undefined
                     ? parseFloat(metrics[metric.key].value).toFixed(2)
                     : "-")
                 : metric.key === "leads"
                 ? (metrics[metric.key].value ?? "-")
                 : (metrics[metric.key].change ?? "-")
               : "-"}
             
            </span>
          </div>
        ))}
      </div>

      {/* General Update Section */}
      <div
        className="flex-1 overflow-y-auto mt-2 hide-scrollbar"
        style={{
          maxHeight: "180px",
          scrollbarWidth: "thin",
          scrollbarColor: "#d4ac68 #222",
        }}
      >
        <div
          className="text-sm leading-relaxed pr-3"
          style={{
            color: "#f2f2f2",
            fontWeight: 400,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span className="font-semibold text-[#d4ac68]">General update:</span>
          <div
            style={{
              marginTop: "8px",
              whiteSpace: "pre-line",
              wordBreak: "break-word",
            }}
          >
            {summary || <span className="text-gray-500">No summary available.</span>}
          </div>
        </div>
      </div>
      {/* Custom scrollbar - hide arrows */}
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default AnalyticsCard;
