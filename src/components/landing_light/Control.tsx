const boundaries = [
  { label: 'Moves automatically', desc: 'Define what advances without needing your attention.' },
  { label: 'Pauses for review', desc: 'Define what waits for your explicit sign-off.' },
  { label: 'Never executed', desc: 'Define hard boundaries the system never crosses.' },
  { label: 'Explicit limits', desc: 'Define where the system stops and you begin.' },
]

export default function Control() {
  return (
    <section id="control" className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">Authority</p>
            <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] leading-tight mb-6">
              Control is not reduced.<br />
              <span className="font-display italic text-[#6b5e4e]">It is refined.</span>
            </h2>
            <p className="text-lg text-[#555] font-light leading-relaxed mb-4">
              You are not giving up control. You are removing the need to exercise it constantly.
            </p>
            <p className="text-base text-[#888] font-light leading-relaxed">
              AIVANTS does not act independently of you. It acts in alignment with you. It knows who you are, what you are allowed to do, and what level of execution is permitted.
            </p>
          </div>

          <div className="space-y-4">
            {boundaries.map(({ label, desc }) => (
              <div key={label} className="flex gap-4 p-5 rounded-xl border border-[#ebe8e2] bg-[#fafaf8] hover:bg-white hover:border-[#c5bdb0] transition-all duration-200">
                <div className="mt-0.5 w-2 h-2 rounded-sm bg-[#6b5e4e] flex-shrink-0 rotate-45" />
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a] mb-0.5">{label}</div>
                  <div className="text-xs text-[#999]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#f5f2ec] rounded-3xl p-10 md:p-14 text-center">
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-6">Continuity Without Friction</p>
          <h3 className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-6 max-w-2xl mx-auto leading-relaxed">
            In most systems, continuity breaks between messages, teams, steps, and decisions.
          </h3>
          <p className="text-xl text-[#6b5e4e] font-display italic mb-8">AIVANTS removes those breaks.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {['without reset', 'without loss of context', 'without delay'].map((item) => (
              <span key={item} className="px-5 py-2.5 rounded-full bg-white border border-[#d8d4cc] text-[#555]">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
