// Partner/Channel Financial Performance Dashboard — Rev 2
// Plain ESM module, GitHub Pages-ready (no build tools).
// Libraries are loaded via ESM CDN in index.html. This file only exports the React component.

import React, { useMemo, useState } from "https://esm.sh/react@18.2.0";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "https://esm.sh/recharts@2.12.7";

// ---------- Mock Data Utilities ----------
const partnerCategories = [
  "Alliance Partner",
  "Embedded Partner",
  "Referral Partner",
  "VC Partner",
  "AM Managed Partner",
  "Distribution Partner",
  "Referral Others",
  "TPI",
];

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// deterministic pseudo‑random for stable visuals in demo
function mulberry32(a){return function(){var t=(a+=0x6D2B79F5);t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}};
const rng = mulberry32(42);

function pick(min, max){return Math.round(min + (max-min)*rng());}

// Build stacked dataset for Monthly Net Net Revenue by partner category (last 6 months)
const stackedMonthlyNNR = months.slice(0, 6).map((m) => {
  const row = { month: m };
  partnerCategories.forEach((c) => { row[c] = pick(8000, 38000); });
  return row;
});

// Quarterly Treemap for Net Net Revenue
const quarterlyTreemap = ["Q1","Q2","Q3","Q4"].map((q) => ({
  name: q,
  children: partnerCategories.map((c) => ({ name: c, size: pick(80000, 320000) }))
}));

// MoM columns for margins (Net Net, Net, Gross)
const marginMoM = months.slice(0, 12).map((m) => ({
  month: m,
  gross: pick(18, 42),
  net: pick(10, 30),
  netnet: pick(6, 22),
}));

// MTD cumulative (last 4 months) for Revenue + TPV charts
function genMTDCumulative(){
  const last4 = months.slice(0, 4);
  return last4.map((m) => ({
    label: `${m} (MTD)`,
    gross: pick(120000, 320000),
    net: pick(80000, 220000),
    netnet: pick(60000, 180000),
    tpv: pick(1000000, 3500000),
    target: pick(90000, 260000),
  }));
}
const mtdBlocks = genMTDCumulative();

// ---------- Palette & helpers ----------
const palette = [
  "#6AA9FA", // blue
  "#F7A6C7", // pink
  "#F9C97D", // yellow
  "#9ADBC7", // teal
  "#B6A4F7", // purple
  "#F2A182", // orange
  "#98B9F2", // light blue
  "#85D1A0", // green
];

const fmtCurrency = (v) => `$${Number(v).toLocaleString()}`;

// Build Waterfall dataset per month for a chosen margin key
function buildWaterfall(monthLabel, key){
  let cum = 0;
  const parts = partnerCategories.map((c) => {
    const sign = rng() > 0.2 ? 1 : -1; // ~20% are negative
    const base = pick(1, 8);
    const mult = key === "gross" ? 1.6 : key === "net" ? 1.2 : 1;
    const val = base * mult * sign;
    const start = cum;
    cum += val;
    return { name: c, start, value: val, end: cum };
  });
  return { month: monthLabel, parts, total: cum };
}

const wfMonthlyNetNet = buildWaterfall("Selected Month", "netnet");
const wfMonthlyNet = buildWaterfall("Selected Month", "net");
const wfMonthlyGross = buildWaterfall("Selected Month", "gross");

