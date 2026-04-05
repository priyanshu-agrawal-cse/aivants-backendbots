const pillars = [
  { word: 'Context', desc: 'Every action is shaped by everything that has come before it.' },
  { word: 'Timing', desc: 'The right response surfaces at the right moment, not before or after.' },
  { word: 'Continuity', desc: 'Nothing resets. The thread never breaks. The system always remembers.' },
  { word: 'Consequence', desc: 'Every move is aware of what it sets in motion further down the line.' },
]

export default function Intelligence() {
  return (
    <section id="intelligence" className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start mb-20">
          <div>
            <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">The Medium</p>
            <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] leading-tight mb-6">
              Intelligence is not<br />a <span className="font-display italic text-[#6b5e4e]">feature.</span>
            </h2>
            <p className="text-lg text-[#555] font-light leading-relaxed mb-4">
              AIVANTS does not "use intelligence."
            </p>
            <p className="text-lg text-[#555] font-light leading-relaxed">
              It exists as intelligence. Every part of it is shaped by:
            </p>
          </div>
          <div className="space-y-4 pt-2 md:pt-14">
            {pillars.map(({ word, desc }) => (
              <div key={word} className="flex gap-4 p-5 rounded-xl bg-[#fafaf8] border border-[#ebe8e2]">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#6b5e4e] flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a] mb-1">{word}</div>
                  <div className="text-xs text-[#888] leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#f5f2ec] rounded-3xl p-10 md:p-14">
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-8">How It Acts</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { label: 'What has happened', icon: '◷' },
              { label: 'What is happening', icon: '◉' },
              { label: 'What is likely to happen next', icon: '◈' },
            ].map(({ label, icon }) => (
              <div key={label} className="text-center">
                <div className="text-3xl text-[#6b5e4e] mb-4">{icon}</div>
                <div className="text-sm text-[#444] font-medium">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-lg text-[#555] font-light">And only then does it act.</p>
          <p className="mt-2 text-center text-sm text-[#aaa]">Nothing is random. Nothing is disconnected.</p>
        </div>
      </div>
    </section>
  )
}
