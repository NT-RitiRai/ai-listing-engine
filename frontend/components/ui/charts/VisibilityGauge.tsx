"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface VisibilityGaugeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const COLORS = {
  high: ["#10b981", "#e2e8f0"], // Emerald
  medium: ["#f59e0b", "#e2e8f0"], // Amber
  low: ["#ef4444", "#e2e8f0"], // Red
};

export default function VisibilityGauge({ score, label, size = "md" }: VisibilityGaugeProps) {
  const data = [
    { name: "Score", value: score },
    { name: "Remaining", value: 100 - score },
  ];

  let colorScheme = COLORS.high;
  if (score < 50) colorScheme = COLORS.low;
  else if (score < 80) colorScheme = COLORS.medium;

  const getDimensions = () => {
    switch (size) {
      case "sm": return { height: 120, innerRadius: 40, outerRadius: 50 };
      case "lg": return { height: 250, innerRadius: 90, outerRadius: 110 };
      default: return { height: 180, innerRadius: 60, outerRadius: 80 };
    }
  };

  const dims = getDimensions();

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div style={{ height: dims.height, width: "100%" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={dims.innerRadius}
              outerRadius={dims.outerRadius}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorScheme[index]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => [`${val}%`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20%] text-center">
        <div className={`font-bold text-gray-900 ${size === "sm" ? "text-xl" : size === "lg" ? "text-5xl" : "text-3xl"}`}>
          {score}%
        </div>
      </div>
      {label && <div className="text-gray-500 font-medium text-sm mt-[-20px]">{label}</div>}
    </div>
  );
}
