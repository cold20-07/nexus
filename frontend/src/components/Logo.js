const Logo = ({ className = "w-16 h-20", showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        viewBox="0 0 500 500" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15))' }}
      >
        <defs>
          {/* Blue gradient for shield */}
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        
        {/* Outer white/light gray border - flat top */}
        <path
          d="M10 0 L490 0 L490 300 L250 500 L10 300 Z"
          fill="#F3F4F6"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        
        {/* Middle dark gray border - flat top */}
        <path
          d="M25 20 L475 20 L475 290 L250 480 L25 290 Z"
          fill="#64748B"
          stroke="#475569"
          strokeWidth="4"
        />
        
        {/* Main blue gradient shield - flat top */}
        <path
          d="M40 40 L460 40 L460 280 L250 460 L40 280 Z"
          fill="url(#shieldGradient)"
        />
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 leading-tight">
            Military Disability
          </span>
          <span className="text-xs text-slate-600">Nexus</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
