"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-black/[0.05] shadow-[0_1px_20px_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 relative">
            <img src="/logo.png" alt="AIVANTS" className="w-full h-full object-contain" />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">
            AIVANTS
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Product", "Pricing", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-[13.5px] font-medium text-[#4a4a4a] hover:text-[#0a0a0a] transition-colors duration-200 tracking-[-0.01em]"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            state={{ mode: "login" }}
            className="hidden sm:block text-[13.5px] font-medium text-[#4a4a4a] hover:text-[#0a0a0a] transition-colors duration-200 tracking-[-0.01em]"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            state={{ mode: "signup" }}
            className="bg-[#0a0a0a] text-white text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#222] transition-all duration-200 tracking-[-0.01em]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
