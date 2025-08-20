import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Zap, 
  Terminal, 
  ArrowRight,
  Play,
  ChevronDown,
  Lock,
  Target,
  Radar
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentChar, setCurrentChar] = useState(0);

  const fullText = "AI-POWERED ANOMALY DETECTION";

  // Typing animation effect
  useEffect(() => {
    if (currentChar < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prev => prev + fullText[currentChar]);
        setCurrentChar(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentChar, fullText]);

  // Visibility animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Feature rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Radar,
      title: "REAL-TIME MONITORING",
      description: "24/7 surveillance of all system activities with instant alerts and automated response protocols for immediate threat mitigation.",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/30"
    },
    {
      icon: Target,
      title: "PRECISION ANALYTICS",
      description: "Deep forensic analysis provides detailed insights into attack vectors, helping strengthen your security posture.",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      borderColor: "border-orange-400/30"
    },
    {
      icon: Lock,
      title: "AUTOMATED DEFENSE",
      description: "Intelligent response systems automatically block threats, quarantine suspicious activities, and maintain system integrity.",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/30"
    }
  ];

  const stats = [
    { label: "THREATS BLOCKED", value: "99.7%", icon: Shield },
    { label: "RESPONSE TIME", value: "<100ms", icon: Zap },
    { label: "UPTIME", value: "99.99%", icon: Activity },
    { label: "FALSE POSITIVES", value: "<1%", icon: Target }
  ];

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-x-hidden">
      {/* Animated Matrix Background */}
      <div className="fixed inset-0 opacity-10 select-none pointer-events-none">
        <div className="matrix-rain">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              {Array.from({ length: 25 }).map((_, j) => (
                <div key={j} className="text-green-300/30 text-xs">
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className={`text-center transform transition-all duration-2000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Main Logo */}
          <div className="mb-8 relative">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <Shield className="w-20 h-20 text-green-400 animate-pulse" />
                <div className="absolute inset-0 w-20 h-20 border-2 border-green-400/30 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-green-400 tracking-wider mb-4 relative">
              SERVER SHIELD
              <div className="absolute -inset-1 bg-green-400/20 blur-xl -z-10 animate-pulse"></div>
            </h1>
          </div>

          {/* Typing Animation */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-4xl text-green-300 tracking-widest">
              {typedText}
              <span className="animate-blink">|</span>
            </h2>
          </div>

          {/* CTA Button */}
          <button
            onClick={onEnterDashboard}
            className="group relative px-12 py-4 bg-green-400/10 border-2 border-green-400/50 rounded-lg text-green-400 font-bold text-xl tracking-wider hover:bg-green-400/20 hover:border-green-400 transition-all duration-300 hover:shadow-2xl hover:shadow-green-400/30 transform hover:scale-105"
          >
            <span className="flex items-center space-x-3">
              <Terminal className="w-6 h-6" />
              <span>ACCESS CONTROL PANEL</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-green-400/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
          </button>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-green-400/70" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-green-400 mb-4 tracking-wider">SYSTEM PERFORMANCE</h3>
            <div className="w-24 h-1 bg-green-400 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`bg-black/60 border border-green-500/30 rounded-lg p-8 text-center hover:border-green-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-green-400/20 transform hover:scale-105 ${isVisible ? 'animate-pulse' : ''}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <stat.icon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-green-400 mb-2">{stat.value}</div>
                <div className="text-green-300/70 text-sm tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 px-6 bg-green-400/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-green-400 mb-4 tracking-wider">ADVANCED CAPABILITIES</h3>
            <div className="w-24 h-1 bg-green-400 mx-auto mb-8"></div>
            <p className="text-green-300/80 text-lg max-w-3xl mx-auto leading-relaxed">
              Cutting-edge security technology powered by artificial intelligence and machine learning algorithms
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Display */}
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg border transition-all duration-500 cursor-pointer ${
                    currentFeature === index
                      ? `${feature.bgColor} ${feature.borderColor} shadow-lg transform scale-105`
                      : 'bg-black/40 border-green-500/20 hover:border-green-400/30'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <feature.icon className={`w-8 h-8 ${currentFeature === index ? feature.color : 'text-green-400/70'} transition-colors`} />
                    <div>
                      <h4 className={`text-lg font-bold mb-2 tracking-wider ${currentFeature === index ? feature.color : 'text-green-400'}`}>
                        {feature.title}
                      </h4>
                      <p className="text-green-300/80 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Display */}
            <div className="relative">
              <div className="bg-black/80 border border-green-500/30 rounded-lg p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  {(() => {
                    const CurrentIcon = features[currentFeature].icon;
                    return <CurrentIcon className={`w-24 h-24 mx-auto mb-6 ${features[currentFeature].color} animate-pulse`} />;
                  })()}
                  <h4 className={`text-2xl font-bold mb-4 ${features[currentFeature].color}`}>
                    {features[currentFeature].title}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${features[currentFeature].bgColor} animate-pulse`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Call to Action */}
      <section className="py-20 px-6 bg-green-400/5">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-green-400 mb-6 tracking-wider">READY TO SECURE YOUR INFRASTRUCTURE?</h3>
          <p className="text-green-300/80 text-xl mb-12 leading-relaxed">
            Join the next generation of cybersecurity with AI-powered threat detection and automated response systems.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={onEnterDashboard}
              className="group px-8 py-4 bg-green-400/10 border-2 border-green-400/50 rounded-lg text-green-400 font-bold text-lg tracking-wider hover:bg-green-400/20 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:shadow-green-400/30 transform hover:scale-105"
            >
              <span className="flex items-center justify-center space-x-3">
                <Play className="w-5 h-5" />
                <span>LAUNCH DASHBOARD</span>
              </span>
            </button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/30 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-bold tracking-wider">SERVER SHIELD v2.4.1</span>
          </div>
          <p className="text-green-500/50 text-sm">
            Advanced AI-Powered Cybersecurity Platform • Real-time Threat Detection • Automated Response
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;