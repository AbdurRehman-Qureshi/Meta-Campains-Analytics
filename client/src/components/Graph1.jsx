// import React from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const HEADER_HEIGHT = 48;

// function chunkArray(array, size) {
//   const result = [];
//   for (let i = 0; i < array.length; i += size) {
//     result.push(array.slice(i, i + size));
//   }
//   return result;
// }

// const GraphSection = ({ metrics, graphData, height = 300 }) => {
//   const metricPairs = chunkArray(metrics, 2);

//   return (
//     <div className="flex flex-col gap-8 w-full">
//       {metricPairs.map((pair, rowIdx) => (
//         <div key={rowIdx} className="flex flex-row gap-8 w-full">
//           {pair.map((metric, colIdx) => {
//             const found = graphData.find(
//               (item) => item.name.toLowerCase() === metric.toLowerCase()
//             );
//             const data = found
//               ? found.data.map((point, idx) => ({
//                   name: `Week ${idx + 1}`,
//                   value: typeof point === "object" && point !== null ? point.value : point,
//                 }))
//               : [];

//             return (
//               <div
//                 key={metric}
//                 className="rounded-xl shadow-lg flex flex-col items-center flex-1"
//                 style={{
//                   background: "transparent",
//                   // border: "1px solid #222",
//                   height: `${height}px`,
//                   color: "#f2f2f2",
//                   fontFamily: "Inter, sans-serif",
//                   boxSizing: "border-box",
//                   minWidth: 0,
//                   display: "flex",
//                   padding: "30px 10px",
//                   justifyContent: "center",
//                 }}
//               >
//                 <div
//                   className="w-full flex justify-between items-center mb-4"
//                   style={{ minHeight: HEADER_HEIGHT }}
//                 >
//                   <span className="text-[13px] font-bold" style={{ color: "#f2f2f2" }}>
//                     {metric} per Week
//                   </span>
//                   {/* <span
//                     className="text-sm font-medium"
//                     style={{
//                       background: "#d4ac68",
//                       color: "#090B0CFA",
//                       borderRadius: "6px",
//                       padding: "4px 12px",
//                     }}
//                   >
//                     5% Profit
//                   </span> */}
//                 </div>
//                 <div
//                   style={{
//                     flex: 1,
//                     width: "100%",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   {data.length > 0 ? (
//                     <ResponsiveContainer
//                       width="100%"
//                       height={height - HEADER_HEIGHT - 48}
//                     >
//                       <LineChart
//                         data={data}
//                         margin={{ top: 0, right: 0, left: -20, bottom: 0 }} // Remove all margins
//                       >
//                         <CartesianGrid stroke="#222" strokeDasharray="3 3" />
//                         <XAxis dataKey="name" tick={{ fill: "#f2f2f2", fontSize: 12 }} />
//                         <YAxis tick={{ fill: "#f2f2f2", fontSize: 12 }} />
//                         <Tooltip
//                           contentStyle={{
//                             background: "#222",
//                             border: "none",
//                             borderRadius: "8px",
//                             color: "#f2f2f2",
//                             fontSize: "12px",
//                           }}
//                         />
//                         <Line
//                           type="monotone"
//                           dataKey="value"
//                           stroke="#d4ac68"
//                           strokeWidth={3}
//                           dot={{ r: 5, fill: "#d4ac68" }}
//                         />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <div className="text-gray-400 text-center mt-8">No data</div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//           {pair.length === 1 && (
//             <div className="flex-1" />
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default GraphSection;


import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const HEADER_HEIGHT = 48;

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const GraphSection = ({ metrics, graphData, height = 300, columnsPerRow = 2 }) => {
  const metricPairs = chunkArray(metrics, columnsPerRow);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 w-full">
      {metricPairs.map((pair, rowIdx) => (
        <div key={rowIdx} className="flex flex-row gap-4 sm:gap-6 lg:gap-8 w-full">
          {pair.map((metric) => {
            const found = graphData.find(
              (item) => item.name.toLowerCase() === metric.toLowerCase()
            );
            const data = found
              ? found.data.map((point, idx) => ({
                  name: `Week ${idx + 1}`,
                  value: typeof point === "object" && point !== null ? point.value : point,
                }))
              : [];

            return (
              <div
                key={metric}
                className="rounded-xl shadow-lg flex flex-col items-center flex-1"
                style={{
                  background: "transparent",
                  height: `${height}px`,
                  minHeight: `${height}px`,
                  color: "#f2f2f2",
                  fontFamily: "Inter, sans-serif",
                  boxSizing: "border-box",
                  minWidth: 0,
                  display: "flex",
                  padding: "clamp(20px, 4vw, 30px) clamp(8px, 2vw, 10px)",
                  justifyContent: "center",
                }}
              >
                <div
                  className="w-full flex justify-between items-center"
                  style={{ 
                    minHeight: HEADER_HEIGHT,
                    marginBottom: "clamp(12px, 2vw, 16px)"
                  }}
                >
                  <span 
                    className="font-bold" 
                    style={{ 
                      color: "#f2f2f2",
                      fontSize: "clamp(11px, 2.5vw, 13px)"
                    }}
                  >
                    {metric} per Week
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {data.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height={height - HEADER_HEIGHT - 48}
                    >
                      <LineChart
                        data={data}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: "#f2f2f2", fontSize: "clamp(10px, 2vw, 12px)" }} 
                        />
                        <YAxis 
                          tick={{ fill: "#f2f2f2", fontSize: "clamp(10px, 2vw, 12px)" }} 
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#222",
                            border: "none",
                            borderRadius: "8px",
                            color: "#f2f2f2",
                            fontSize: "clamp(10px, 2vw, 12px)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#d4ac68"
                          strokeWidth={3}
                          dot={{ r: 5, fill: "#d4ac68" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div 
                      className="text-gray-400 text-center"
                      style={{
                        fontSize: "clamp(11px, 2.5vw, 14px)",
                        marginTop: "clamp(16px, 4vw, 32px)"
                      }}
                    >
                      No data
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {pair.length < columnsPerRow && columnsPerRow > 1 && (
            <div className="flex-1" style={{ minWidth: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
};

export default GraphSection;