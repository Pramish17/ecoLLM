import { motion } from 'framer-motion';
import { ExternalLink, BookOpen, Zap, Globe, Database } from 'lucide-react';
import { MODEL_ENERGY_TABLE, MODEL_DISPLAY_NAMES, MODEL_COLORS } from '../utils/carbonCalc';

const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function Section({ title, icon, children, delay = 0 }: { title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#0d1426] border border-white/5 rounded-2xl p-6"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 bg-[#00ff88]/10 rounded-lg text-[#00ff88]">{icon}</div>
        <h3 className="text-white font-semibold text-lg">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function About() {
  const models = Object.entries(MODEL_ENERGY_TABLE);

  return (
    <div className="max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Methodology &amp; Science</h1>
        <p className="text-slate-400 text-sm mt-1">How EcoLLM estimates energy consumption and carbon emissions</p>
      </motion.div>

      <Section title="Calculation Formula" icon={<Zap size={15} />} delay={0.1}>
        <div className="bg-[#0a0f1e] rounded-xl p-4 font-mono text-sm space-y-2 border border-white/5">
          <p className="text-slate-400">// Energy per API call (Wh)</p>
          <p className="text-[#00d4ff]">
            energyWh = <span className="text-white">(inputTokens / 1000) × model.inputWh</span>
            <br />
            {'         '}+ <span className="text-white">(outputTokens / 1000) × model.outputWh</span>
          </p>
          <p className="text-slate-400 mt-3">// Carbon (grams CO₂)</p>
          <p className="text-[#00ff88]">
            carbonGrams = <span className="text-white">energyWh × (carbonIntensity / 1000)</span>
          </p>
          <p className="text-slate-400 mt-3">// carbonIntensity in gCO₂/kWh (live from National Grid ESO API)</p>
          <p className="text-slate-500">// UK fallback: 233 gCO₂/kWh (2023 average)</p>
        </div>
        <p className="text-slate-400 text-sm mt-4">
          Output tokens consume approximately 3× more energy than input tokens due to autoregressive generation.
          This ratio is derived from published benchmarks on transformer inference compute profiles.
        </p>
      </Section>

      <Section title="Energy per 1,000 Tokens" icon={<Database size={15} />} delay={0.2}>
        <p className="text-slate-400 text-sm mb-4">
          Energy figures are estimates based on published research. They represent the energy consumed at the data centre
          level (including PUE) for 1,000 tokens of inference.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                <th className="text-left py-2 pr-4">Model</th>
                <th className="text-left py-2 pr-4">Input (Wh/1k)</th>
                <th className="text-left py-2 pr-4">Output (Wh/1k)</th>
                <th className="text-left py-2">Ratio</th>
              </tr>
            </thead>
            <tbody>
              {models.map(([model, e]) => (
                <tr key={model} className="border-b border-white/3">
                  <td className="py-2.5 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${MODEL_COLORS[model]}18`, color: MODEL_COLORS[model] }}>
                      {MODEL_DISPLAY_NAMES[model]}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-slate-300 text-xs">{e.input}</td>
                  <td className="py-2.5 pr-4 font-mono text-slate-300 text-xs">{e.output}</td>
                  <td className="py-2.5 font-mono text-slate-500 text-xs">1:{e.output / e.input}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-600 text-xs mt-3">
          Sources: Patterson et al. 2021, Samsi et al. 2023, Luccioni et al. 2023, and provider-published efficiency reports.
        </p>
      </Section>

      <Section title="Real-World Equivalents" icon={<Globe size={15} />} delay={0.3}>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
          {[
            { label: 'UK avg car driving', value: '170g CO₂/km', source: 'DfT 2023' },
            { label: 'Smartphone full charge', value: '8.22g CO₂', source: 'Carbon Trust' },
            { label: 'Netflix streaming (1 hr)', value: '36g CO₂', source: 'IEA 2022' },
            { label: 'Boiling a kettle', value: '25g CO₂', source: 'Est. 2kW × 3min × UK grid' },
          ].map(({ label, value, source }) => (
            <motion.div key={label} variants={item} className="bg-[#0a0f1e] rounded-xl p-4 border border-white/5">
              <p className="text-white font-semibold font-mono text-sm">{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
              <p className="text-slate-600 text-xs mt-1">{source}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section title="Data Sources &amp; References" icon={<BookOpen size={15} />} delay={0.4}>
        <ul className="space-y-3">
          {[
            {
              title: 'Patterson et al. (2021) — Carbon and the Cloud',
              desc: 'Foundational paper on LLM training and inference carbon costs at Google.',
              href: 'https://arxiv.org/abs/2104.10350',
            },
            {
              title: 'UK National Grid ESO Carbon Intensity API',
              desc: 'Free, real-time carbon intensity data for the UK electricity grid (gCO₂/kWh).',
              href: 'https://carbonintensity.org.uk',
            },
            {
              title: 'Luccioni et al. (2023) — Power Hungry Processing',
              desc: 'Empirical measurements of energy consumption for NLP tasks across models.',
              href: 'https://arxiv.org/abs/2311.16863',
            },
            {
              title: 'Samsi et al. (2023) — Words into Watts',
              desc: 'Detailed analysis of inference energy consumption for large language models.',
              href: 'https://arxiv.org/abs/2310.03003',
            },
          ].map(({ title, desc, href }) => (
            <li key={title} className="flex items-start gap-3">
              <div className="w-1 h-1 bg-[#00ff88] rounded-full mt-2 flex-shrink-0" />
              <div>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00d4ff] hover:text-[#00ff88] transition-colors text-sm font-medium flex items-center gap-1"
                >
                  {title} <ExternalLink size={11} />
                </a>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-slate-600 text-xs pb-4"
      >
        EcoLLM estimates are for educational and optimisation guidance only.
        Actual energy consumption varies by provider infrastructure, hardware, and load.
      </motion.div>
    </div>
  );
}
