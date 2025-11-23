const Logo = ({ className = "w-16 h-20", showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/logo-removebg-preview.png" 
        alt="Military Disability Nexus Logo"
        className="w-full h-full object-contain"
        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15))' }}
      />
      
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
