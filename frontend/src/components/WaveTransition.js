const WaveTransition = ({ position = 'top', colors = { from: '#e2e8f0', to: '#ffffff' }, flip = false }) => {
  const waveData = flip 
    ? "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
    : "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z";

  return (
    <div className={`absolute w-full ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 z-10`}>
      <svg 
        className="w-full" 
        viewBox="0 0 1440 320" 
        preserveAspectRatio="none" 
        style={{ 
          height: '120px',
          display: 'block',
          transform: position === 'bottom' ? 'rotate(180deg)' : 'none'
        }}
      >
        <defs>
          <linearGradient id={`gradient-${position}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <path fill={`url(#gradient-${position})`} d={waveData}></path>
      </svg>
    </div>
  );
};

export default WaveTransition;
