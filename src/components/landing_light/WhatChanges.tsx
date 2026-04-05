const phases = [
  {
    phase: 'Without AIVANTS',
    items: ['constant checking', 'constant remembering', 'constant coordination'],
    tone: 'before',
  },
  {
    phase: 'At first',
    items: ['fewer things are missed', 'fewer things are delayed', 'fewer things need intervention'],
    tone: 'during',
  },
  {
    phase: 'Eventually',
    items: ['things are already done', 'conversations are already handled', 'work is already progressing'],
    tone: 'after',
  },
]

export default function WhatChanges() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">The Transformation</p>
          <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] leading-tight mb-6">
            What <span className="font-display italic text-[#6b5e4e]">changes.</span>
          </h2>
          <p className="text-lg text-[#555] font-light max-w-xl mx-auto">
            At first, very little appears different. Then gradually, then eventually.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {phases.map(({ phase, items, tone }) => (
            <div
              key={phase}
              className={`rounded-2xl p-8 border ${
                tone === 'before'
                  ? 'bg-[#fafaf8] border-[#ebe8e2]'
                  : tone === 'during'
                  ? 'bg-[#f5f2ec] border-[#e0dbd3]'
                  : 'bg-[#1a1a1a] border-[#1a1a1a]'
              }`}
            >
              <p className={`text-xs tracking-widest uppercase mb-6 ${tone === 'after' ? 'text-[#888]' : 'text-[#b0a898]'}`}>{phase}</p>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${tone === 'after' ? 'bg-[#6b5e4e]' : 'bg-[#c5bdb0]'}`} />
                    <span className={`text-sm font-light ${tone === 'after' ? 'text-[#e8e4de]' : 'text-[#555]'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#fafaf8] rounded-3xl border border-[#ebe8e2] p-10 md:p-14 text-center">
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-6">Presence Without Announcement</p>
          <p className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-4 max-w-2xl mx-auto">
            There is no moment where AIVANTS says it is working.
          </p>
          <p className="text-lg text-[#555] font-light mb-8">You notice it in absence.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['absence of delays', 'absence of confusion', 'absence of dropped execution'].map((item) => (
              <span key={item} className="px-5 py-2.5 rounded-full border border-[#d8d4cc] bg-white text-sm text-[#555]">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
