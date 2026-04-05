export default function FinalSection() {
  return (
    <section id="contact" className="py-32 px-6 bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo glass orb */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-12"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <img src="/logo.png" alt="AIVANTS" className="w-10 h-10 object-contain invert" />
        </div>

        <p className="text-xs tracking-widest text-[#888] uppercase mb-8">Final Position</p>

        <h2 className="text-4xl md:text-6xl font-light text-white leading-tight mb-8">
          AIVANTS is not something<br />
          you <span className="font-display italic text-[#c5bdb0]">add</span> to your company.
        </h2>

        <p className="text-xl text-[#888] font-light max-w-2xl mx-auto mb-12 leading-relaxed">
          It is the layer your company begins to operate through.
        </p>

        {/* Glass quote card */}
        <div className="rounded-3xl p-10 md:p-14 mb-16"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px) saturate(140%)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 40px rgba(0,0,0,0.2)',
          }}
        >
          <p className="text-xl md:text-2xl text-[#d8d4cc] font-light leading-relaxed max-w-2xl mx-auto">
            AIVANTS is where your decisions become reality and continue to move, even when you're not there to move them.
          </p>
        </div>

        {/* CTA glass panel */}
        <div className="rounded-3xl p-10 md:p-12"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 8px 40px rgba(0,0,0,0.18)',
          }}
        >
          <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-4">This Is Not an Upgrade</p>
          <p className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-2">A shift from managing execution</p>
          <p className="text-2xl md:text-3xl font-display italic text-[#6b5e4e] mb-10">to having execution maintained continuously.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-glass-dark px-8 py-3.5 rounded-full text-white text-sm font-medium">
              Sign Up
            </button>
            <button className="btn-glass px-8 py-3.5 rounded-full text-[#444] text-sm font-medium">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
