const items = ['tools', 'dashboards', 'conversations', 'tasks', 'departments']

export default function Environment() {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-5">The Shift</p>
            <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] leading-tight mb-8">
              AIVANTS is not introduced<br />
              <span className="font-display italic text-[#6b5e4e]">into</span> a company.
            </h2>
            <p className="text-lg text-[#555] font-light leading-relaxed mb-4">
              It becomes the environment in which the company operates.
            </p>
            <p className="text-base text-[#888] font-light leading-relaxed">
              AIVANTS is that system. A single, continuous structure where everything is connected.
            </p>
          </div>

          <div>
            <div className="glass-card rounded-2xl p-8">
              <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-6">What used to be</p>
              <div className="space-y-3 mb-8">
                {items.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#d4cfc7]" />
                    <span className="text-[#888] font-light text-sm line-through decoration-[#ccc]">{item}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#ebe8e2] pt-6">
                <p className="text-xs tracking-widest text-[#b0a898] uppercase mb-4">Becomes</p>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#6b5e4e]" />
                  <span className="text-[#1a1a1a] font-medium">a single, continuous system</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* One structure */}
        <div className="mt-24 text-center">
          <div className="inline-block px-5 py-2 rounded-full border border-[#d8d4cc] text-xs tracking-widest text-[#888] uppercase mb-10">One Structure</div>
          <p className="text-2xl md:text-3xl font-light text-[#333] max-w-3xl mx-auto leading-relaxed">
            There are no boundaries inside AIVANTS. Not between marketing and sales, sales and delivery, delivery and operations, operations and internal coordination.
          </p>
          <p className="mt-6 text-lg text-[#888] font-light">Everything exists as one connected state. Every action affects another part. Every change propagates.</p>
        </div>

        {/* Grid connections */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Marketing', 'Sales', 'Delivery', 'Operations'].map((dept, i) => (
            <div key={dept} className="relative p-5 rounded-xl glass-card text-center">
              <div className="text-sm font-medium text-[#333] mb-1">{dept}</div>
              <div className="text-xs text-[#aaa]">Connected</div>
              {i < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-px bg-[#d4cfc7]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
