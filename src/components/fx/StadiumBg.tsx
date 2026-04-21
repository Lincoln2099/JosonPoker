export default function StadiumBg() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Deep forest-green base with warm tint */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 110% 80% at 50% 45%, rgba(20,50,35,0.9) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 50% 25%, rgba(240,202,80,0.05) 0%, transparent 60%),
            linear-gradient(180deg, #0c1e14 0%, #122a1c 40%, #0e2016 100%)
          `,
        }}
      />

      {/* Warm overhead spotlight — gold light on table */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '90%',
          height: '55%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,245,200,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Green ambient glow on table area */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '80%',
          height: '60%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(45,158,85,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}
