import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e3_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e3_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />

      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f0ede6] blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-[#e8e0d5]/40 blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] rounded-full bg-[#e0dbd4]/30 blur-3xl opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Removed badge per user request */}

        <h1 className="text-5xl md:text-7xl font-light text-[#1a1a1a] leading-tight tracking-tight mb-6">
          The Intelligence<br />
          <span className="font-display italic text-[#6b5e4e]">a Company</span><br />
          Operates Through
        </h1>

        <p className="text-lg md:text-xl text-[#666] font-light max-w-xl mx-auto leading-relaxed mb-4">
          It does not sit inside your business.
        </p>
        <p className="text-base md:text-lg text-[#888] font-light max-w-xl mx-auto leading-relaxed mb-12">
          Your business sits inside it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/auth?mode=signup" className="btn-glass-dark px-8 py-3.5 rounded-full text-white text-sm font-medium inline-block text-center cursor-pointer">
            Sign Up
          </Link>
          <Link to="/auth" className="btn-glass px-8 py-3.5 rounded-full text-[#444] text-sm font-medium inline-block text-center cursor-pointer">
            Sign In
          </Link>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs tracking-widest text-[#888] uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#888] to-transparent" />
      </div>
    </section>
  )
}
