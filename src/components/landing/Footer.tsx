"use client";

import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center sm:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <img src="/logo.png" alt="AIVANTS" className="w-full h-full object-contain" />
            </div>
            <span className="text-[14px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">AIVANTS</span>
          </div>
          <p className="text-[12.5px] text-[#9a9a9a] tracking-[-0.01em]">
            Build faster. Operate intelligently.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          {["Product", "Pricing", "Docs", "Privacy"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[12.5px] text-[#8a8a8a] hover:text-[#0a0a0a] transition-colors duration-200 tracking-[-0.01em]"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Sign in CTA */}
        <Link
          to="/auth"
          className="text-[13px] font-semibold text-[#0a0a0a] border border-black/15 px-5 py-2 rounded-full hover:bg-[#0a0a0a] hover:text-white hover:border-[#0a0a0a] transition-all duration-200 tracking-[-0.01em]"
        >
          Sign In Now
        </Link>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-black/[0.05] flex justify-center">
        <p className="text-[11.5px] text-[#c0c0c0]">© 2026 AIVANTS. All rights reserved.</p>
      </div>
    </footer>
  );
}
