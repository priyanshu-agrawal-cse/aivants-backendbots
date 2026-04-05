export default function Footer() {
  return (
    <footer className="py-10 px-6 bg-[#111] border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AIVANTS" className="w-6 h-6 object-contain invert opacity-60" />
          <span className="text-sm tracking-widest text-[#666] uppercase">AIVANTS</span>
        </div>
        <p className="text-xs text-[#555] text-center">
          The intelligence that a company operates through. &copy; {new Date().getFullYear()} AIVANTS. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-xs text-[#555]">
          <a href="mailto:hello@aivants.com" className="hover:text-[#888] transition-colors">hello@aivants.com</a>
        </div>
      </div>
    </footer>
  )
}
