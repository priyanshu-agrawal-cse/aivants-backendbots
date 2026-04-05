export default function Scales() {
  return (
    <section className="py-32 px-6 bg-[#fafaf8]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">Scale</p>
          <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] leading-tight mb-6">
            It scales without<br /><span className="font-display italic text-[#6b5e4e]">fragmentation.</span>
          </h2>
          <p className="text-lg text-[#555] font-light max-w-xl mx-auto">
            As complexity increases, AIVANTS does not split. It does not require restructuring.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl border border-[#ebe8e2] p-8">
            <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-6">As you grow</p>
            <div className="space-y-3">
              {['more people', 'more clients', 'more systems', 'more movement'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#6b5e4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[#444] text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebe8e2] p-8 flex flex-col justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f0ede6] mb-5">
                <img src="/logo.png" alt="" className="w-8 h-8 object-contain opacity-80" />
              </div>
              <p className="text-base font-medium text-[#1a1a1a] mb-3">Absorbs complexity</p>
              <p className="text-sm text-[#888] font-light leading-relaxed">Maintains a single layer across all of it.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ebe8e2] p-10 md:p-14">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">Beyond Internal Systems</p>
              <h3 className="text-2xl font-light text-[#1a1a1a] leading-tight mb-4">
                AIVANTS is not limited to what happens inside the company.
              </h3>
              <p className="text-base text-[#666] font-light leading-relaxed">
                It observes the environment around it and adapts internal movement accordingly.
              </p>
            </div>
            <div className="space-y-3">
              {['how conversations behave', 'how engagement shifts', 'how patterns emerge'].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 rounded-xl bg-[#fafaf8] border border-[#ebe8e2]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6b5e4e] flex-shrink-0" />
                  <span className="text-sm text-[#444]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