// ---------- Small UI primitives ----------
const Card = ({ title, subtitle, right, className, children }) => (
  <div className={`bg-white shadow-sm rounded-2xl border border-gray-100 p-4 md:p-6 ${className||""}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
    <div className="mt-4">
      {children}
    </div>
  </div>
);

const Tag = ({children}) => (
  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{children}</span>
);

// Transparent baseline bar for Waterfall
const BaselineBar = (props) => {
  const { x, y, width, height, fill } = props;
  return React.createElement("rect", { x, y, width, height, fill, opacity: 0 });
};

// ---------- Custom Components ----------
function TreemapNode(props){
  const { x, y, width, height, name, index } = props;
  const color = palette[index % palette.length];
  return (
    React.createElement("g", null,
      React.createElement("rect", { x, y, width, height, fill: color, rx: 8, ry: 8, opacity: 0.9 }),
      (width > 80 && height > 26) ?
        React.createElement("text", { x: x + 8, y: y + 20, fill: "#1f2937", fontSize: 12, fontWeight: 600 }, name) : null
    )
  );
}

function WaterfallChart({ data, color }){
  const rows = data.parts.map((p) => ({
    name: p.name,
    baseline: Math.min(p.start, p.end), // lower bound
    delta: p.value,
  }));
  const domainMin = Math.min(0, ...data.parts.map(p=>Math.min(p.start, p.end))) - 2;
  const domainMax = Math.max(0, ...data.parts.map(p=>Math.max(p.start, p.end))) + 2;

  return (
    React.createElement("div", { className: "h-72" },
      React.createElement(ResponsiveContainer, null,
        React.createElement(ComposedChart, { data: rows },
          React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
          React.createElement(XAxis, { dataKey: "name", tick: { fontSize: 11 }, interval: 0, angle: -20, textAnchor: "end", height: 60 }),
          React.createElement(YAxis, { domain: [domainMin, domainMax], unit: "%" }),
          React.createElement(Tooltip, { formatter: (v) => (typeof v === "number" ? `${v.toFixed(1)}%` : v) }),
          React.createElement(Legend, null),
          React.createElement(Bar, { dataKey: "baseline", name: "Start", shape: React.createElement(BaselineBar) }),
          React.createElement(Bar, { dataKey: "delta", name: "Change", fill: color }),
          React.createElement(Line, { type: "monotone", dataKey: (v)=>v.baseline+v.delta, name: "Cumulative", stroke: "#111827", dot: false })
        )
      )
    )
  );
}

// ---------- Main Dashboard ----------
export default function PartnerChannelFinancialPerformanceDashboardRev2(){
  // Filters (placeholders; keep existing)
  const [country, setCountry] = useState("All Countries");
  const [segment, setSegment] = useState("All Segments");
  const [timeframe, setTimeframe] = useState("Monthly");

  const treemapData = useMemo(() => quarterlyTreemap, []);

  return (
    React.createElement("div", { className: "min-h-screen bg-gray-50 text-gray-800" },
      React.createElement("header", { className: "px-5 md:px-8 py-6 border-b bg-white" },
        React.createElement("div", { className: "flex flex-col md:flex-row md:items-end md:justify-between gap-4" },
          React.createElement("div", null,
            React.createElement("h1", { className: "text-2xl md:text-3xl font-bold tracking-tight" }, "Channel Partner \u2014 Financial Performance (Rev 2)"),
            React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "GitHub-ready single file \u2022 Pastel GitHub style \u2022 Recharts")
          ),
          React.createElement("div", { className: "flex flex-wrap items-center gap-2" },
            React.createElement(Tag, null, country),
            React.createElement(Tag, null, segment),
            React.createElement(Tag, null, `View: ${timeframe}`)
          )
        )
      ),

      React.createElement("section", { className: "px-5 md:px-8 py-4" },
        React.createElement("div", { className: "flex flex-wrap gap-3 items-center text-sm" },
          React.createElement("button", { className: "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200", onClick: ()=>setCountry("All Countries") }, "All Countries"),
          React.createElement("button", { className: "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200", onClick: ()=>setCountry("TH") }, "TH"),
          React.createElement("button", { className: "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200", onClick: ()=>setCountry("MY") }, "MY"),
          React.createElement("span", { className: "mx-2 text-gray-300" }, "|"),
          React.createElement("button", { className: "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200", onClick: ()=>setSegment("All Segments") }, "All Segments"),
          React.createElement("button", { className: "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200", onClick: ()=>setSegment("SMB") }, "SMB"),
          React.createElement("button", { className: "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200", onClick: ()=>setSegment("Enterprise") }, "Enterprise"),
          React.createElement("span", { className: "mx-2 text-gray-300" }, "|"),
          React.createElement("button", { className: `px-3 py-1.5 rounded-lg ${timeframe==="Monthly"?"bg-gray-900 text-white":"bg-gray-100 hover:bg-gray-200"}`, onClick: ()=>setTimeframe("Monthly") }, "Monthly"),
          React.createElement("button", { className: `px-3 py-1.5 rounded-lg ${timeframe==="Quarterly"?"bg-gray-900 text-white":"bg-gray-100 hover:bg-gray-200"}`, onClick: ()=>setTimeframe("Quarterly") }, "Quarterly")
        )
      ),

      React.createElement("main", { className: "px-5 md:px-8 pb-16 space-y-8" },
        // ===== REVENUE CARDS =====
        React.createElement("section", null,
          React.createElement("h2", { className: "text-lg font-semibold mb-3" }, "Revenue"),
          React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6" },
            React.createElement(Card, { title: "Net Revenue vs Target", subtitle: "MTD Cumulative \u2022 Last 4 months" },
              React.createElement("div", { className: "h-64" },
                React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                  React.createElement(ComposedChart, { data: mtdBlocks, margin: { top: 5, right: 10, left: 0, bottom: 0 } },
                    React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                    React.createElement(XAxis, { dataKey: "label" }),
                    React.createElement(YAxis, { tickFormatter: fmtCurrency }),
                    React.createElement(Tooltip, { formatter: (v)=>fmtCurrency(v) }),
                    React.createElement(Legend, null),
                    React.createElement(Bar, { dataKey: "net", name: "Net Revenue (MTD)", stackId: "a", fill: palette[0], radius: [6,6,0,0] }),
                    React.createElement(Line, { dataKey: "target", name: "Target", stroke: "#333", strokeWidth: 2, dot: false })
                  )
                )
              )
            ),
            React.createElement(Card, { title: "Gross Revenue", subtitle: "MTD Cumulative \u2022 Last 4 months" },
              React.createElement("div", { className: "h-64" },
                React.createElement(ResponsiveContainer, null,
                  React.createElement(BarChart, { data: mtdBlocks },
                    React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                    React.createElement(XAxis, { dataKey: "label" }),
                    React.createElement(YAxis, { tickFormatter: fmtCurrency }),
                    React.createElement(Tooltip, { formatter: (v)=>fmtCurrency(v) }),
                    React.createElement(Legend, null),
                    React.createElement(Bar, { dataKey: "gross", name: "Gross (MTD)", fill: palette[5], radius: [6,6,0,0] })
                  )
                )
              )
            ),
            React.createElement(Card, { title: "Net Net Revenue \u2014 Monthly by Partner", subtitle: "Stacked Column by Category" },
              React.createElement("div", { className: "h-72" },
                React.createElement(ResponsiveContainer, null,
                  React.createElement(BarChart, { data: stackedMonthlyNNR },
                    React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                    React.createElement(XAxis, { dataKey: "month" }),
                    React.createElement(YAxis, { tickFormatter: fmtCurrency }),
                    React.createElement(Tooltip, { formatter: (v)=>fmtCurrency(v) }),
                    React.createElement(Legend, null),
                    partnerCategories.map((c, i) =>
                      React.createElement(Bar, { key: c, dataKey: c, name: c, stackId: "nnr", fill: palette[i % palette.length] })
                    )
                  )
                )
              )
            ),
            React.createElement(Card, { title: "Net Net Revenue \u2014 Quarterly Breakdown", subtitle: "Treemap by Category (select a quarter)" },
              React.createElement("div", { className: "h-72" },
                React.createElement(ResponsiveContainer, null,
                  React.createElement(Treemap, {
                    data: treemapData[2].children,
                    dataKey: "size",
                    nameKey: "name",
                    ratio: 4/3,
                    stroke: "#fff",
                    fill: palette[0],
                    content: React.createElement(TreemapNode, null)
                  })
                )
              )
            )
          )
        ),

        // ===== TPV CARDS =====
        React.createElement("section", null,
          React.createElement("h2", { className: "text-lg font-semibold mb-3" }, "TPV"),
          React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6" },
            React.createElement(Card, { title: "TPV", subtitle: "MTD Cumulative \u2022 Last 4 months" },
              React.createElement("div", { className: "h-64" },
                React.createElement(ResponsiveContainer, null,
                  React.createElement(LineChart, { data: mtdBlocks },
                    React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                    React.createElement(XAxis, { dataKey: "label" }),
                    React.createElement(YAxis, { tickFormatter: (v)=>Number(v).toLocaleString() }),
                    React.createElement(Tooltip, { formatter: (v)=>Number(v).toLocaleString() }),
                    React.createElement(Legend, null),
                    React.createElement(Line, { type: "monotone", dataKey: "tpv", name: "TPV (MTD)", stroke: palette[4], strokeWidth: 3, dot: false })
                  )
                )
              )
            )
          )
        ),

        // ===== MARGIN CARDS =====
        React.createElement("section", null,
          React.createElement("h2", { className: "text-lg font-semibold mb-3" }, "Margin"),
          React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6" },
            React.createElement(Card, { title: "Net Net Margin \u2014 MoM", subtitle: "Column \u2022 12 months" },
              React.createElement("div", { className: "h-64" },
                React.createElement(ResponsiveContainer, null,
                  React.createElement(BarChart, { data: marginMoM },
                    React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                    React.createElement(XAxis, { dataKey: "month" }),
                    React.createElement(YAxis, { unit: "%" }),
                    React.createElement(Tooltip, { formatter: (v)=>`${v}%` }),
                    React.createElement(Legend, null),
                    React.createElement(Bar, { dataKey: "netnet", name: "Net Net Margin", fill: palette[0], radius: [6,6,0,0] })
                  )
                )
              )
            ),
            React.createElement(Card, { title: "Net Margin \u2014 MoM", subtitle: "Column \u2022 12 months" },
              React.createElement("div", { className: "h-64" },
                React.createElement(ResponsiveContainer, null,
                  React.createElement(BarChart, { data: marginMoM },
                    React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                    React.createElement(XAxis, { dataKey: "month" }),
                    React.createElement(YAxis, { unit: "%" }),
                    React.createElement(Tooltip, { formatter: (v)=>`${v}%` }),
                    React.createElement(Legend, null),
                    React.createElement(Bar, { dataKey: "net", name: "Net Margin", fill: palette[5], radius: [6,6,0,0] })
                  )
                )
              )
            ),
            React.createElement(Card, { title: "Gross Margin \u2014 MoM", subtitle: "Column \u2022 12 months" },
              React.createElement("div", { className: "h-64" },
                React.createElement(ResponsiveContainer, null,
                  React.createElement(BarChart, { data: marginMoM },
                    React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                    React.createElement(XAxis, { dataKey: "month" }),
                    React.createElement(YAxis, { unit: "%" }),
                    React.createElement(Tooltip, { formatter: (v)=>`${v}%` }),
                    React.createElement(Legend, null),
                    React.createElement(Bar, { dataKey: "gross", name: "Gross Margin", fill: palette[3], radius: [6,6,0,0] })
                  )
                )
              )
            )
          ),

          // Sub-cluster: Monthly Waterfalls by Partner Category
          React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6" },
            React.createElement(Card, { title: "Net Net Margin \u2014 Monthly", subtitle: "Waterfall by Partner Category" },
              React.createElement(WaterfallChart, { data: wfMonthlyNetNet, color: palette[0] })
            ),
            React.createElement(Card, { title: "Net Margin \u2014 Monthly", subtitle: "Waterfall by Partner Category" },
              React.createElement(WaterfallChart, { data: wfMonthlyNet, color: palette[5] })
            ),
            React.createElement(Card, { title: "Gross Margin \u2014 Monthly", subtitle: "Waterfall by Partner Category" },
              React.createElement(WaterfallChart, { data: wfMonthlyGross, color: palette[3] })
            )
          )
        )
      )
    )
  );
}
