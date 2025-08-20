import React, { useState, useEffect } from "react";
import AnomalyDetails, { Anomaly } from "./AnomalyDetails";
import { getLogSummary } from "../utils/openrouter";

import {
  Shield,
  Activity,
  AlertTriangle,
  Eye,
  Terminal,
  Clock,
  TrendingUp,
  HardDrive,
  Cpu,
  Play,
  Pause,
  MessageSquare,
  X,
  Loader2,
} from "lucide-react";

interface RawLogData {
  message: string;
  timestamp: string;
  "@timestamp"?: string;
  source: string;
  level?: string;
  session?: string;
  eventid?: string;
  src_ip?: string;
  sensor?: string;
  username?: string;
  password?: string;
  input?: string;
  event?: {
    src_ip?: string;
  };
  [key: string]: string | { src_ip?: string } | undefined;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  source: string;
  anomaly?: boolean;
  session?: string;
  eventid?: string;
  src_ip?: string;
}

interface Stats {
  totalRequests: number;
  anomaliesDetected: number;
  uptime: string;
  activeConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  responseTime: number;
  requestHistory: number[];
  anomalyHistory: number[];
  connectionHistory: number[];
}

const Dashboard: React.FC = () => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLLMOpen, setIsLLMOpen] = useState(false);
  const [isAttackCloudOpen, setIsAttackCloudOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attackStats, setAttackStats] = useState<{
    type: string;
    count: number;
    severity: "low" | "medium" | "high" | "critical";
  }[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    anomaliesDetected: 0,
    uptime: "0",
    activeConnections: 0,
    cpuUsage: 30,
    memoryUsage: 85.2,
    diskUsage: 23,
    responseTime: 124,
    requestHistory: Array(20).fill(0),
    anomalyHistory: Array(20).fill(0),
    connectionHistory: Array(20).fill(0),
  });
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Ref for real-time logs container (autoscroll disabled)
  const logsContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch real-time logs from URL
  // Calculate attack statistics from logs
  const calculateAttackStats = (logs: LogEntry[]) => {
    const attackCounts: { [key: string]: { count: number; severity: "low" | "medium" | "high" | "critical" } } = {};
    
    logs.forEach(log => {
      if (log.anomaly) {
        let attackType = "Unknown Attack";
        let severity: "low" | "medium" | "high" | "critical" = "medium";

        // Determine attack type from message
        if (typeof log.message === 'string') {
          if (log.message.toLowerCase().includes("login attempt") && log.message.toLowerCase().includes("failed")) {
            attackType = "Failed Login Attempt";
            severity = "high";
          } else if (log.message.toLowerCase().includes("suspicious command")) {
            attackType = "Suspicious Command";
            severity = "critical";
          } else if (log.message.toLowerCase().includes("ssh")) {
            attackType = "SSH Activity";
            severity = "medium";
          } else if (log.message.toLowerCase().includes("connection")) {
            attackType = "Suspicious Connection";
            severity = "low";
          }
        }

        if (!attackCounts[attackType]) {
          attackCounts[attackType] = { count: 0, severity };
        }
        attackCounts[attackType].count++;
      }
    });

    // Convert to array and sort by count
    return Object.entries(attackCounts)
      .map(([type, data]) => ({
        type,
        count: data.count,
        severity: data.severity
      }))
      .sort((a, b) => b.count - a.count);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("https://little-bullfrog-34.telebit.io/");
        const text = await response.text();
        console.log("RAW HTML:", text); // See the actual structure

        // Regex for <h2>System Stats</h2> followed by <pre><code>...</code></pre>
        const statsMatch = text.match(
          /<h2[^>]*>System Stats<\/h2>[\s\S]*?<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/
        );
        console.log("StatsMatch:", statsMatch);

        // Regex for <h2>Latest Logs</h2> followed by <pre><code>...</code></pre>
        const logsMatch = text.match(
          /<h2[^>]*>Latest Logs<\/h2>[\s\S]*?<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/
        );
        console.log("LogsMatch:", logsMatch);

        // Helper to decode HTML entities (e.g., &#34; → ")
        function decodeHTMLEntities(str: string) {
          return str
            .replace(/&#34;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&");
        }

        let statsData = null;
        let logsData = [];

        if (statsMatch) {
          try {
            const statsJson = decodeHTMLEntities(statsMatch[1].trim());
            statsData = JSON.parse(statsJson);
          } catch (e) {
            console.error("Failed to parse stats JSON:", e);
          }
        }

        if (logsMatch) {
          try {
            const logsJson = decodeHTMLEntities(logsMatch[1].trim());
            logsData = JSON.parse(logsJson);
          } catch (e) {
            console.error("Failed to parse logs JSON:", e);
          }
        }

        // Update stats if available
        if (statsData) {
          setStats((prev) => ({
            ...prev,
            totalRequests:
              typeof statsData.total_requests === "number" &&
              !isNaN(statsData.total_requests)
                ? statsData.total_requests
                : prev.totalRequests,
            cpuUsage:
              typeof statsData.cpu_load === "number" &&
              !isNaN(statsData.cpu_load)
                ? statsData.cpu_load
                : prev.cpuUsage,
            memoryUsage:
              typeof statsData.ram_usage === "number" &&
              !isNaN(statsData.ram_usage)
                ? statsData.ram_usage
                : prev.memoryUsage,
            uptime: statsData.uptime ?? prev.uptime,
            // ...other stats fields as needed
          }));
        }

        // Update logs if available
          if (logsData.length > 0) {
            const processedLogs = logsData.map((log: RawLogData) => {
              let level: LogEntry["level"] = "info";
              let anomaly = false;
              let customMessage = typeof log.message === 'string' ? log.message : "No message";            // List of suspicious/hacking commands
            const hackingCommands = [
              "uname -a", "uname", "whoami", "cat /etc/passwd",
              "sudo", "cat /etc/shadow", "id", "netstat",
              "history", "find /", "nc", "ssh", "chmod"
            ];

            // Check for login failures (critical)
            if (typeof log.message === 'string' && 
                log.message.toLowerCase().includes("login attempt") && 
                log.message.toLowerCase().includes("failed")) {
              level = "critical";
              anomaly = true;
            }
            // Check for command inputs
            else if (log.eventid?.includes("command.input") && typeof log.input === 'string') {
              const isHackingCommand = hackingCommands.some(cmd => 
                log.input?.toLowerCase().includes(cmd.toLowerCase())
              );
              if (isHackingCommand) {
                level = "critical";
                anomaly = true;
                customMessage = `Suspicious command detected: ${log.input}`;
              } else {
                // Command not found or normal commands should be warnings
                level = "warning";
                customMessage = `Command input: ${log.input}`;
              }
            }
            // Then check for SSH/Connection related events - these should be warnings
            else if (
              log.eventid?.includes("session.connect") || 
              log.eventid?.includes("new connection") ||
              (typeof log.message === 'string' && (
                log.message.toLowerCase().includes("ssh client") ||
                log.message.toLowerCase().includes("remote ssh") ||
                log.message.toLowerCase().includes("connection lost") ||
                log.message.toLowerCase().includes("closing tty")
              ))
            ) {
              level = "warning";
            }
            // Then check for successful logins
            else if (log.eventid?.includes("login.success")) {
              level = "info";
            }

            return {
              id:
                (log.session ? log.session + "_" : "") +
                (log["@timestamp"] ? log["@timestamp"] : "") +
                (log.message ? "_" + log.message.slice(0, 16) : "") +
                "_" +
                Math.random().toString(36).substr(2, 5),
              timestamp: log["@timestamp"],
              level,
              message: customMessage,
              source: log.sensor || "system",
              anomaly,
              eventid: log.eventid,
              src_ip: log.src_ip,
            };
          });
          setLogs(processedLogs);

          // Calculate and update attack statistics
          const newAttackStats = calculateAttackStats(processedLogs);
          setAttackStats(newAttackStats);

          // Update anomalies
          // Group logs by source IP to track related activities
          const ipActivities = processedLogs.reduce((acc: { [key: string]: LogEntry[] }, log: LogEntry) => {
            if (log.src_ip) {
              if (!acc[log.src_ip]) acc[log.src_ip] = [];
              acc[log.src_ip].push(log);
            }
            return acc;
          }, {});

          const anomaliesArr = processedLogs
            .filter((log: LogEntry) => log.anomaly)
            .map((log: LogEntry) => {
              // Get related logs for this IP
              const relatedLogs = log.src_ip ? ipActivities[log.src_ip] : [];
              
              // Determine anomaly type and set appropriate recommendations
              const isLoginAttempt = (typeof log.message === 'string' && log.message.toLowerCase().includes('login')) || 
                                   (typeof log.eventid === 'string' && log.eventid.toLowerCase().includes('auth'));
              const isCommandExecution = (typeof log.message === 'string' && (
                                       log.message.toLowerCase().includes('command') || 
                                       log.message.toLowerCase().includes('running')));
              
              let suggestions: string[] = [];
              if (isLoginAttempt) {
                suggestions = [
                  "Enable two-factor authentication for all user accounts",
                  "Review and update password policies",
                  "Implement account lockout after multiple failed attempts",
                  "Monitor for brute force patterns from this IP address",
                  "Consider blocking this IP address if attempts persist"
                ];
              } else if (isCommandExecution) {
                suggestions = [
                  "Review and restrict command execution permissions",
                  "Implement command auditing and logging",
                  "Enable file integrity monitoring",
                  "Review system user permissions",
                  "Consider implementing application whitelisting"
                ];
              }

              // Create timeline of events - only last 5 events before this anomaly
              const timeline = relatedLogs
                .sort((a: LogEntry, b: LogEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort in reverse chronological order
                .filter((event: LogEntry) => new Date(event.timestamp) <= new Date(log.timestamp)) // Only events before or at the anomaly time
                .slice(0, 5) // Take only the last 5 events
                .reverse() // Reverse back to chronological order
                .map((event: LogEntry) => ({
                  timestamp: event.timestamp,
                  action: event.message,
                  status: event.level as 'info' | 'warning' | 'error'
                }));

              return {
                id: log.id,
                timestamp: log.timestamp,
                severity: log.level === "error" ? "high" : "medium",
                type: isLoginAttempt ? "Authentication Attack" : 
                      isCommandExecution ? "Command Execution" : 
                      log.eventid?.split(".")[1] || "unknown",
                description: log.message,
                affected: log.src_ip || "unknown",
                status: "active",
                session: log.session || "N/A",
                eventid: log.eventid || "N/A",
                source: log.source || "system",
                timeline,
                suggestions,
                relatedLogs: relatedLogs.map((rlog: LogEntry) => ({
                  timestamp: rlog.timestamp,
                  level: rlog.level,
                  message: rlog.message,
                  source: rlog.source
                }))
              };
            });
          setAnomalies(anomaliesArr);
          setStats((prev) => ({
            ...prev,
            anomaliesDetected: anomaliesArr.length,
          }));
        } else {
          setLogs([]);
          setAnomalies([]);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
        setLogs([]);
        setAnomalies([]);
      }
    };

    fetchLogs();
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isMonitoring) {
      interval = setInterval(fetchLogs, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "text-green-400"; // Back to green for normal logs
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      case "critical":
        return "text-red-500";
      default:
        return "text-green-400";
    }
  };

  const getSeverityColor = (severity: Anomaly["severity"]) => {
    switch (severity) {
      case "low":
        return "text-blue-400 bg-blue-400/10";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10";
      case "high":
        return "text-orange-400 bg-orange-400/10";
      case "critical":
        return "text-red-400 bg-red-400/10";
    }
  };

  const getStatusColor = (status: Anomaly["status"]) => {
    switch (status) {
      case "active":
        return "text-red-400 bg-red-400/10";
      case "investigating":
        return "text-yellow-400 bg-yellow-400/10";
      case "resolved":
        return "text-green-400 bg-green-400/10";
    }
  };

  const getIpColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return "text-green-400"; // Back to green for normal logs
      case "warning":
        return "text-yellow-400";
      case "error":
      case "critical":
        return "text-red-400";
      default:
        return "text-green-400";
    }
  };

  // Mini Chart Component
  const MiniChart: React.FC<{
    data: number[];
    color?: string;
    type?: "line" | "bar";
  }> = ({ data, color = "#00FF41", type = "line" }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end space-x-1 h-12 w-full">
        {data.map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div key={index} className="flex-1 relative group">
              {type === "line" ? (
                <div
                  className="w-full bg-gradient-to-t from-green-400/20 to-green-400/60 rounded-sm transition-all duration-300 hover:from-green-400/40 hover:to-green-400/80"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: color + "40",
                    borderTop: `2px solid ${color}`,
                  }}
                />
              ) : (
                <div
                  className="w-full bg-green-400/30 rounded-sm transition-all duration-300 hover:bg-green-400/50"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: color + "40",
                  }}
                />
              )}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-green-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-green-400/30">
                {value}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const CircularProgress: React.FC<{
    percentage: number;
    size?: number;
    color?: string;
  }> = ({ percentage, size = 60, color = "#00FF41" }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(34, 197, 94, 0.1)"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 drop-shadow-sm"
            style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-green-400">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    );
  };

  // Show anomaly details page if an anomaly is selected
  if (selectedAnomaly) {
    return (
      <AnomalyDetails
        anomaly={selectedAnomaly}
        onBack={() => setSelectedAnomaly(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-x-hidden">
      {/* Matrix Rain Background Effect */}
      <div className="fixed inset-0 opacity-5 select-none pointer-events-none">
        <div className="matrix-rain">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              {Array.from({ length: 20 }).map((_, j) => (
                <div key={j} className="text-green-300/20 text-xs">
                  {String.fromCharCode(0x30a0 + Math.random() * 96)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-green-500/30 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-green-400 animate-pulse" />
              <h1 className="text-2xl font-bold text-green-400 tracking-wider">
                SERVER SHIELD
              </h1>
              <span className="text-xs text-green-500/70 bg-green-500/10 px-2 py-1 rounded border border-green-500/30">
                v2.4.1
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">ONLINE</span>
              </div>

              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`flex items-center space-x-2 px-3 py-1 rounded border transition-all hover:shadow-lg hover:shadow-green-400/20 ${
                  isMonitoring
                    ? "bg-green-400/10 border-green-400/50 text-green-400"
                    : "bg-red-400/10 border-red-400/50 text-red-400"
                }`}
              >
                {isMonitoring ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {isMonitoring ? "PAUSE" : "RESUME"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 lg:px-12 xl:px-16 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6 hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-400/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-500/70 text-sm uppercase tracking-wider">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.totalRequests.toLocaleString()}
                </p>
                <div className="mt-3">
                  <MiniChart data={stats.requestHistory} />
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400/70" />
            </div>
          </div>

          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6 hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-400/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-500/70 text-sm uppercase tracking-wider">
                  Anomalies Detected
                </p>
                <p className="text-2xl font-bold text-red-400">
                  {stats.anomaliesDetected}
                </p>
                <div className="mt-3">
                  <MiniChart
                    data={stats.anomalyHistory}
                    color="#EF4444"
                    type="bar"
                  />
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400/70" />
            </div>
          </div>

          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6 hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-400/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-500/70 text-sm uppercase tracking-wider">
                  Uptime
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.uptime}
                </p>
                <div className="mt-3 flex justify-center">
                  <CircularProgress percentage={Math.round(100)} size={50} />
                </div>
              </div>
              <Clock className="w-8 h-8 text-green-400/70" />
            </div>
          </div>

          {/* Removed Active Connections Stat */}
        </div>
                  <div className="bg-black/60 border border-green-500/30 rounded-lg p-6 hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-400/10">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <p className="text-green-500/70 text-sm uppercase tracking-wider">
                    Active Connections
                  </p>
                  <Activity className="w-6 h-6 text-green-400/70" />
                </div>
                <div className="mt-4 space-y-2">
                  {logs
                    .reduce((acc: { ip: string; lastSeen: string; status: 'active' | 'warning' | 'danger' }[], log) => {
                      if (!log.src_ip || !log.message) return acc;
                      
                      // Add connection when we see successful authentication or connection establishment
                      if (log.message.includes('Authentication succeeded') || 
                          log.message.includes('Connection established') ||
                          log.message.includes('Terminal Size')) {
                        const existing = acc.find(item => item.ip === log.src_ip);
                        if (!existing) {
                          console.log('Adding new connection:', log.src_ip);
                          acc.push({
                            ip: log.src_ip,
                            lastSeen: log.timestamp,
                            status: log.level === 'critical' ? 'danger' : 
                                   log.level === 'warning' ? 'warning' : 'active'
                          });
                        } else {
                          existing.lastSeen = log.timestamp;
                          existing.status = log.level === 'critical' ? 'danger' : 
                                          log.level === 'warning' ? 'warning' : 'active';
                        }
                      }
                      
                      // Remove connection when we see a disconnection or connection lost message
                      if (log.message.includes('Connection lost') || 
                          log.message.includes('Disconnected') ||
                          log.message.includes('Connection closed')) {
                        console.log('Removing connection:', log.src_ip);
                        return acc.filter(item => item.ip !== log.src_ip);
                      }
                      
                      return acc.slice(0, 5); // Show only 5 most recent connections
                    }, [])
                    .map(connection => (
                      <div key={connection.ip} className="flex items-center justify-between py-1 px-2 rounded bg-green-400/5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            connection.status === 'danger' ? 'bg-red-400 animate-pulse' :
                            connection.status === 'warning' ? 'bg-yellow-400' :
                            'bg-green-400'
                          }`} />
                          <span className={`text-sm ${
                            connection.status === 'danger' ? 'text-red-400' :
                            connection.status === 'warning' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {connection.ip}
                          </span>
                        </div>
                        <span className="text-xs text-green-500/70">
                          {new Date(connection.lastSeen).toLocaleTimeString('en-IN', {
                            hour12: false,
                            timeZone: 'Asia/Kolkata'
                          })}
                        </span>
                      </div>
                    ))}
                  {logs.filter(log => log.src_ip).length === 0 && (
                    <div className="text-center text-green-500/70 py-2">
                      No active connections
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


        {/* System Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-green-400" />
                <span className="text-green-400 uppercase tracking-wider">
                  CPU Usage
                </span>
              </div>
              <CircularProgress percentage={stats.cpuUsage} size={40} />
            </div>
            <div className="w-full bg-green-900/20 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${stats.cpuUsage}%` }}
              ></div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-green-500/70 mb-2">
                <span>Load Average</span>
                <span>1.2, 1.5, 1.8</span>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 bg-green-400/20 rounded-sm"
                    style={{
                      backgroundColor:
                        i < Math.floor(stats.cpuUsage / 12.5)
                          ? "#00FF41"
                          : "rgba(34, 197, 94, 0.2)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-400" />
                <span className="text-green-400 uppercase tracking-wider">
                  Memory
                </span>
              </div>
              <CircularProgress
                percentage={stats.memoryUsage}
                size={40}
                color="#F59E0B"
              />
            </div>
            <div className="w-full bg-green-900/20 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${stats.memoryUsage}%` }}
              ></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-500/70">Used</span>
                <span className="text-yellow-400">
                  {(stats.memoryUsage * 0.16).toFixed(1)}GB
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-500/70">Free</span>
                <span className="text-green-400">
                  {(16 - stats.memoryUsage * 0.16).toFixed(1)}GB
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-green-400" />
                <span className="text-green-400 uppercase tracking-wider">
                  Disk Usage
                </span>
              </div>
              <CircularProgress
                percentage={stats.diskUsage}
                size={40}
                color="#06B6D4"
              />
            </div>
            <div className="w-full bg-green-900/20 rounded-full h-2">
              <div
                className="bg-cyan-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${stats.diskUsage}%` }}
              ></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-500/70">Used</span>
                <span className="text-cyan-400">
                  {(stats.diskUsage * 5).toFixed(0)}GB
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-500/70">Available</span>
                <span className="text-green-400">
                  {(500 - stats.diskUsage * 5).toFixed(0)}GB
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Logs */}
          <div className="lg:col-span-2 bg-black/60 border border-green-500/30 rounded-lg">
            <div className="border-b border-green-500/30 p-4">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-green-400 uppercase tracking-wider">
                  Real-time Logs
                </h2>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-500">LIVE</span>
                </div>
              </div>
            </div>

            <div
              className="p-4 h-96 overflow-y-auto overflow-x-hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              ref={logsContainerRef}
            >
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start space-x-3 p-3 rounded hover:bg-green-400/5 transition-all border-l-2 ${
                      log.anomaly
                        ? "border-l-2 border-red-400 bg-red-400/5"
                        : ""
                    }`}
                  >
                    <span className="text-green-500/50 text-xs min-w-fit font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour12: false,
                        timeZone: 'Asia/Kolkata'
                      })}
                    </span>
                    <span
                      className={`text-xs font-bold min-w-fit uppercase px-2 py-1 rounded ${getLogColor(
                        log.level
                      )} bg-opacity-10`}
                    >
                      [{log.level}]
                    </span>
                    <span className="text-green-500/70 text-xs min-w-fit font-semibold">
                      {log.source}:
                    </span>
                    <span className="text-green-300 text-xs flex-1 leading-relaxed">
                      {log.src_ip && (
                        <span className={`${getIpColor(log.level)} font-bold`}>
                          {log.src_ip}
                          {": "}
                        </span>
                      )}
                      {log.message}
                    </span>
                    {log.anomaly && (
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4 text-red-400 animate-pulse" />
                        <span className="text-red-400 text-xs font-bold">
                          ANOMALY
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Reports */}
        <div className="bg-black/60 border border-green-500/30 rounded-lg">
          <div className="border-b border-green-500/30 p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-bold text-green-400 uppercase tracking-wider">
                Anomaly Reports
              </h2>
            </div>
          </div>

          <div
            className="p-4 h-96 overflow-y-auto overflow-x-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="space-y-3">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="border border-green-500/20 rounded-lg p-4 hover:border-green-400/40 transition-all cursor-pointer hover:bg-green-400/5"
                  onClick={() => setSelectedAnomaly(anomaly)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-bold text-sm">
                      {anomaly.type}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getSeverityColor(
                          anomaly.severity
                        )}`}
                      >
                        {anomaly.severity.toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getStatusColor(
                          anomaly.status
                        )}`}
                      >
                        {anomaly.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-green-300/80 text-sm mb-2">
                    {anomaly.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-green-500/70">
                    <span>Affected: {anomaly.affected}</span>
                    <div className="flex items-center space-x-2">
                      <span>
                        {new Date(anomaly.timestamp).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour12: false
                        })}
                      </span>
                      <span className="text-green-400 hover:text-green-300">
                        → View Details
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attack Cloud Popup */}
      {isAttackCloudOpen && (
        <div className="fixed bottom-[440px] right-6 z-50 w-[480px]">
          <div className="bg-black/90 border border-green-500/30 rounded-lg shadow-lg shadow-green-400/20">
            <div className="border-b border-green-500/30 p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-green-400 font-semibold">Attack Patterns</h3>
                </div>
                <button 
                  onClick={() => setIsAttackCloudOpen(false)}
                  className="text-green-400 hover:text-green-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {attackStats.map((stat, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 rounded-full border text-sm flex items-center gap-2 ${
                      stat.severity === 'critical' ? 'border-red-400 text-red-400 bg-red-400/10' :
                      stat.severity === 'high' ? 'border-orange-400 text-orange-400 bg-orange-400/10' :
                      stat.severity === 'medium' ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' :
                      'border-blue-400 text-blue-400 bg-blue-400/10'
                    }`}
                    style={{
                      fontSize: `${Math.min(1 + (stat.count / 10) * 0.5, 1.5)}rem`
                    }}
                  >
                    {stat.type}
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-xs">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LLM Chat Popup */}
      {isLLMOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[480px]">
          <div className="bg-black/90 border border-green-500/30 rounded-lg shadow-lg shadow-green-400/20">
            {/* Chat Header */}
            <div className="border-b border-green-500/30 p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="text-green-400 font-semibold">Support Team</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setAnswer("");
                      setQuestion("");
                    }}
                    className="text-green-400 hover:text-green-300 px-2 py-1 text-sm border border-green-400/30 rounded"
                    title="Clear chat"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={() => setIsLLMOpen(false)}
                    className="text-green-400 hover:text-green-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-green-500/70 mt-1">Analyzing logs in real-time</div>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-2 items-start">
                <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-3 text-sm text-green-300">
                  Hi there! 🤖 How can I help analyze your logs today?
                </div>
              </div>
              {answer && (
                <div className="flex gap-2 items-start">
                  <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-3 text-sm text-green-300 whitespace-pre-wrap">
                    {answer}
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-green-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing logs...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!question.trim() || isLoading) return;

                setIsLoading(true);
                setAnswer("");

                try {
                  const logMessages = logs.map(
                    (log) => `[${log.level}] ${log.source}: ${log.message}`
                  );
                  const response = await getLogSummary(logMessages, question);
                  setAnswer(response || "No response from AI");
                } catch (error) {
                  console.error("Error getting log summary:", error);
                  setAnswer("Failed to analyze logs. Please try again.");
                }

                setIsLoading(false);
                setQuestion("");
              }}
              className="border-t border-green-500/30 p-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about suspicious activities..."
                  className="flex-1 bg-black/50 border border-green-500/30 rounded px-3 py-2 text-sm text-green-400 placeholder:text-green-500/50 focus:outline-none focus:border-green-400/50"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-400/10 border border-green-400/50 text-green-400 px-3 py-2 rounded hover:bg-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ask
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attack Cloud Toggle Button */}
      <button
        onClick={() => setIsAttackCloudOpen(true)}
        className="fixed bottom-[88px] right-6 bg-red-400/10 border border-red-400/50 text-red-400 p-3 rounded-full hover:bg-red-400/20 shadow-lg hover:shadow-red-400/20 transition-all"
        title="View Attack Patterns"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>

      {/* LLM Toggle Button */}
      <button
        onClick={() => setIsLLMOpen(true)}
        className="fixed bottom-6 right-6 bg-green-400/10 border border-green-400/50 text-green-400 p-3 rounded-full hover:bg-green-400/20 shadow-lg hover:shadow-green-400/20 transition-all"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard;
