const flows = [
  'conversations continue',
  'work advances',
  'relationships evolve',
  'systems adjust',
]

const layers = [
  'conversations with leads',
  'discussions with clients',
  'internal coordination',
  'project timelines',
  'strategic movement',
]

export default function Movement() {
  return (
    <section className="py-32 px-6 bg-[#fafaf8]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">Always On</p>
          <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] leading-tight mb-6">
            Movement is <span className="font-display italic text-[#6b5e4e]">continuous.</span>
          </h2>
          <p className="text-lg text-[#555] font-light max-w-xl mx-auto">
            There is no concept of starting work. There is no concept of stopping work. There is only movement.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl border border-[#ebe8e2] p-8">
            <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-6">In Motion</p>
            <div className="space-y-4">
              {flows.map((f, i) => (
                <div key={f} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#f0ede6] text-[#6b5e4e] text-xs font-semibold flex-shrink-0">{i + 1}</div>
                  <span className="text-[#333] font-light">{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-[#ebe8e2]">
              <p className="text-sm text-[#888] font-light">Even when you are not present, the system is.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebe8e2] p-8">
            <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-6">Present Across Every Layer</p>
            <div className="space-y-3">
              {layers.map((layer) => (
                <div key={layer} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6b5e4e] flex-shrink-0" />
                  <span className="text-[#444]">{layer}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-[#ebe8e2]">
              <p className="text-sm text-[#888] font-light">There is no switching context. It holds all contexts at once.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ebe8e2] p-10 md:p-14 text-center">
          <h3 className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-4">
            It does not execute tasks.
          </h3>
          <p className="text-2xl md:text-3xl font-light text-[#6b5e4e] font-display italic mb-8">
            It maintains direction.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#888]">
            {['direction of conversations', 'direction of projects', 'direction of revenue', 'direction of the company itself'].map((d) => (
              <span key={d} className="px-4 py-2 rounded-full border border-[#ebe8e2] bg-[#fafaf8]">{d}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
