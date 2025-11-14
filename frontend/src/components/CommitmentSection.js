import { useLocation } from 'react-router-dom';

const CommitmentSection = () => {
  const location = useLocation();
  
  // Only show on the home page
  const isHomePage = location.pathname === '/';

  // Don't render anything if not on home page
  if (!isHomePage) {
    return null;
  }

  return (
    <>
      {/* Our Commitment to Veterans - Only on Home page */}
      <section className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-16 sm:py-20 w-full">
        {/* Top Wave Transition */}
        <div className="absolute top-0 left-0 w-full" style={{ marginTop: '-1px', pointerEvents: 'none' }}>
          <svg className="w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: '120px', display: 'block' }}>
            <path fill="#ffffff" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-10 sm:p-16 shadow-2xl hover:shadow-purple-500/30 transition-shadow duration-300 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Our Commitment to Veterans
            </h2>
            <p className="text-lg sm:text-xl text-white/95 leading-relaxed mb-8 max-w-3xl mx-auto">
              Every member of our team is here for one reason — to serve those who've served. We're honored to help veterans receive the fair, evidence-based recognition they've earned for their service and sacrifices.
            </p>
            <p className="text-lg sm:text-xl text-white font-medium italic">
              Thank you for your service. It's our privilege to support you in return.
            </p>
          </div>
        </div>

        {/* Bottom Wave Transition */}
        <div className="absolute bottom-0 left-0 w-full" style={{ marginBottom: '-1px', pointerEvents: 'none' }}>
          <svg className="w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: '120px', display: 'block' }}>
            <path fill="#ffffff" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </section>
    </>
  );
};

export default CommitmentSection;
