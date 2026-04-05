const knowsItems = [
  { label: 'Every conversation', sub: 'where it stands' },
  { label: 'Every relationship', sub: 'where it stands' },
  { label: 'Every project', sub: 'where it stands' },
  { label: 'Momentum', sub: 'where it exists' },
  { label: 'Friction', sub: 'where it is building' },
  { label: 'Attention', sub: 'where it is required' },
]

export default function LivingState() {
  return (
    <section className="py-32 px-6 bg-[#fafaf8]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">Living State</p>
          <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] leading-tight mb-6">
            Your company is no longer<br />
            a collection of <span className="font-display italic text-[#6b5e4e]">updates.</span>
          </h2>
          <p className="text-xl text-[#555] font-light">It is a living state.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-20">
          {knowsItems.map(({ label, sub }) => (
            <div key={label} className="group p-6 rounded-2xl border border-[#ebe8e2] bg-white hover:border-[#c5bdb0] hover:shadow-sm transition-all duration-200">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6b5e4e] mb-4" />
              <div className="text-sm font-medium text-[#1a1a1a] mb-1">{label}</div>
              <div className="text-xs text-[#aaa]">{sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#ebe8e2] p-10 md:p-14 text-center">
          <p className="text-2xl md:text-3xl font-light text-[#1a1a1a] leading-relaxed max-w-2xl mx-auto">
            Nothing needs to be checked.
          </p>
          <p className="mt-4 text-lg text-[#888] font-light">It is already known.</p>
        </div>
      </div>
    </section>
  )
}
