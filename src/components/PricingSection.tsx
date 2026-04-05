import { useState } from "react";

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  const Dropdown = ({ title, children }: any) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="border-b py-4">
        <button
          onClick={() => setOpen(!open)}
          className="w-full text-left font-medium flex justify-between"
        >
          {title}
          <span>{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="mt-3 text-sm text-gray-600 leading-relaxed">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-950 text-black dark:text-white rounded-2xl border shadow-sm px-6 py-12 mb-8">
      {/* HEADER */}
      <div className="text-center max-w-4xl mx-auto">
        <h2 className="text-4xl font-semibold">
          Autonomous AI for Business Execution
        </h2>
        <p className="mt-4 text-gray-500">
          AIVANTS researches, decides, and executes — across your entire business.
        </p>
      </div>

      {/* TOGGLE */}
      <div className="flex justify-center mt-10">
        <div className="flex bg-gray-100 dark:bg-zinc-900 rounded-full p-1">
          <button
            onClick={() => setYearly(false)}
            className={`px-6 py-2 rounded-full transition-colors ${
              !yearly ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-6 py-2 rounded-full transition-colors ${
              yearly ? "bg-white dark:bg-zinc-800 shadow" : "text-gray-500"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* PRICING CARDS */}
      <div className="grid lg:grid-cols-5 gap-6 mt-16 max-w-7xl mx-auto">
        {[
          { name: "Free", price: "₹0", desc: "Core AI workflows" },
          { name: "Starter", price: yearly ? "₹39,999" : "₹3,999", desc: "AI operator layer" },
          { name: "Growth", price: yearly ? "₹1,49,999" : "₹14,999", desc: "Autonomous execution", highlight: true },
          { name: "Scale", price: "₹39,999+", desc: "AI system layer" },
          { name: "Enterprise", price: "Custom", desc: "AI infrastructure" },
        ].map((plan: any, i) => (
          <div
            key={i}
            className={`border rounded-2xl p-6 transition-transform flex flex-col relative ${
              plan.highlight ? "border-black dark:border-white shadow-xl scale-105" : "border-gray-200 dark:border-zinc-800"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6b5e4e] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
            )}
            <h3 className="font-medium">{plan.name}</h3>
            <div className="text-3xl font-semibold mt-4">{plan.price}</div>
            <p className="text-sm text-gray-500 mt-2 flex-1">{plan.desc}</p>
            <button className={`mt-6 w-full py-2.5 rounded-xl font-medium transition-colors ${plan.highlight ? 'bg-[#6b5e4e] text-white hover:bg-[#5a4e40]' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90'}`}>
              Continue
            </button>
          </div>
        ))}
      </div>

      {/* CAPABILITY TABLE */}
      <div className="max-w-7xl mx-auto mt-24 overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-6">
          Capabilities Overview
        </h2>

        <table className="w-full border dark:border-zinc-800 text-sm min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
            <tr>
              <th className="p-4 text-left font-medium text-muted-foreground">Capability</th>
              <th className="font-medium text-muted-foreground">Free</th>
              <th className="font-medium text-muted-foreground">Starter</th>
              <th className="font-medium text-muted-foreground">Growth</th>
              <th className="font-medium text-muted-foreground">Scale</th>
              <th className="font-medium text-muted-foreground">Enterprise</th>
            </tr>
          </thead>

          <tbody className="divide-y dark:divide-zinc-800">
            {[
              ["Autonomous Execution", "✖", "Limited", "✔", "✔", "✔"],
              ["AI Voice (Speech + TTS)", "✖", "✔", "✔", "✔", "✔"],
              ["WhatsApp AI Agent", "✖", "Basic", "Advanced", "Full", "Custom"],
              ["Campaign Automation", "Limited", "✔", "✔", "✔", "✔"],
              ["Telegram Control", "✔", "✔", "✔", "✔", "✔"],
              ["Client & Project OS", "✔", "✔", "✔", "✔", "✔"],
              ["Appointment Booking", "✖", "✖", "✔", "✔", "✔"],
              ["Social Automation", "✖", "Limited", "Limited", "✔", "✔"],
              ["AI Ad Generation", "✖", "Limited", "Limited", "✔", "✔"],
              ["Custom AI Development", "✖", "✖", "✖", "✖", "✔"],
            ].map((row, i) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="p-4 text-center first:text-left first:font-medium">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INTELLIGENCE LAYERS */}
      <div className="max-w-4xl mx-auto mt-24">
        <h2 className="text-2xl font-semibold mb-6">
          How AIVANTS Executes with Intelligence
        </h2>

        <div className="space-y-1">
          <Dropdown title="AI Ad Generator — Multi-Layer Execution">
            1. Industry & product analysis<br/>
            2. Competitor ad scanning<br/>
            3. Viral ad detection<br/>
            4. Messaging pattern extraction<br/>
            5. Hook optimization<br/>
            6. Audience targeting logic<br/>
            7. Creative direction generation<br/>
            8. Copywriting<br/>
            9. Campaign structuring<br/>
            10. Platform optimization<br/>
            11. Risk validation<br/>
            12. Approval request<br/>
            13. Performance tracking<br/>
            14. Iteration loop<br/>
            15. Continuous optimization
          </Dropdown>

          <Dropdown title="Social Media Automation — Execution Layers">
            1. Market understanding<br/>
            2. Competitor content analysis<br/>
            3. Trend detection<br/>
            4. Audience behavior analysis<br/>
            5. Content strategy decision<br/>
            6. Hook creation<br/>
            7. Caption generation<br/>
            8. Platform optimization<br/>
            9. Brand validation<br/>
            10. Publishing decision<br/>
            11. Auto posting<br/>
            12. Comment replies<br/>
            13. DM handling<br/>
            14. Performance tracking<br/>
            15. Optimization loop
          </Dropdown>

          <Dropdown title="AI Voice Agent — Execution Layers">
            1. Context understanding<br/>
            2. Lead data analysis<br/>
            3. Intent detection<br/>
            4. Conversation planning<br/>
            5. Speech generation (TTS)<br/>
            6. Real-time response (speech-to-speech)<br/>
            7. Objection handling<br/>
            8. Personalization<br/>
            9. Follow-up logic<br/>
            10. Call outcome tracking<br/>
            11. CRM update<br/>
            12. Next-step decision<br/>
          </Dropdown>

          <Dropdown title="WhatsApp AI Agent — Execution Layers">
            1. Message understanding<br/>
            2. Intent classification<br/>
            3. Lead qualification<br/>
            4. Context memory<br/>
            5. Response generation<br/>
            6. Workflow triggering<br/>
            7. Follow-up scheduling<br/>
            8. Multi-thread handling<br/>
            9. Personalization<br/>
            10. Conversion tracking<br/>
          </Dropdown>

          <Dropdown title="Telegram Command System — Execution Layers">
            1. Command parsing<br/>
            2. Intent recognition<br/>
            3. Data retrieval<br/>
            4. Task mapping<br/>
            5. Workflow triggering<br/>
            6. Execution across modules<br/>
            7. Real-time updates<br/>
            8. Result reporting<br/>
          </Dropdown>
        </div>
      </div>

      {/* USAGE NOTE */}
      <div className="max-w-3xl mx-auto mt-20 p-6 rounded-2xl bg-muted/50 border text-center text-sm text-muted-foreground">
        Each plan includes AI execution capacity (tokens, voice, workflows).
        Additional usage is billed based on consumption to ensure performance and scalability.
      </div>
    </div>
  );
}
