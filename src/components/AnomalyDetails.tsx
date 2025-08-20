import React from 'react';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Clock, 
  Activity, 
  XCircle, 
  Eye, 
  Zap,
  Server,
  Target,
  Terminal
} from 'lucide-react';

export interface TimelineEvent {
  timestamp: string;
  action: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface Anomaly {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  affected: string;
  status: 'active' | 'investigating' | 'resolved';
  src_ip?: string;
  eventid?: string;
  session?: string;
  source?: string;
  timeline?: TimelineEvent[];
  suggestions?: string[];
  [key: string]: string | string[] | TimelineEvent[] | undefined;
}

interface AnomalyDetailsProps {
  anomaly: Anomaly;
  onBack: () => void;
}

const AnomalyDetails: React.FC<AnomalyDetailsProps> = ({ anomaly, onBack }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-green-400 bg-green-400/10 border-green-400/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'investigating': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'resolved': return 'text-green-400 bg-green-400/10 border-green-400/30';
      default: return 'text-green-400 bg-green-400/10 border-green-400/30';
    }
  };

  const getTimelineStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-400';
      case 'warning': return 'text-yellow-400 bg-yellow-400';
      case 'error': return 'text-red-400 bg-red-400';
      case 'info': return 'text-blue-400 bg-blue-400';
      default: return 'text-green-400 bg-green-400';
    }
  };

  if (!anomaly) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg">Anomaly not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-green-400/10 border border-green-400/30 rounded text-green-400 hover:bg-green-400/20 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-x-hidden">
      {/* Matrix Rain Background Effect */}
      <div className="fixed inset-0 opacity-5 select-none pointer-events-none">
        <div className="matrix-rain">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {Array.from({ length: 15 }).map((_, j) => (
                <div key={j} className="text-green-300/20 text-xs">
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-green-500/30 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-12 xl:px-16 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-3 py-2 bg-green-400/10 border border-green-400/30 rounded hover:bg-green-400/20 transition-all hover:shadow-lg hover:shadow-green-400/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">BACK</span>
            </button>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h1 className="text-xl font-bold text-green-400 tracking-wider">
                ANOMALY DETAILS
              </h1>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">LIVE MONITORING</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 lg:px-12 xl:px-16 py-6 space-y-6">
        {/* Anomaly Overview */}
        <div className="bg-black/60 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">{anomaly.type}</h2>
              <p className="text-green-300/80 text-lg leading-relaxed">{anomaly.description}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <span className={`px-3 py-1 rounded text-sm font-bold border ${getSeverityColor(anomaly.severity)}`}>
                {anomaly.severity.toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded text-sm font-bold border ${getStatusColor(anomaly.status)}`}>
                {anomaly.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-400/5 border border-green-400/20 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">DETECTED</span>
              </div>
              <p className="text-green-300 text-sm">{new Date(anomaly.timestamp).toLocaleString()}</p>
            </div>


            <div className="bg-green-400/5 border border-green-400/20 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Server className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">ATTACKER</span>
              </div>
              <p className="text-green-300 text-sm">{anomaly.affected}</p>
            </div>

            <div className="bg-green-400/5 border border-green-400/20 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">EVENT ID</span>
              </div>
              <p className="text-green-300 text-sm font-mono">{anomaly.eventid || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Technical Details (from anomaly object) */}
          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center space-x-2">
              <Terminal className="w-5 h-5" />
              <span>TECHNICAL DETAILS</span>
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-green-500/70 text-sm">Source</span>
                <p className="text-green-300 font-mono">{anomaly.source || 'N/A'}</p>
              </div>
              <div>
                <span className="text-green-500/70 text-sm">Timestamp</span>
                <p className="text-green-300 font-mono">{anomaly.timestamp}</p>
              </div>
              <div>
                <span className="text-green-500/70 text-sm">Description</span>
                <p className="text-green-300 text-sm break-all">
                  {anomaly.src_ip ? (
                    <>
                      <span className={anomaly.severity === 'critical' ? "text-red-400" : "text-green-300"}>{anomaly.src_ip}</span>
                      {': ' + anomaly.description}
                    </>
                  ) : (
                    anomaly.description
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-400 mb-6 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>INCIDENT TIMELINE</span>
            </h3>
            <div className="space-y-4">
              {(anomaly.timeline || []).map((event: TimelineEvent, index: number) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${getTimelineStatusColor(event.status).split(' ')[1]}`}></div>
                    {index < (anomaly.timeline?.length || 0) - 1 && (
                      <div className="w-0.5 h-8 bg-green-400/30 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-300 text-sm">{event.action}</span>
                      <span className="text-green-500/70 text-xs">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-black/60 border border-green-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>SECURITY RECOMMENDATIONS</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(anomaly.suggestions || []).map((suggestion: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-400/5 border border-yellow-400/20 rounded hover:bg-yellow-400/10 transition-all">
                <Eye className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300 text-sm leading-relaxed">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnomalyDetails;