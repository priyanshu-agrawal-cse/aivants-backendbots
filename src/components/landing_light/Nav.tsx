import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-nav' : 'bg-transparent'
      }`}
    >
      {/* Top prismatic highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#6b5e4e]/20 blur-md group-hover:bg-[#6b5e4e]/30 transition-all duration-300" />
            <img src="/logo.png" alt="AIVANTS logo" className="relative w-8 h-8 object-contain" />
          </div>
          <span className="text-[17px] font-semibold tracking-[0.18em] text-[#1a1a1a]">AIVANTS</span>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#555]">
          <a href="#how-it-works" className="relative group py-1 hover:text-[#1a1a1a] transition-colors">
            How It Works
            <span className="absolute bottom-0 left-0 w-0 h-px bg-[#6b5e4e] group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#intelligence" className="relative group py-1 hover:text-[#1a1a1a] transition-colors">
            Intelligence
            <span className="absolute bottom-0 left-0 w-0 h-px bg-[#6b5e4e] group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#control" className="relative group py-1 hover:text-[#1a1a1a] transition-colors">
            Control
            <span className="absolute bottom-0 left-0 w-0 h-px bg-[#6b5e4e] group-hover:w-full transition-all duration-300" />
          </a>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 ml-2">
            <Link to="/auth" className="btn-glass px-5 py-2 rounded-full text-[#333] text-sm font-medium inline-block text-center cursor-pointer">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className="btn-glass-dark px-5 py-2 rounded-full text-white text-sm font-medium inline-block text-center cursor-pointer">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Mobile auth buttons */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/auth" className="btn-glass px-4 py-1.5 rounded-full text-[#333] text-xs font-medium inline-block text-center cursor-pointer">Sign In</Link>
          <Link to="/auth?mode=signup" className="btn-glass-dark px-4 py-1.5 rounded-full text-white text-xs font-medium inline-block text-center cursor-pointer">Sign Up</Link>
        </div>
      </div>

      {/* Bottom edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c5bdb0]/40 to-transparent pointer-events-none" />
    </nav>
  )
}
