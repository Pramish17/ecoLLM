import { motion } from 'framer-motion';
import { Leaf, Zap, Activity, TrendingDown, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RPieChart, Pie,
} from 'recharts';
import { useStats } from '../hooks/useStats';
import { useModelsContext } from '../context/ModelsContext';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import AnimatedNumber from '../components/AnimatedNumber';
import LiveCarbonWidget from '../components/LiveCarbonWidget';
import { MODEL_COLORS } from '../utils/carbonCalc';
import { formatDate } from '../utils/formatters';

// Colour assignment for any model_id, custom or built-in
const CUSTOM_PALETTE = ['#c084fc', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#a78bfa', '#e879f9'];
function resolveColor(modelId: string, customIdx: number): string {
  return MODEL_COLORS[modelId] ?? CUSTOM_PALETTE[customIdx % CUSTOM_PALETTE.length];
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2540] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
      {label && <p className="text-slate-400 mb-1 text-xs">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono" style={{ color: p.color ?? '#00ff88' }}>
          {p.name}: <span className="text-white">{typeof p.value === 'number' ? p.value.toFixed(5) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// Y-axis tick that truncates cleanly and never wraps
const YAxisTick = ({ x, y, payload }: any) => {
  const MAX = 18;
  const text: string = payload.value ?? '';
  const display = text.length > MAX ? text.slice(0, MAX - 1) + '…' : text;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-4} y={0} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11} fontFamily="Space Grotesk, sans-serif">
        {display}
      </text>
    </g>
  );
};

// Compact custom legend for donut
function DonutLegend({ items }: { items: { name: string; color: string; value: number }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 px-1">
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
          <span className="text-slate-400 text-xs truncate flex-1" title={item.name}>{item.name}</span>
          <span className="text-slate-600 text-xs font-mono flex-shrink-0">
            {Math.round((item.value / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { refreshKey, data: models } = useModelsContext();
  const { data, loading } = useStats(refreshKey);

  // Build a fast lookup: model_id → display_name
  const nameMap = Object.fromEntries(models.all.map(m => [m.model_id, m.display_name]));
  const displayName = (id: string) => nameMap[id] ?? id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full" />
      </div>
    );
  }

  const m = data?.monthly;

  const dailyCo2 = (data?.daily_co2 ?? []).map(d => ({
    ...d,
    day: formatDate(d.day),
    carbon_grams: +d.carbon_grams.toFixed(5),
  }));

  let customIdx = 0;
  const perModel = (data?.per_model ?? []).map(row => {
    const isBuiltin = !!MODEL_COLORS[row.model];
    const color = resolveColor(row.model, isBuiltin ? 0 : customIdx++);
    return {
      ...row,
      name: displayName(row.model),
      co2: +row.total_carbon.toFixed(5),
      color,
    };
  });

  const barChartHeight = Math.max(220, perModel.length * 38);

  const donutItems = perModel.map(r => ({ name: r.name, color: r.color, value: r.calls }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Last 30 days of API carbon tracking</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="CO₂ This Month" icon={<Leaf size={16} />} accent="green" delay={0.05}>
          <AnimatedNumber value={+(m?.total_carbon_grams ?? 0)} decimals={2} suffix=" g" />
        </StatCard>
        <StatCard label="API Calls" icon={<Activity size={16} />} accent="cyan" delay={0.1}>
          <AnimatedNumber value={m?.total_calls ?? 0} />
        </StatCard>
        <StatCard label="Top Model" icon={<BarChart2 size={16} />} accent="yellow" delay={0.15}>
          <span className="text-xl font-bold text-white truncate block">
            {displayName(m?.top_model ?? '') || '—'}
          </span>
        </StatCard>
        <StatCard label="Optimisation Potential" icon={<TrendingDown size={16} />} accent="red" delay={0.2}>
          <AnimatedNumber value={data?.optimisation?.savings_pct ?? 0} suffix="%" />
        </StatCard>
      </div>

      {/* Line chart + live carbon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard title="CO₂ Emissions — Last 30 Days" subtitle="Daily carbon output (grams)" delay={0.25}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyCo2} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="carbon_grams" name="CO₂ (g)" stroke="#00ff88" strokeWidth={2}
                  dot={false} activeDot={{ r: 4, fill: '#00ff88' }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
        <div className="flex flex-col gap-4">
          <LiveCarbonWidget />
          <GlassCard title="Energy Used" subtitle="This month" delay={0.3}>
            <div className="flex items-baseline gap-2">
              <Zap size={20} className="text-[#00d4ff]" />
              <span className="font-mono text-2xl font-bold text-white">
                <AnimatedNumber value={+(m?.total_energy_wh ?? 0)} decimals={4} />
              </span>
              <span className="text-slate-400 text-sm">Wh</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Avg <span className="text-slate-300 font-mono">{(m?.avg_carbon_per_call ?? 0).toFixed(5)}g</span> per call
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Bar chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <GlassCard title="CO₂ by Model" subtitle="Total grams all time" delay={0.35} className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={barChartHeight}>
            <BarChart data={perModel} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={<YAxisTick />}
                tickLine={false}
                axisLine={false}
                width={148}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#1a2540] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
                      <p className="text-white font-semibold mb-1">{d.name}</p>
                      <p className="font-mono text-xs" style={{ color: d.color }}>
                        CO₂: <span className="text-white">{d.co2.toFixed(5)} g</span>
                      </p>
                      <p className="font-mono text-xs text-slate-400">
                        Calls: <span className="text-white">{d.calls}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="co2" name="CO₂ (g)" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {perModel.map(r => <Cell key={r.model} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="Calls by Model" subtitle="Distribution" delay={0.4} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={160}>
            <RPieChart>
              <Pie
                data={donutItems}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {donutItems.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#1a2540] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
                      <p className="text-white font-semibold">{d.name}</p>
                      <p className="font-mono text-xs text-slate-300">{d.value} calls</p>
                    </div>
                  );
                }}
              />
            </RPieChart>
          </ResponsiveContainer>
          <DonutLegend items={donutItems} />
        </GlassCard>
      </div>

      {/* Recent logs */}
      <GlassCard title="Recent Calls" subtitle="Latest API activity" delay={0.45}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                {['Model', 'Input', 'Output', 'Energy', 'CO₂', 'Timestamp'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recent_logs ?? []).map((log, i) => {
                const color = MODEL_COLORS[log.model] ?? '#00d4ff';
                return (
                  <motion.tr key={log.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ background: `${color}18`, color }}>
                        {displayName(log.model)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-slate-300">{log.input_tokens.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 font-mono text-slate-300">{log.output_tokens.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 font-mono text-[#00d4ff]">{log.energy_wh.toFixed(5)} Wh</td>
                    <td className="py-2.5 pr-4 font-mono text-[#00ff88]">{log.carbon_grams.toFixed(5)} g</td>
                    <td className="py-2.5 text-slate-500 text-xs">
                      {new Date(log.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
