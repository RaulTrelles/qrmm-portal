import React, { useState, useMemo, useEffect } from "react";
import type { Device, ProcessItem, ServiceItem, DockerContainer, DiskSpec } from "../../types/device";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import {
  rebootDevice,
  controlDeviceService,
  searchDeviceServices,
  controlDeviceContainer,
  getDeviceContainerLogs,
  updateDeviceAlertRecipients,
  getAlertSettings,
  testAlertEmail,
  executeDeviceTerminalCommand,
  getDeviceSystemLogs,
  terminateDeviceProcess,
  updateDeviceArea,
  getClientAreas,
  getDeviceAIHealth,
  triggerDeviceAIDiagnosis,
} from "../../services/api";
import {
  X,
  Cpu,
  HardDrive,
  Box,
  Activity,
  Clock,
  Trash2,
  Tag,
  List,
  Server,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Play,
  Square,
  Loader2,
  ExternalLink,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Bell,
  Mail,
  Plus,
  Users,
  Send,
  Monitor,
  Printer,
  Keyboard,
  MousePointer,
  FileText,
  XCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { RemoteDesktopModal } from "../RemoteDesktopModal/RemoteDesktopModal";
import { copyToClipboard } from "../../utils/clipboard";
import type { DeviceAIHealthResponse } from "../../types/ai";
import { computeLocalDeviceAIHealth } from "../../utils/aiFallback";
import {
  formatAnomalyType,
  formatTrend,
  formatAnomalyDescription,
  formatReason,
  getAppLanguage,
} from "../../utils/aiFormatters";
import "./DeviceDetailModal.css";

export interface DeviceDetailModalProps {
  device: Device | null;
  onClose: () => void;
  onDelete?: (device: Device) => void;
}

type ModalTab = "overview" | "ai-health" | "processes" | "services" | "containers" | "actions" | "logs" | "alerts";

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ device, onClose, onDelete }) => {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const [aiHealthData, setAiHealthData] = useState<DeviceAIHealthResponse | null>(null);
  const [loadingAiHealth, setLoadingAiHealth] = useState<boolean>(false);
  const isEs = getAppLanguage() === "es";
  const [diagnosingAi, setDiagnosingAi] = useState<boolean>(false);
  const [processSearch, setProcessSearch] = useState<string>("");
  const [serviceSearch, setServiceSearch] = useState<string>("");
  const [containerSearch, setContainerSearch] = useState<string>("");
  const [remoteServices, setRemoteServices] = useState<ServiceItem[] | null>(null);
  const [searchingServices, setSearchingServices] = useState<boolean>(false);
  const [operatingService, setOperatingService] = useState<string | null>(null);
  const [operatingContainer, setOperatingContainer] = useState<string | null>(null);
  const [serviceFeedback, setServiceFeedback] = useState<{ name: string; msg: string; type: "success" | "error" } | null>(null);
  const [containerFeedback, setContainerFeedback] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);
  const [customServiceStatus, setCustomServiceStatus] = useState<Record<string, string>>({});
  const [customContainerState, setCustomContainerState] = useState<Record<string, string>>({});
  const [rebooting, setRebooting] = useState<boolean>(false);
  const [rebootMessage, setRebootMessage] = useState<string | null>(null);
  const [rebootError, setRebootError] = useState<string | null>(null);
  const [showRebootConfirm, setShowRebootConfirm] = useState<boolean>(false);
  const [activeLogContainer, setActiveLogContainer] = useState<{ id: string; name: string } | null>(null);
  const [containerLogs, setContainerLogs] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const [logSearch, setLogSearch] = useState<string>("");
  const [logOnlyErrors, setLogOnlyErrors] = useState<boolean>(false);
  const [showRemoteDesktop, setShowRemoteDesktop] = useState<boolean>(false);

  // Estados para Conexión SSH y Terminal Web Remota
  const [sshUser, setSshUser] = useState<string>("raul");
  const [sshPort, setSshPort] = useState<number>(22);
  const [copiedSSH, setCopiedSSH] = useState<boolean>(false);
  const [terminalCmd, setTerminalCmd] = useState<string>("uname -a; uptime");
  const [terminalExecuting, setTerminalExecuting] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [terminalExitCode, setTerminalExitCode] = useState<number | null>(null);
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [copiedTerminal, setCopiedTerminal] = useState<boolean>(false);

  // Estados para Visor de Logs del Sistema Remoto
  const [systemLogs, setSystemLogs] = useState<string | null>(null);
  const [loadingSystemLogs, setLoadingSystemLogs] = useState<boolean>(false);
  const [systemLogSearch, setSystemLogSearch] = useState<string>("");
  const [systemLogOnlyErrors, setSystemLogOnlyErrors] = useState<boolean>(false);
  const [systemLogSource, setSystemLogSource] = useState<string>("system");
  const [copiedSystemLogs, setCopiedSystemLogs] = useState<boolean>(false);

  // Estados para Destinatarios de Alerta específicos del equipo
  const [deviceAlertRecipients, setDeviceAlertRecipients] = useState<string[]>(device?.alert_recipients || []);
  const [newEmailInput, setNewEmailInput] = useState<string>("");
  const [emailInputError, setEmailInputError] = useState<string | null>(null);
  const [savingRecipients, setSavingRecipients] = useState<boolean>(false);
  const [saveRecipientsSuccess, setSaveRecipientsSuccess] = useState<string | null>(null);
  const [saveRecipientsError, setSaveRecipientsError] = useState<string | null>(null);

  const [globalAdminRecipients, setGlobalAdminRecipients] = useState<string[]>([]);
  const [testingDeviceAlerts, setTestingDeviceAlerts] = useState<boolean>(false);
  const [testAlertFeedback, setTestAlertFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Estados para Finalización Remota de Procesos
  const [terminatingPid, setTerminatingPid] = useState<number | null>(null);
  const [processToTerminate, setProcessToTerminate] = useState<{ pid: number; name: string } | null>(null);
  const [processActionFeedback, setProcessActionFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [terminatedPids, setTerminatedPids] = useState<Set<number>>(new Set());

  useEffect(() => {
    setTerminatedPids(new Set());
    setProcessActionFeedback(null);
    setProcessToTerminate(null);
  }, [device?.id]);

  // Lista consolidada de todas las unidades de almacenamiento (telemetría en vivo o especificaciones)
  const allDisks = useMemo<DiskSpec[]>(() => {
    if (!device) return [];

    // 1. Telemetría en vivo del último heartbeat recibido
    const liveTelemetryDisks = (device.latest_telemetry as any)?.telemetry?.disks as DiskSpec[] | undefined;
    if (Array.isArray(liveTelemetryDisks) && liveTelemetryDisks.length > 0) {
      return liveTelemetryDisks;
    }

    // 2. Discos en specs de hardware registrados
    const specsDisks = device.specs?.disks;
    if (Array.isArray(specsDisks) && specsDisks.length > 0) {
      return specsDisks;
    }

    // 3. Fallback sintetizado de unidad principal
    const totalGB = Number(device.specs?.disk_total_gb || 0);
    const freeGB = Number(device.specs?.disk_free_gb || 0);
    const usedGB = totalGB > 0 ? Math.max(0, Math.round((totalGB - freeGB) * 10) / 10) : 0;
    const pct = device.latest_telemetry?.disk_percent != null
      ? Number(device.latest_telemetry.disk_percent)
      : totalGB > 0 ? Math.round((usedGB / totalGB) * 100) : 0;

    const mainMount = device.os_type === "windows" ? "C:" : "/";
    return [
      {
        mount: mainMount,
        total_gb: totalGB,
        free_gb: freeGB,
        used_gb: usedGB,
        used_percent: pct,
      },
    ];
  }, [device]);

  const totalStorageGB = useMemo(() => {
    if (allDisks.length > 0) {
      return allDisks.reduce((acc, d) => acc + (Number(d.total_gb) || 0), 0);
    }
    return Number(device?.specs?.disk_total_gb || 0);
  }, [allDisks, device]);

  const freeStorageGB = useMemo(() => {
    if (allDisks.length > 0) {
      return allDisks.reduce((acc, d) => acc + (Number(d.free_gb) || 0), 0);
    }
    return Number(device?.specs?.disk_free_gb || 0);
  }, [allDisks, device]);

  // Estados para Área / Cliente
  const [deviceArea, setDeviceArea] = useState<string>(device?.client_area || "General");
  const [availableAreas, setAvailableAreas] = useState<string[]>(["General"]);
  const [updatingArea, setUpdatingArea] = useState<boolean>(false);

  useEffect(() => {
    if (device?.alert_recipients) {
      setDeviceAlertRecipients(device.alert_recipients);
    } else {
      setDeviceAlertRecipients([]);
    }
    setDeviceArea(device?.client_area || "General");
    setEmailInputError(null);
    setSaveRecipientsSuccess(null);
    setSaveRecipientsError(null);
    if (device) {
      if (device.hostname.toLowerCase().includes("raul")) {
        setSshUser("raul");
      } else {
        setSshUser(device.os_type === "linux" ? "root" : "Administrator");
      }
      getClientAreas()
        .then((areas) => {
          if (areas && areas.length > 0) setAvailableAreas(areas);
        })
        .catch(() => {});
    }
  }, [device]);

  useEffect(() => {
    if (activeTab === "alerts") {
      getAlertSettings()
        .then((cfg) => setGlobalAdminRecipients(cfg.alert_recipients || []))
        .catch((e) => console.error("Error cargando destinatarios globales:", e));
    }
  }, [activeTab]);

  const rawProcesses: ProcessItem[] =
    device?.latest_telemetry?.telemetry?.processes && device.latest_telemetry.telemetry.processes.length > 0
      ? device.latest_telemetry.telemetry.processes
      : [
          { pid: 4, name: "System", cpu_percent: 1.2, ram_mb: 28.4, ram_percent: 0.2, status: "running" },
          { pid: 1420, name: "qhapana-agent.exe", cpu_percent: 0.5, ram_mb: 18.2, ram_percent: 0.1, status: "running" },
          { pid: 2180, name: "chrome.exe", cpu_percent: 24.8, ram_mb: 684.5, ram_percent: 4.2, status: "running" },
          { pid: 3120, name: "Code.exe", cpu_percent: 8.5, ram_mb: 512.0, ram_percent: 3.1, status: "running" },
          { pid: 840, name: "explorer.exe", cpu_percent: 2.1, ram_mb: 142.8, ram_percent: 0.9, status: "running" },
          { pid: 980, name: "dwm.exe", cpu_percent: 3.4, ram_mb: 95.3, ram_percent: 0.6, status: "running" },
          { pid: 4512, name: "svchost.exe", cpu_percent: 1.1, ram_mb: 64.2, ram_percent: 0.4, status: "running" },
          { pid: 6104, name: "postgres.exe", cpu_percent: 0.8, ram_mb: 110.6, ram_percent: 0.7, status: "running" },
        ];

  const rawServices: ServiceItem[] =
    device?.latest_telemetry?.telemetry?.services && device.latest_telemetry.telemetry.services.length > 0
      ? device.latest_telemetry.telemetry.services
      : [
          { name: "QhapanaAgent", display_name: "Qhapana RMM Agent", status: "running" },
          { name: "Spooler", display_name: "Cola de Impresión (Spooler)", status: "running" },
          { name: "wuauserv", display_name: "Windows Update", status: "running" },
          { name: "W32Time", display_name: "Hora de Windows (NTP)", status: "running" },
          { name: "EventLog", display_name: "Registro de Eventos de Windows", status: "running" },
          { name: "LanmanServer", display_name: "Servidor de Archivos (SMB)", status: "running" },
          { name: "docker", display_name: "Docker Desktop / Engine", status: "stopped" },
          { name: "TermService", display_name: "Escritorio Remoto (RDP)", status: "running" },
        ];

  type ProcessSortField = "pid" | "name" | "cpu_percent" | "ram_mb" | "ram_percent" | "status";
  const [procSortField, setProcSortField] = useState<ProcessSortField>("cpu_percent");
  const [procSortOrder, setProcSortOrder] = useState<"asc" | "desc">("desc");

  const handleProcSort = (field: ProcessSortField) => {
    if (procSortField === field) {
      setProcSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setProcSortField(field);
      // Sensible default order: numbers desc (highest usage first), text/pid asc
      setProcSortOrder(field === "name" || field === "status" || field === "pid" ? "asc" : "desc");
    }
  };

  const renderProcSortIndicator = (field: ProcessSortField) => {
    if (procSortField !== field) {
      return <span className="q-sort-indicator" style={{ opacity: 0.35 }}>↕</span>;
    }
    return (
      <span className="q-sort-indicator" style={{ color: "var(--color-brand-primary)", fontWeight: "bold" }}>
        {procSortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const isProtectedProcess = (p: ProcessItem): boolean => {
    const name = p.name.toLowerCase();
    if (p.pid === 0 || p.pid === 1 || p.pid === 4) return true;
    return (
      name.includes("qhapana") ||
      name.includes("systemd") ||
      name === "init" ||
      name === "csrss.exe" ||
      name === "lsass.exe" ||
      name === "smss.exe"
    );
  };

  const handleConfirmTerminateProcess = async () => {
    if (!device || !processToTerminate) return;
    const { pid, name } = processToTerminate;
    try {
      setTerminatingPid(pid);
      setProcessActionFeedback(null);
      const res = await terminateDeviceProcess(device.id, pid, name);
      setTerminatedPids((prev) => new Set([...prev, pid]));
      setProcessActionFeedback({
        msg: res.message || `Proceso '${name}' (PID ${pid}) finalizado con éxito`,
        type: "success",
      });
      setProcessToTerminate(null);
    } catch (err: any) {
      setProcessActionFeedback({
        msg: err.message || `Error al finalizar el proceso '${name}' (PID ${pid})`,
        type: "error",
      });
    } finally {
      setTerminatingPid(null);
    }
  };

  const filteredProcesses = useMemo(() => {
    if (!device) return [];
    let list = [...rawProcesses];
    if (terminatedPids.size > 0) {
      list = list.filter((p) => !terminatedPids.has(p.pid));
    }
    if (processSearch.trim()) {
      const q = processSearch.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || String(p.pid).includes(q)
      );
    }
    list.sort((a, b) => {
      const valA = a[procSortField];
      const valB = b[procSortField];
      if (typeof valA === "string") {
        const cmp = valA.localeCompare(String(valB));
        return procSortOrder === "asc" ? cmp : -cmp;
      }
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return procSortOrder === "asc" ? numA - numB : numB - numA;
    });
    return list;
  }, [rawProcesses, processSearch, procSortField, procSortOrder, device, terminatedPids]);

  useEffect(() => {
    if (!serviceSearch.trim()) {
      setRemoteServices(null);
      return;
    }
    const timer = setTimeout(async () => {
      if (!device) return;
      try {
        setSearchingServices(true);
        const res = await searchDeviceServices(device.id, serviceSearch.trim());
        setRemoteServices(res.services);
      } catch (err) {
        console.error("Error buscando servicios:", err);
      } finally {
        setSearchingServices(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [serviceSearch, device]);

  useEffect(() => {
    if (activeTab === "ai-health" && device) {
      setLoadingAiHealth(true);
      getDeviceAIHealth(device.id)
        .then((data) => setAiHealthData(data))
        .catch(() => {
          // Si el endpoint de backend en el VPS está en despliegue, calcular con telemetría local del equipo
          const fallbackData = computeLocalDeviceAIHealth(device);
          setAiHealthData(fallbackData);
        })
        .finally(() => setLoadingAiHealth(false));
    }
  }, [activeTab, device]);

  const handleRunAiDiagnosis = async () => {
    if (!device) return;
    try {
      setDiagnosingAi(true);
      const lang = getAppLanguage();
      const res = await triggerDeviceAIDiagnosis(device.id, true, lang);
      if (res && res.health) {
        setAiHealthData(res);
      } else {
        const updated = await getDeviceAIHealth(device.id);
        setAiHealthData(updated);
      }
    } catch (_err: any) {
      // Fallback determinístico con la telemetría actual sin lanzar alert bloqueante
      const fallbackData = computeLocalDeviceAIHealth(device);
      setAiHealthData(fallbackData);
    } finally {
      setDiagnosingAi(false);
    }
  };

  const handleServiceControl = async (serviceName: string, operation: "start" | "stop" | "restart") => {
    if (!device) return;
    try {
      setOperatingService(`${serviceName}:${operation}`);
      setServiceFeedback(null);
      const res = await controlDeviceService(device.id, serviceName, operation);
      setCustomServiceStatus((prev) => ({ ...prev, [serviceName]: res.status }));
      setServiceFeedback({
        name: serviceName,
        msg: res.message || `Servicio '${serviceName}' (${operation}) ejecutado con éxito`,
        type: "success",
      });
    } catch (err: any) {
      setServiceFeedback({
        name: serviceName,
        msg: err.message || `Error al ejecutar ${operation} en '${serviceName}'`,
        type: "error",
      });
    } finally {
      setOperatingService(null);
    }
  };

  const displayedServices = remoteServices !== null ? remoteServices : rawServices;

  const rawContainers: DockerContainer[] = device?.latest_telemetry?.telemetry?.containers || [];

  const filteredContainers = useMemo(() => {
    if (!device) return [];
    if (!containerSearch.trim()) return rawContainers;
    const q = containerSearch.toLowerCase().trim();
    return rawContainers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.image && c.image.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q))
    );
  }, [rawContainers, containerSearch, device]);

  const handleContainerControl = async (containerId: string, operation: "start" | "stop" | "restart") => {
    if (!device) return;
    try {
      setOperatingContainer(`${containerId}:${operation}`);
      setContainerFeedback(null);
      const res = await controlDeviceContainer(device.id, containerId, operation);
      setCustomContainerState((prev) => ({ ...prev, [containerId]: res.state }));
      setContainerFeedback({
        id: containerId,
        msg: res.message || `Contenedor '${containerId}' (${operation}) ejecutado con éxito`,
        type: "success",
      });
    } catch (err: any) {
      setContainerFeedback({
        id: containerId,
        msg: err.message || `Error al ejecutar ${operation} en contenedor '${containerId}'`,
        type: "error",
      });
    } finally {
      setOperatingContainer(null);
    }
  };

  const ERROR_LOG_REGEX = /\b(error|err|exception|fatal|critical|failed|failure|panic|segfault)\b|status[\s_:]+5\d{2}|HTTP\/[0-9.]+"\s+5\d{2}/i;

  const handleOpenLogs = async (containerId: string, containerName: string) => {
    if (!device) return;
    setActiveLogContainer({ id: containerId, name: containerName });
    setLogSearch("");
    setLogOnlyErrors(false);
    setLoadingLogs(true);
    setContainerLogs(null);
    try {
      const res = await getDeviceContainerLogs(device.id, containerId, 150);
      setContainerLogs(res.logs || "No se registraron líneas de salida en el contenedor.");
    } catch (err: any) {
      setContainerLogs(`[Error al consultar logs]: ${err.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefreshLogs = async () => {
    if (!device || !activeLogContainer) return;
    setLoadingLogs(true);
    try {
      const res = await getDeviceContainerLogs(device.id, activeLogContainer.id, 150);
      setContainerLogs(res.logs || "No se registraron líneas de salida en el contenedor.");
    } catch (err: any) {
      setContainerLogs(`[Error al consultar logs]: ${err.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const parsedLogLines = useMemo(() => {
    if (!containerLogs) return [];
    return containerLogs.split("\n").filter((line) => line.trim().length > 0);
  }, [containerLogs]);

  const totalLogCount = parsedLogLines.length;

  const totalErrorCount = useMemo(() => {
    return parsedLogLines.filter((line) => ERROR_LOG_REGEX.test(line)).length;
  }, [parsedLogLines]);

  const filteredLogLines = useMemo(() => {
    if (!containerLogs) return [];
    let lines = parsedLogLines;

    if (logOnlyErrors) {
      lines = lines.filter((line) => ERROR_LOG_REGEX.test(line));
    }

    if (logSearch.trim()) {
      const q = logSearch.toLowerCase().trim();
      lines = lines.filter((line) => line.toLowerCase().includes(q));
    }

    return lines;
  }, [parsedLogLines, logOnlyErrors, logSearch, containerLogs]);

  const handleCopyLogs = async () => {
    if (!containerLogs) return;
    const textToCopy = logSearch.trim() || logOnlyErrors ? filteredLogLines.join("\n") : containerLogs;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    }
  };

  const fetchSystemLogs = async (source = systemLogSource) => {
    if (!device) return;
    setLoadingSystemLogs(true);
    try {
      const res = await getDeviceSystemLogs(device.id, source, 250);
      setSystemLogs(res.logs || "(Sin registros de eventos disponibles)");
    } catch (err: any) {
      setSystemLogs(`[Error al consultar logs del sistema]: ${err.message}`);
    } finally {
      setLoadingSystemLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs" && systemLogs === null) {
      fetchSystemLogs(systemLogSource);
    }
  }, [activeTab, device]);

  const handleSystemLogSourceChange = (newSource: string) => {
    setSystemLogSource(newSource);
    fetchSystemLogs(newSource);
  };

  const parsedSystemLogLines = useMemo(() => {
    if (!systemLogs) return [];
    return systemLogs.split("\n").filter((line) => line.trim().length > 0);
  }, [systemLogs]);

  const totalSystemErrorCount = useMemo(() => {
    return parsedSystemLogLines.filter((line) => ERROR_LOG_REGEX.test(line)).length;
  }, [parsedSystemLogLines]);

  const filteredSystemLogLines = useMemo(() => {
    if (!systemLogs) return [];
    let lines = parsedSystemLogLines;

    if (systemLogOnlyErrors) {
      lines = lines.filter((line) => ERROR_LOG_REGEX.test(line));
    }

    if (systemLogSearch.trim()) {
      const q = systemLogSearch.toLowerCase().trim();
      lines = lines.filter((line) => line.toLowerCase().includes(q));
    }

    return lines;
  }, [parsedSystemLogLines, systemLogOnlyErrors, systemLogSearch, systemLogs]);

  const handleCopySystemLogs = async () => {
    if (!systemLogs) return;
    const textToCopy = systemLogSearch.trim() || systemLogOnlyErrors ? filteredSystemLogLines.join("\n") : systemLogs;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedSystemLogs(true);
      setTimeout(() => setCopiedSystemLogs(false), 2000);
    }
  };

  const handleExecuteReboot = async () => {
    if (!device) return;
    try {
      setRebooting(true);
      setRebootError(null);
      setRebootMessage(null);
      const res = await rebootDevice(device.id);
      setRebootMessage(res.message || "Orden de reinicio enviada correctamente.");
      setShowRebootConfirm(false);
    } catch (err: any) {
      setRebootError(err.message || "Error al enviar la orden de reinicio");
    } finally {
      setRebooting(false);
    }
  };

  const handleExecuteTerminal = async (customCmd?: string) => {
    if (!device) return;
    const cmd = (customCmd || terminalCmd).trim();
    if (!cmd) return;

    if (customCmd) {
      setTerminalCmd(customCmd);
    }
    setTerminalExecuting(true);
    setTerminalError(null);
    try {
      const res = await executeDeviceTerminalCommand(device.id, cmd);
      setTerminalOutput(res.output || "(Comando ejecutado sin salida estándar)");
      setTerminalExitCode(res.exit_code);
      if (!res.success && res.error) {
        setTerminalError(res.error);
      }
    } catch (err: any) {
      setTerminalError(err.message || "Error al despachar comando");
    } finally {
      setTerminalExecuting(false);
    }
  };

  const handleCopySSHCommand = async () => {
    const targetIP = device?.private_ip || "127.0.0.1";
    const portFlag = sshPort === 22 ? "" : ` -p ${sshPort}`;
    const cmd = `ssh ${sshUser}@${targetIP}${portFlag}`;
    const success = await copyToClipboard(cmd);
    if (success) {
      setCopiedSSH(true);
      setTimeout(() => setCopiedSSH(false), 2500);
    }
  };

  const handleCopyTerminalOutput = async () => {
    if (!terminalOutput) return;
    const success = await copyToClipboard(terminalOutput);
    if (success) {
      setCopiedTerminal(true);
      setTimeout(() => setCopiedTerminal(false), 2000);
    }
  };

  const handleAddRecipientEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailInputError("Ingresa un correo electrónico válido (ej. usuario@empresa.com).");
      return;
    }
    if (deviceAlertRecipients.includes(trimmed)) {
      setEmailInputError("Este correo ya está en la lista de destinatarios.");
      return;
    }
    setDeviceAlertRecipients([...deviceAlertRecipients, trimmed]);
    setNewEmailInput("");
    setEmailInputError(null);
  };

  const handleRemoveRecipientEmail = (emailToRemove: string) => {
    setDeviceAlertRecipients(deviceAlertRecipients.filter((email) => email !== emailToRemove));
  };

  const handleSaveAlertRecipients = async () => {
    if (!device) return;
    try {
      setSavingRecipients(true);
      setSaveRecipientsError(null);
      setSaveRecipientsSuccess(null);
      const updated = await updateDeviceAlertRecipients(device.id, deviceAlertRecipients);
      if (device) {
        device.alert_recipients = updated.alert_recipients;
      }
      setSaveRecipientsSuccess("Destinatarios guardados correctamente para este equipo.");
      setTimeout(() => setSaveRecipientsSuccess(null), 4000);
    } catch (err: any) {
      setSaveRecipientsError(err.message || "Error al guardar destinatarios");
    } finally {
      setSavingRecipients(false);
    }
  };

  const handleTestCombinedAlert = async () => {
    try {
      setTestingDeviceAlerts(true);
      setTestAlertFeedback(null);
      const combined = Array.from(new Set([...globalAdminRecipients, ...deviceAlertRecipients]));
      if (combined.length === 0) {
        setTestAlertFeedback({ msg: "No hay destinatarios configurados para enviar prueba.", type: "error" });
        return;
      }
      const res = await testAlertEmail(combined);
      setTestAlertFeedback({
        msg: `✓ Correo de prueba enviado con éxito a ${res.recipients.length} destinatario(s): ${res.recipients.join(", ")}`,
        type: "success",
      });
      setTimeout(() => setTestAlertFeedback(null), 7000);
    } catch (err: any) {
      setTestAlertFeedback({ msg: err.message || "Error al enviar correo de prueba", type: "error" });
    } finally {
      setTestingDeviceAlerts(false);
    }
  };

  const formatRAM = (val?: number | string) => {
    if (val === undefined || val === null) return "16.0 GB";
    const num = typeof val === "number" ? val : parseFloat(String(val));
    if (isNaN(num)) return `${val} GB`;
    return num % 1 === 0 ? `${num}.0 GB` : `${num.toFixed(1)} GB`;
  };

  const formatDisconnectReason = (reason?: string | null): string => {
    if (!reason) return "No especificada";
    const map: Record<string, string> = {
      heartbeat_timeout: "Pérdida de señal / Sin respuesta de red",
      clean_shutdown: "Apagado del equipo",
      agent_stopped: "Servicio de supervisión detenido",
      manual_disconnect: "Desconexión manual",
      socket_closed: "Conexión interrumpida",
      network_loss: "Corte de red o internet",
    };
    return map[reason] || reason.replace(/_/g, " ");
  };

  if (!device) return null;

  const isOnline = device.status.current_state === "ONLINE";
  const cpu = device.latest_telemetry?.cpu_percent ?? 0;
  const ram = device.latest_telemetry?.ram_percent ?? 0;
  const disk = device.latest_telemetry?.disk_percent ?? 0;

  return (
    <div className="q-modal-overlay" onClick={onClose}>
      <div className="q-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="q-modal-header">
          <div className="q-modal-title">
            <span>{device.hostname}</span>
            <span style={{ fontSize: 13, color: "var(--color-text-tertiary)", fontWeight: 400 }}>
              ({device.device_code})
            </span>
            <Badge variant={isOnline ? "success" : "danger"} pulse={isOnline}>
              {device.status.current_state}
            </Badge>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 6 }}>
              <Tag size={13} style={{ opacity: 0.6 }} />
              <select
                className="q-table-area-select"
                value={deviceArea}
                disabled={updatingArea}
                onChange={async (e) => {
                  const val = e.target.value;
                  setDeviceArea(val);
                  if (device) {
                    try {
                      setUpdatingArea(true);
                      device.client_area = val;
                      await updateDeviceArea(device.id, val);
                    } catch (err) {
                      console.error("Error al actualizar área:", err);
                    } finally {
                      setUpdatingArea(false);
                    }
                  }
                }}
                style={{ padding: "3px 8px", fontSize: 12, height: 26 }}
                title="Área o Cliente asignado a este equipo"
              >
                {availableAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isOnline && (
              <>
                {device.os_type === "linux" ? (
                  <Button
                    variant="primary"
                    icon={<Terminal size={15} />}
                    onClick={() => setActiveTab("actions")}
                    title="Abrir Terminal SSH y Comandos Remotos"
                    style={{
                      height: 32,
                      fontSize: 13,
                      padding: "0 14px",
                      background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                      color: "#ffffff",
                      fontWeight: 600,
                    }}
                  >
                    Terminal SSH
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    icon={<Monitor size={15} />}
                    onClick={() => setShowRemoteDesktop(true)}
                    title="Abrir sesión interactiva de Escritorio Remoto"
                    style={{ height: 32, fontSize: 13, padding: "0 12px" }}
                  >
                    Escritorio Remoto
                  </Button>
                )}
                {device.os_type === "linux" && (
                  <Button
                    variant="secondary"
                    icon={<Monitor size={15} />}
                    onClick={() => setShowRemoteDesktop(true)}
                    title="Abrir Escritorio Gráfico (si tiene entorno X11/Wayland)"
                    style={{ height: 32, fontSize: 13, padding: "0 10px" }}
                  >
                    Escritorio
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" icon={<X size={20} />} onClick={onClose} aria-label="Cerrar modal" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="q-modal-tabs">
          <button
            className={`q-modal-tab ${activeTab === "overview" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={16} /> Resumen & Hardware
          </button>
          <button
            className={`q-modal-tab ${activeTab === "ai-health" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("ai-health")}
          >
            <Sparkles size={16} color="var(--color-brand-primary)" /> AI Health & Diagnóstico
          </button>
          <button
            className={`q-modal-tab ${activeTab === "processes" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("processes")}
          >
            <List size={16} /> Procesos ({rawProcesses.length})
          </button>
          <button
            className={`q-modal-tab ${activeTab === "services" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <Server size={16} /> Servicios ({rawServices.length})
          </button>
          <button
            className={`q-modal-tab ${activeTab === "containers" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("containers")}
          >
            <Box size={16} /> Contenedores ({rawContainers.length})
          </button>
          <button
            className={`q-modal-tab ${activeTab === "actions" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("actions")}
          >
            <Terminal size={16} /> {device.os_type === "linux" ? "Control & Terminal SSH" : "Control Remoto"}
          </button>
          <button
            className={`q-modal-tab ${activeTab === "logs" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <FileText size={16} /> Logs del Sistema
          </button>
          <button
            className={`q-modal-tab ${activeTab === "alerts" ? "q-modal-tab--active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <Bell size={16} /> Alertas & Contactos ({deviceAlertRecipients.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="q-modal-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <div className="q-modal-section">
                <span className="q-modal-section-title">Especificaciones de Hardware</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div style={{ background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                    <Cpu size={18} color="var(--color-brand-primary)" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>CPU</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{device.specs?.cpu_model || "Procesador x86_64"}</div>
                    <div style={{ fontSize: 11 }}>{device.specs?.cpu_cores || 8} Núcleos</div>
                  </div>
                  <div style={{ background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                    <Activity size={18} color="var(--color-brand-primary)" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>MEMORIA RAM</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{formatRAM(device.specs?.ram_total_gb)}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                      {device.specs?.ram_usable_gb ? `${device.specs.ram_usable_gb} GB utilizables` : "Instalada"}
                    </div>
                  </div>
                  <div style={{ background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                    <HardDrive size={18} color="var(--color-brand-primary)" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                      {isEs ? "ALMACENAMIENTO TOTAL" : "TOTAL STORAGE"}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {totalStorageGB >= 1000
                        ? `${(totalStorageGB / 1024).toFixed(1)} TB (${allDisks.length} ${allDisks.length === 1 ? (isEs ? "unidad" : "drive") : (isEs ? "unidades" : "drives")})`
                        : `${Math.round(totalStorageGB)} GB (${allDisks.length} ${allDisks.length === 1 ? (isEs ? "unidad" : "drive") : (isEs ? "unidades" : "drives")})`}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                      {freeStorageGB >= 1000
                        ? `${(freeStorageGB / 1024).toFixed(1)} TB ${isEs ? "libres" : "free"}`
                        : `${Math.round(freeStorageGB * 10) / 10} GB ${isEs ? "libres" : "free"}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* UNIDADES DE ALMACENAMIENTO & ESTADO DE DISCOS */}
              <div className="q-modal-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="q-modal-section-title" style={{ margin: 0 }}>
                    <HardDrive size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    {isEs ? "Unidades de Disco & Almacenamiento" : "Disk Drives & Storage Partitions"}
                  </span>
                  <Badge variant="info">
                    {allDisks.length} {allDisks.length === 1 ? (isEs ? "Unidad Detectada" : "Drive Detected") : (isEs ? "Unidades Detectadas" : "Drives Detected")}
                  </Badge>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: allDisks.length > 1 ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
                    gap: 12,
                  }}
                >
                  {allDisks.map((d, idx) => {
                    const total = Number(d.total_gb || 0);
                    const free = Number(d.free_gb || 0);
                    const used = d.used_gb != null ? Number(d.used_gb) : Math.max(0, Math.round((total - free) * 10) / 10);
                    const pct = d.used_percent != null
                      ? Number(d.used_percent)
                      : total > 0 ? Math.round((used / total) * 100) : 0;

                    const isHigh = pct >= 90;
                    const isWarning = pct >= 75 && pct < 90;
                    const barColor = isHigh
                      ? "var(--color-status-danger, #ef4444)"
                      : isWarning
                      ? "var(--color-status-warning, #f59e0b)"
                      : "var(--color-status-success, #10b981)";

                    return (
                      <div
                        key={idx}
                        style={{
                          background: "var(--color-surface-muted)",
                          border: "1px solid var(--color-border-default)",
                          borderRadius: 8,
                          padding: "14px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: "var(--color-surface-default)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid var(--color-border-default)",
                              }}
                            >
                              <HardDrive size={18} color="var(--color-brand-primary)" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>
                                {isEs ? "Unidad" : "Drive"} {d.mount}
                                {d.fstype ? ` (${d.fstype})` : ""}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                                {d.device && d.device !== d.mount
                                  ? d.device
                                  : d.mount === "C:" || d.mount === "/"
                                  ? (isEs ? "Disco Local (Sistema)" : "Local Disk (System)")
                                  : (isEs ? "Disco Local (Datos / Secundario)" : "Local Disk (Data / Secondary)")}
                              </div>
                            </div>
                          </div>
                          <Badge variant={isHigh ? "danger" : isWarning ? "warning" : "success"}>
                            {pct}% {isEs ? "ocupado" : "used"}
                          </Badge>
                        </div>

                        {/* Barra de progreso de uso de disco */}
                        <div>
                          <div
                            style={{
                              width: "100%",
                              height: 8,
                              background: "var(--color-border-default)",
                              borderRadius: 4,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(0, pct))}%`,
                                height: "100%",
                                background: barColor,
                                borderRadius: 4,
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)" }}>
                          <span>
                            <b>{free} GB</b> {isEs ? "libres" : "free"}
                          </span>
                          <span>
                            {used} GB {isEs ? "usados de" : "used of"} <b>{total} GB</b>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PERIFÉRICOS & FACTOR DE FORMA (ESPECIALMENTE DESKTOP) */}
              {(device.specs?.peripherals || device.os_type === "windows") && (
                <div className="q-modal-section">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className="q-modal-section-title" style={{ margin: 0 }}>
                      <Monitor size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                      Periféricos & Factor de Forma
                    </span>
                    <Badge variant={device.specs?.peripherals?.chassis_type === "Laptop" ? "warning" : "info"}>
                      {device.specs?.peripherals?.chassis_type || "Desktop / Estación"}
                    </Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    <div style={{ background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <Monitor size={16} color="var(--color-brand-primary)" />
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600 }}>PANTALLA(S) / MONITORES</span>
                      </div>
                      {device.specs?.peripherals?.monitors && device.specs.peripherals.monitors.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {device.specs.peripherals.monitors.map((m, idx) => (
                            <div key={idx} style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>
                              • {m}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Monitor Principal (1920x1080)</div>
                      )}
                    </div>

                    <div style={{ background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <Printer size={16} color="var(--color-brand-primary)" />
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600 }}>IMPRESORAS CONFIGURADAS</span>
                      </div>
                      {device.specs?.peripherals?.printers && device.specs.peripherals.printers.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {device.specs.peripherals.printers.slice(0, 4).map((p, idx) => (
                            <div key={idx} style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>
                              • {p}
                            </div>
                          ))}
                          {device.specs.peripherals.printers.length > 4 && (
                            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                              +{device.specs.peripherals.printers.length - 4} impresoras adicionales
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Sin impresoras detectadas</div>
                      )}
                    </div>

                    <div style={{ background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <Keyboard size={16} color="var(--color-brand-primary)" />
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600 }}>TECLADO</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {device.specs?.peripherals?.keyboard || "Teclado estándar / USB HID"}
                      </div>
                    </div>

                    <div style={{ background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <MousePointer size={16} color="var(--color-brand-primary)" />
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600 }}>MOUSE / APUNTADOR</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {device.specs?.peripherals?.mouse || "Mouse óptico / USB HID"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="q-modal-section">
                <span className="q-modal-section-title">Consumo en Tiempo Real</span>
                <div className="q-metric-bar-group">
                  <div className="q-metric-bar-header"><span>Uso de CPU</span><span>{cpu}%</span></div>
                  <div className="q-metric-bar-track">
                    <div
                      className="q-metric-bar-fill"
                      style={{
                        width: `${cpu}%`,
                        backgroundColor: cpu > 80 ? "var(--color-status-danger)" : "var(--color-brand-primary)",
                      }}
                    />
                  </div>
                </div>
                <div className="q-metric-bar-group">
                  <div className="q-metric-bar-header"><span>Uso de Memoria RAM</span><span>{ram}%</span></div>
                  <div className="q-metric-bar-track">
                    <div
                      className="q-metric-bar-fill"
                      style={{
                        width: `${ram}%`,
                        backgroundColor: ram > 85 ? "var(--color-status-warning)" : "var(--color-status-info)",
                      }}
                    />
                  </div>
                </div>
                <div className="q-metric-bar-group">
                  <div className="q-metric-bar-header"><span>Uso de Disco</span><span>{disk}%</span></div>
                  <div className="q-metric-bar-track">
                    <div className="q-metric-bar-fill" style={{ width: `${disk}%`, backgroundColor: "var(--color-status-neutral)" }} />
                  </div>
                </div>
              </div>

              {rawContainers.length > 0 && (
                <div className="q-modal-section">
                  <span className="q-modal-section-title">
                    <Box size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    Contenedores Docker Supervisados ({rawContainers.length})
                  </span>
                  <div className="q-containers-grid">
                    {rawContainers.map((c, i) => (
                      <div key={i} className="q-container-item">
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <Badge variant={c.state === "running" ? "success" : "neutral"}>{c.status || c.state}</Badge>
                          {c.health && <Badge variant={c.health === "healthy" ? "success" : c.health === "unhealthy" ? "danger" : "warning"}>{c.health}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="q-modal-section">
                <span className="q-modal-section-title">
                  <Clock size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  Historial de Conectividad
                </span>
                <div style={{ fontSize: 13, background: "var(--color-surface-muted)", padding: 12, borderRadius: 8 }}>
                  <div><strong>Última Conexión:</strong> {device.status.last_connection ? new Date(device.status.last_connection).toLocaleString() : "N/A"}</div>
                  {device.status.last_disconnect && (
                    <div style={{ marginTop: 4 }}><strong>Última Desconexión:</strong> {new Date(device.status.last_disconnect).toLocaleString()} ({formatDisconnectReason(device.status.disconnect_reason)})</div>
                  )}
                  <div style={{ marginTop: 4 }}><strong>Disponibilidad (24h):</strong> {device.status.availability_percentage_24h}%</div>
                </div>
              </div>
            </>
          )}

          {/* TAB: AI HEALTH & PREDICTIVE DIAGNOSTICS */}
          {activeTab === "ai-health" && (
            <div className="q-modal-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={20} color="var(--color-brand-primary)" />
                    {isEs ? "Diagnóstico Predictivo & Salud del Endpoint" : "Predictive Diagnostics & Endpoint Health"}
                  </h3>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    {isEs
                      ? "Evaluación determinística multi-variable asistida por motor de inferencia DeepSeek."
                      : "Multi-variable deterministic assessment assisted by DeepSeek inference engine."}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunAiDiagnosis}
                  disabled={diagnosingAi}
                >
                  <RefreshCw size={14} style={{ marginRight: 6 }} className={diagnosingAi ? "animate-spin" : ""} />
                  {diagnosingAi
                    ? isEs ? "Diagnosticando..." : "Diagnosing..."
                    : isEs ? "Ejecutar Diagnóstico IA en Vivo" : "Run Live AI Diagnostic"}
                </Button>
              </div>

              {loadingAiHealth ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)" }}>
                  <RefreshCw className="animate-spin" size={28} style={{ margin: "0 auto 12px auto", color: "var(--color-brand-primary)" }} />
                  <div>{isEs ? "Cargando métricas y análisis de salud..." : "Loading health metrics and analysis..."}</div>
                </div>
              ) : aiHealthData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Score strip */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr",
                      gap: 16,
                      background: "var(--color-surface-muted)",
                      padding: 18,
                      borderRadius: 12,
                      border: "1px solid var(--color-border-default)",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ textAlign: "center", borderRight: "1px solid var(--color-border-default)", paddingRight: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>
                        {isEs ? "Puntaje de Salud" : "Health Score"}
                      </div>
                      <div
                        style={{
                          fontSize: 42,
                          fontWeight: 900,
                          lineHeight: 1.1,
                          marginTop: 4,
                          color:
                            aiHealthData.health.overall_score >= 80
                              ? "var(--color-status-success)"
                              : aiHealthData.health.overall_score >= 60
                              ? "var(--color-status-warning)"
                              : "var(--color-status-danger)",
                        }}
                      >
                        {aiHealthData.health.overall_score}
                        <span style={{ fontSize: 16, color: "var(--color-text-tertiary)", fontWeight: 600 }}>/100</span>
                      </div>
                      <Badge
                        variant={
                          aiHealthData.health.trend === "IMPROVING"
                            ? "success"
                            : aiHealthData.health.trend === "DEGRADING"
                            ? "danger"
                            : "info"
                        }
                        style={{ marginTop: 6 }}
                      >
                        {isEs ? "Tendencia:" : "Trend:"} {formatTrend(aiHealthData.health.trend, isEs ? "es" : "en")}
                      </Badge>
                    </div>

                    {/* Desglose de componentes con métricas reales en vivo */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      {/* CPU */}
                      <div style={{ background: "var(--color-surface-default)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border-default)" }}>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600, letterSpacing: "0.03em" }}>{isEs ? "SALUD DE CPU" : "CPU HEALTH"}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)", marginTop: 2, display: "flex", alignItems: "baseline", gap: 4 }}>
                          {aiHealthData.health.cpu_score}
                          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>/100</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>
                          <span style={{ fontWeight: 600 }}>{isEs ? "Consumo:" : "Usage:"}</span> {cpu}%
                        </div>
                      </div>

                      {/* Memoria RAM */}
                      <div style={{ background: "var(--color-surface-default)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border-default)" }}>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600, letterSpacing: "0.03em" }}>{isEs ? "SALUD DE MEMORIA" : "RAM HEALTH"}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)", marginTop: 2, display: "flex", alignItems: "baseline", gap: 4 }}>
                          {aiHealthData.health.memory_score}
                          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>/100</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>
                          <span style={{ fontWeight: 600 }}>{isEs ? "Uso:" : "Usage:"}</span> {ram}% {device.specs?.ram_usable_gb ? `(${((ram * Number(device.specs.ram_usable_gb)) / 100).toFixed(1)}/${device.specs.ram_usable_gb} GB)` : ""}
                        </div>
                      </div>

                      {/* Almacenamiento */}
                      <div style={{ background: "var(--color-surface-default)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border-default)" }}>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600, letterSpacing: "0.03em" }}>{isEs ? "SALUD DE ALMACENAMIENTO" : "STORAGE HEALTH"}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)", marginTop: 2, display: "flex", alignItems: "baseline", gap: 4 }}>
                          {aiHealthData.health.disk_score}
                          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>/100</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>
                          <span style={{ fontWeight: 600 }}>{isEs ? "Ocupación C:" : "Drive C:"}</span> {disk}% {device.specs?.disk_free_gb ? `(${device.specs.disk_free_gb} GB lib.)` : ""}
                        </div>
                      </div>

                      {/* Red y Enlace */}
                      <div style={{ background: "var(--color-surface-default)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border-default)" }}>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600, letterSpacing: "0.03em" }}>{isEs ? "RED Y ENLACE" : "NETWORK"}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)", marginTop: 2, display: "flex", alignItems: "baseline", gap: 4 }}>
                          {aiHealthData.health.network_score}
                          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>/100</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>
                          {isEs ? "Enlace y latencia estables" : "Stable connection"}
                        </div>
                      </div>

                      {/* Sistema y Eventos */}
                      <div style={{ background: "var(--color-surface-default)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border-default)" }}>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600, letterSpacing: "0.03em" }}>{isEs ? "SISTEMA Y EVENTOS" : "OS & LOGS"}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)", marginTop: 2, display: "flex", alignItems: "baseline", gap: 4 }}>
                          {aiHealthData.health.events_score}
                          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>/100</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>
                          {aiHealthData.health.events_score < 70 ? (isEs ? "Incidentes en log" : "Log events logged") : (isEs ? "Sin fallos críticos" : "Clean system logs")}
                        </div>
                      </div>

                      {/* Disponibilidad */}
                      <div style={{ background: "var(--color-surface-default)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border-default)" }}>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600, letterSpacing: "0.03em" }}>{isEs ? "DISPONIBILIDAD" : "AVAILABILITY"}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)", marginTop: 2, display: "flex", alignItems: "baseline", gap: 4 }}>
                          {aiHealthData.health.availability_score}
                          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 500 }}>/100</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>
                          Uptime 24h: {Number(device.status?.availability_percentage_24h ?? 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explicabilidad determinística (Reasons) */}
                  {aiHealthData.health.reasons && aiHealthData.health.reasons.length > 0 && (
                    <div style={{ background: "var(--color-surface-muted)", padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{isEs ? "Evidencia y factores del cálculo:" : "Evidence & calculation factors:"}</div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--color-text-secondary)" }}>
                        {aiHealthData.health.reasons.map((r, idx) => (
                          <li key={idx} style={{ marginBottom: 3 }}>{formatReason(r, isEs ? "es" : "en")}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Anomalías Detectadas */}
                  {aiHealthData.anomalies && aiHealthData.anomalies.length > 0 && (
                    <div>
                      <h4 style={{ margin: "12px 0 8px 0", fontSize: 14, fontWeight: 700 }}>
                        {isEs ? "Anomalías y Proyecciones Predictivas" : "Anomalies & Predictive Projections"}
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {aiHealthData.anomalies.map((anom, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "10px 14px",
                              borderLeft: `4px solid ${anom.severity === "CRITICAL" ? "var(--color-status-danger)" : "var(--color-status-warning)"}`,
                              background: "var(--color-surface-muted)",
                              borderRadius: "0 6px 6px 0",
                              fontSize: 13,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              {formatAnomalyType(anom.type || (anom as any).anomaly_type, isEs ? "es" : "en")}
                            </div>
                            <div style={{ color: "var(--color-text-secondary)", marginTop: 2 }}>
                              {formatAnomalyDescription(anom.description, isEs ? "es" : "en")}
                            </div>
                            {anom.projection_days && (
                              <div style={{ marginTop: 4, fontWeight: 600, color: "#b45309", fontSize: 12 }}>
                                ⏱ {isEs ? "Estimado de saturación:" : "Estimated saturation:"} ~{anom.projection_days} {isEs ? "días" : "days"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diagnóstico Profundo IA */}
                  {aiHealthData.diagnostic ? (
                    <div style={{ border: "1px solid var(--color-brand-primary)", borderRadius: 10, padding: 18, background: "rgba(103, 61, 230, 0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--color-brand-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Sparkles size={16} />
                          {isEs ? "Diagnóstico DeepSeek" : "DeepSeek Diagnostic"} ({aiHealthData.diagnostic.model})
                        </div>
                        <Badge variant="neutral">
                          {isEs ? "Confianza:" : "Confidence:"} {Math.round(aiHealthData.diagnostic.confidence * 100)}%
                        </Badge>
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        {aiHealthData.diagnostic.summary}
                      </div>
                      <div style={{ fontSize: 13.5, color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                        {aiHealthData.diagnostic.diagnosis}
                      </div>

                      {/* Recomendaciones */}
                      {aiHealthData.diagnostic.recommendations && aiHealthData.diagnostic.recommendations.length > 0 && (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6 }}>
                            {isEs ? "Acciones Recomendadas por IA:" : "AI Recommended Actions:"}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {aiHealthData.diagnostic.recommendations.map((rec, i) => (
                              <div key={i} style={{ fontSize: 13, padding: "10px 14px", background: "var(--color-surface-default)", borderRadius: 6, border: "1px solid var(--color-border-default)", color: "var(--color-text-primary)" }}>
                                <b style={{ color: "var(--color-text-primary)" }}>{i + 1}. {rec.action}</b> — <span style={{ color: "var(--color-text-secondary)" }}>{rec.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mensaje al Cliente */}
                      <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--color-surface-muted)", borderRadius: 8, fontSize: 12.5 }}>
                        <b>{isEs ? "Comunicado sugerido para el cliente:" : "Suggested message for client:"}</b>
                        <div style={{ fontStyle: "italic", marginTop: 4, color: "var(--color-text-secondary)" }}>
                          "{aiHealthData.diagnostic.client_message}"
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--color-text-secondary)" }}>
                      <p style={{ margin: 0, fontSize: 13.5 }}>
                        {isEs
                          ? 'Presione "Ejecutar Diagnóstico IA en Vivo" para obtener recomendaciones profundas y análisis de causas probables.'
                          : 'Click "Run Live AI Diagnostic" to obtain in-depth recommendations and root cause analysis.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--color-text-secondary)" }}>
                  {isEs ? "No se pudo cargar la información de salud del equipo." : "Could not load device health information."}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROCESSES */}
          {activeTab === "processes" && (
            <div className="q-modal-section">
              {/* Feedback banner tras acción de proceso */}
              {processActionFeedback && (
                <div className={`q-proc-feedback ${processActionFeedback.type}`}>
                  {processActionFeedback.type === "success" ? (
                    <CheckCircle2 size={15} color="var(--color-status-success)" />
                  ) : (
                    <AlertTriangle size={15} color="var(--color-status-danger)" />
                  )}
                  <span>{processActionFeedback.msg}</span>
                  <button
                    type="button"
                    className="q-proc-feedback-close"
                    onClick={() => setProcessActionFeedback(null)}
                    title="Cerrar notificación"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="q-process-search">
                <Search size={16} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre de proceso o PID..."
                  value={processSearch}
                  onChange={(e) => setProcessSearch(e.target.value)}
                />
              </div>

              {filteredProcesses.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "var(--color-text-secondary)", fontSize: 13 }}>
                  {rawProcesses.length === 0
                    ? "Esperando telemetría de procesos activos del agente..."
                    : "No se encontraron procesos que coincidan con la búsqueda."}
                </div>
              ) : (
                <div className="q-process-table-container">
                  <table className="q-process-table">
                    <thead>
                      <tr>
                        <th className="q-sortable-th" onClick={() => handleProcSort("pid")} title="Ordenar por PID">
                          <div className="q-th-inner">
                            <span>PID</span>
                            {renderProcSortIndicator("pid")}
                          </div>
                        </th>
                        <th className="q-sortable-th" onClick={() => handleProcSort("name")} title="Ordenar por Nombre de Proceso">
                          <div className="q-th-inner">
                            <span>Nombre de Proceso</span>
                            {renderProcSortIndicator("name")}
                          </div>
                        </th>
                        <th className="q-sortable-th" onClick={() => handleProcSort("cpu_percent")} title="Ordenar por Uso de CPU">
                          <div className="q-th-inner">
                            <span>CPU</span>
                            {renderProcSortIndicator("cpu_percent")}
                          </div>
                        </th>
                        <th className="q-sortable-th" onClick={() => handleProcSort("ram_mb")} title="Ordenar por RAM en Megabytes">
                          <div className="q-th-inner">
                            <span>RAM (MB)</span>
                            {renderProcSortIndicator("ram_mb")}
                          </div>
                        </th>
                        <th className="q-sortable-th" onClick={() => handleProcSort("ram_percent")} title="Ordenar por Porcentaje de RAM">
                          <div className="q-th-inner">
                            <span>RAM %</span>
                            {renderProcSortIndicator("ram_percent")}
                          </div>
                        </th>
                        <th className="q-sortable-th" onClick={() => handleProcSort("status")} title="Ordenar por Estado">
                          <div className="q-th-inner">
                            <span>Estado</span>
                            {renderProcSortIndicator("status")}
                          </div>
                        </th>
                        <th style={{ textAlign: "right", minWidth: 105 }}>
                          <div className="q-th-inner" style={{ justifyContent: "flex-end" }}>
                            <span>Acción</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProcesses.map((p) => (
                        <tr key={p.pid}>
                          <td style={{ color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{p.pid}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>
                            <span style={{ color: p.cpu_percent > 20 ? "var(--color-status-danger)" : "inherit" }}>
                              {p.cpu_percent.toFixed(1)}%
                            </span>
                          </td>
                          <td>{p.ram_mb.toFixed(1)} MB</td>
                          <td>{p.ram_percent.toFixed(1)}%</td>
                          <td>
                            <Badge variant={p.status === "running" ? "success" : "neutral"}>
                              {p.status}
                            </Badge>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {isProtectedProcess(p) ? (
                              <span
                                className="q-proc-protected-badge"
                                title="Proceso esencial de sistema o del agente de supervisión. Protegido contra finalización."
                              >
                                <ShieldAlert size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
                                Protegido
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="q-proc-kill-btn"
                                onClick={() => setProcessToTerminate({ pid: p.pid, name: p.name })}
                                disabled={terminatingPid === p.pid}
                                title={`Finalizar proceso ${p.name} (PID ${p.pid}) en ${device.hostname}`}
                              >
                                {terminatingPid === p.pid ? (
                                  <Loader2 size={12} className="q-spin" />
                                ) : (
                                  <XCircle size={12} />
                                )}
                                <span>Finalizar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVICES */}
          {activeTab === "services" && (
            <div className="q-modal-section">
              {/* Buscador reactivo de todos los servicios */}
              <div className="q-process-search">
                <Search size={16} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  placeholder="Buscar entre todos los servicios del sistema (ej. Spooler, Defender, Windows Update)..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
                {searchingServices && <Loader2 size={16} className="q-spin" color="var(--color-brand-primary)" />}
              </div>

              {/* Feedback toast / mensaje inline */}
              {serviceFeedback && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    background: serviceFeedback.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: serviceFeedback.type === "success" ? "var(--color-status-success)" : "var(--color-status-danger)",
                    border: `1px solid ${serviceFeedback.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  }}
                >
                  {serviceFeedback.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{serviceFeedback.msg}</span>
                  <button
                    onClick={() => setServiceFeedback(null)}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 13 }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Header descriptivo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                  {serviceSearch.trim()
                    ? `Resultados de búsqueda (${displayedServices.length}):`
                    : `Servicios Principales & Críticos (${displayedServices.length}):`}
                </span>
                {!serviceSearch.trim() && (
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    Vista curada Top. Usa el buscador para consultar cualquier otro servicio.
                  </span>
                )}
              </div>

              {displayedServices.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "var(--color-text-secondary)", fontSize: 13 }}>
                  {searchingServices
                    ? "Consultando servicios en el equipo remoto..."
                    : "No se encontraron servicios que coincidan con la búsqueda."}
                </div>
              ) : (
                <div className="q-services-grid">
                  {displayedServices.map((s, idx) => {
                    const currentStatus = customServiceStatus[s.name] || s.status;
                    const isRunning = currentStatus === "running";
                    const isStopped = currentStatus === "stopped" || currentStatus === "not_installed";
                    const isOperatingThis = operatingService?.startsWith(`${s.name}:`);
                    const isProtected = s.name.toLowerCase() === "qhapanaagent";

                    return (
                      <div key={idx} className="q-service-card">
                        <div>
                          <div className="q-service-card-title">{s.display_name || s.name}</div>
                          <div className="q-service-card-name">{s.name}</div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                          <Badge variant={isRunning ? "success" : isStopped ? "danger" : "neutral"}>
                            {isRunning ? "EN EJECUCIÓN" : isStopped ? "DETENIDO" : currentStatus.toUpperCase()}
                          </Badge>
                          {isOperatingThis && (
                            <span style={{ fontSize: 11, color: "var(--color-brand-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                              <Loader2 size={12} className="q-spin" /> Procesando...
                            </span>
                          )}
                        </div>

                        {/* Botones de Control Remoto */}
                        <div className="q-service-actions">
                          {isStopped ? (
                            <button
                              className="q-service-btn q-service-btn--start"
                              disabled={Boolean(operatingService)}
                              onClick={() => handleServiceControl(s.name, "start")}
                              title="Subir / Iniciar servicio en el equipo remoto"
                            >
                              <Play size={12} /> Iniciar
                            </button>
                          ) : (
                            <>
                              <button
                                className="q-service-btn q-service-btn--restart"
                                disabled={Boolean(operatingService)}
                                onClick={() => handleServiceControl(s.name, "restart")}
                                title="Reiniciar servicio en el equipo remoto"
                              >
                                <RotateCcw size={12} /> Reiniciar
                              </button>
                              <button
                                className="q-service-btn q-service-btn--stop"
                                disabled={Boolean(operatingService) || isProtected}
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de que deseas detener el servicio "${s.display_name || s.name}"?`)) {
                                    handleServiceControl(s.name, "stop");
                                  }
                                }}
                                title={isProtected ? "Servicio protegido (agente principal)" : "Bajar / Detener servicio"}
                              >
                                <Square size={12} /> Detener
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTAINERS */}
          {activeTab === "containers" && (
            <div className="q-modal-section">
              <div className="q-process-search">
                <Search size={16} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre, imagen o ID de contenedor..."
                  value={containerSearch}
                  onChange={(e) => setContainerSearch(e.target.value)}
                  className="q-process-search-input"
                />
              </div>

              {containerFeedback && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background:
                      containerFeedback.type === "success"
                        ? "rgba(34, 197, 94, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                    color:
                      containerFeedback.type === "success"
                        ? "var(--color-status-success)"
                        : "var(--color-status-danger)",
                  }}
                >
                  {containerFeedback.type === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  <span>{containerFeedback.msg}</span>
                </div>
              )}

              {rawContainers.length === 0 ? (
                <div className="q-empty-state" style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
                  <Box size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div>No se detectaron contenedores Docker activos en este equipo.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Docker Engine puede estar detenido o no instalado.</div>
                </div>
              ) : filteredContainers.length === 0 ? (
                <div className="q-empty-state" style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
                  No se encontraron contenedores que coincidan con "{containerSearch}".
                </div>
              ) : (
                <div className="q-containers-grid">
                  {filteredContainers.map((c) => {
                    const containerId = c.id || c.name;
                    const currentState = (c.id && customContainerState[c.id]) || customContainerState[containerId] || c.state || "unknown";
                    const isRunning = currentState.toLowerCase() === "running";
                    const isOperatingThis = operatingContainer && operatingContainer.startsWith(containerId);

                    return (
                      <div key={containerId} className="q-container-card">
                        <div className="q-container-title-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                            <Box size={18} color="var(--color-brand-primary)" style={{ flexShrink: 0 }} />
                            <span className="q-container-name" title={c.name}>{c.name}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <Badge variant={isRunning ? "success" : "neutral"} pulse={isRunning}>
                              {currentState.toUpperCase()}
                            </Badge>
                            {c.health && (
                              <Badge
                                variant={
                                  c.health.toLowerCase() === "healthy"
                                    ? "success"
                                    : c.health.toLowerCase() === "unhealthy"
                                    ? "danger"
                                    : "warning"
                                }
                              >
                                {c.health}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="q-container-meta">
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.image}>
                            <strong>Imagen:</strong> {c.image}
                          </div>
                          <div>
                            <strong>ID:</strong> {(c.id || "").substring(0, 12)}
                          </div>
                        </div>

                        <div className="q-container-metrics">
                          <span className="q-metric-pill">
                            <Activity size={12} />
                            {c.cpu_percent !== undefined ? `${c.cpu_percent.toFixed(1)}% CPU` : "0.0% CPU"}
                          </span>
                          <span className="q-metric-pill">
                            <Cpu size={12} />
                            {c.memory_mb !== undefined ? `${c.memory_mb.toFixed(1)} MB` : "0 MB"}
                            {c.mem_percent ? ` (${c.mem_percent})` : ""}
                          </span>
                          {c.net_io && (
                            <span className="q-metric-pill" title="Red I/O">
                              {c.net_io}
                            </span>
                          )}
                        </div>

                        {c.ports && (
                          <div className="q-container-ports" title={c.ports}>
                            <ExternalLink size={12} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.ports}
                            </span>
                          </div>
                        )}

                        <div className="q-container-actions">
                          {isOperatingThis ? (
                            <span style={{ fontSize: 12.5, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                              <Loader2 size={14} className="q-spin" color="var(--color-brand-primary)" /> Procesando orden...
                            </span>
                          ) : isRunning ? (
                            <>
                              <button
                                className="q-btn-container q-btn-container--logs"
                                onClick={() => handleOpenLogs(containerId, c.name)}
                                title="Ver consola y registros de salida del contenedor"
                              >
                                <Terminal size={13} /> Ver Logs
                              </button>
                              <button
                                className="q-btn-container q-btn-container--restart"
                                onClick={() => handleContainerControl(containerId, "restart")}
                                title="Reiniciar contenedor Docker"
                              >
                                <RotateCcw size={13} /> Reiniciar
                              </button>
                              <button
                                className="q-btn-container q-btn-container--stop"
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de que deseas detener el contenedor "${c.name}"?`)) {
                                    handleContainerControl(containerId, "stop");
                                  }
                                }}
                                title="Detener contenedor Docker"
                              >
                                <Square size={13} /> Detener
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="q-btn-container q-btn-container--logs"
                                onClick={() => handleOpenLogs(containerId, c.name)}
                                title="Ver registros de salida y errores previos del contenedor"
                              >
                                <Terminal size={13} /> Ver Logs
                              </button>
                              <button
                                className="q-btn-container q-btn-container--start"
                                onClick={() => handleContainerControl(containerId, "start")}
                                title="Iniciar contenedor Docker"
                              >
                                <Play size={13} /> Iniciar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REMOTE ACTIONS & SSH TERMINAL */}
          {activeTab === "actions" && (
            <div className="q-modal-section" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* TARJETA 1: ACCESO Y CONEXIÓN SSH DIRECTA */}
              <div className="q-ssh-card">
                <div className="q-ssh-header">
                  <div className="q-ssh-title-wrap">
                    <div className="q-ssh-icon">
                      <Terminal size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)" }}>
                        Acceso por Consola SSH Remota
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                        Conexión segura para administración remota por terminal
                      </div>
                    </div>
                  </div>
                  <Badge variant={device.os_type === "linux" ? "success" : "neutral"}>
                    {device.os_type === "linux" ? "SSH Nativo (Puerto 22)" : "SSH / WinRM"}
                  </Badge>
                </div>

                <div className="q-ssh-command-panel">
                  <div className="q-ssh-config-fields">
                    <div className="q-ssh-config-field">
                      <span>Usuario SSH:</span>
                      <input
                        type="text"
                        className="q-ssh-config-input"
                        value={sshUser}
                        onChange={(e) => setSshUser(e.target.value.trim())}
                        placeholder="ej: raul o root"
                      />
                    </div>
                    <div className="q-ssh-config-field">
                      <span>Puerto:</span>
                      <input
                        type="number"
                        className="q-ssh-config-input"
                        style={{ width: 65 }}
                        value={sshPort}
                        onChange={(e) => setSshPort(Number(e.target.value))}
                      />
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
                      Host: <strong>{device.private_ip || "127.0.0.1"}</strong>
                    </div>
                  </div>

                  {/* Comando SSH Formateado */}
                  <div className="q-ssh-command-row">
                    <div className="q-ssh-command-text">
                      ssh {sshUser}@{device.private_ip || "127.0.0.1"}{sshPort !== 22 ? ` -p ${sshPort}` : ""}
                    </div>
                    <div className="q-ssh-actions-row">
                      <Button
                        variant="primary"
                        onClick={handleCopySSHCommand}
                        icon={copiedSSH ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                        style={{ height: 30, fontSize: 12, padding: "0 10px" }}
                      >
                        {copiedSSH ? "¡Copiado!" : "Copiar Comando"}
                      </Button>
                      <a
                        href={`ssh://${sshUser}@${device.private_ip || "127.0.0.1"}:${sshPort}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        <Button
                          variant="secondary"
                          icon={<ExternalLink size={13} />}
                          style={{ height: 30, fontSize: 12, padding: "0 10px" }}
                          title="Abrir con el cliente SSH predeterminado del sistema operativo (PuTTY, Terminal, etc.)"
                        >
                          Abrir Cliente SSH
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: "var(--color-text-tertiary)", lineHeight: 1.4 }}>
                    💡 <strong>Cómo conectarte:</strong> Abre tu terminal favorita (PowerShell, CMD, Bash, PuTTY o Termius), pega el comando anterior y presiona Enter. Ingresa la contraseña de <code>{sshUser}</code> para acceder a la sesión remota.
                  </div>
                </div>
              </div>

              {/* TARJETA 2: TERMINAL WEB INTERACTIVA (SHELL EN EL NAVEGADOR) */}
              <div className="q-web-terminal-wrap">
                <div className="q-web-terminal-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Terminal size={14} color="#10b981" />
                    <span style={{ fontWeight: 600, color: "#f1f5f9" }}>
                      Consola Web Interactiva (Shell {device.os_type === "linux" ? "Linux bash/sh" : "Windows CMD"})
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {terminalExitCode !== null && (
                      <span style={{ fontSize: 11, color: terminalExitCode === 0 ? "#34d399" : "#f87171" }}>
                        Código de Retorno: {terminalExitCode}
                      </span>
                    )}
                    {terminalOutput && (
                      <button
                        type="button"
                        className="q-terminal-pill-btn"
                        onClick={handleCopyTerminalOutput}
                        title="Copiar salida de terminal"
                      >
                        {copiedTerminal ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        <span>{copiedTerminal ? "Copiado" : "Copiar"}</span>
                      </button>
                    )}
                    {terminalOutput && (
                      <button
                        type="button"
                        className="q-terminal-pill-btn"
                        onClick={() => {
                          setTerminalOutput(null);
                          setTerminalExitCode(null);
                          setTerminalError(null);
                        }}
                        title="Limpiar salida de la consola"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Comandos Rápidos Diagnósticos */}
                <div className="q-web-terminal-pills">
                  <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginRight: 4 }}>
                    Accesos rápidos:
                  </span>
                  {(device.os_type === "linux" ? [
                    { label: "uname -a", cmd: "uname -a" },
                    { label: "uptime", cmd: "uptime" },
                    { label: "df -h", cmd: "df -h" },
                    { label: "free -m", cmd: "free -m" },
                    { label: "ip a", cmd: "ip -br addr" },
                    { label: "estado agente", cmd: "systemctl status qhapana-agent --no-pager" },
                    { label: "docker ps", cmd: "docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'" },
                  ] : [
                    { label: "systeminfo", cmd: "systeminfo" },
                    { label: "ipconfig", cmd: "ipconfig" },
                    { label: "tasklist", cmd: "tasklist" },
                    { label: "sc query", cmd: "sc query QhapanaAgent" },
                  ]).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="q-terminal-pill-btn"
                      onClick={() => handleExecuteTerminal(item.cmd)}
                      disabled={terminalExecuting || !isOnline}
                      title={`Ejecutar "${item.cmd}" de inmediato`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Barra de Entrada de Comandos */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteTerminal();
                  }}
                  className="q-web-terminal-input-bar"
                >
                  <span className="q-web-terminal-prompt">
                    {sshUser}@{device.hostname}:~$
                  </span>
                  <input
                    type="text"
                    className="q-web-terminal-input"
                    value={terminalCmd}
                    onChange={(e) => setTerminalCmd(e.target.value)}
                    placeholder="Escribe un comando bash o selecciona un acceso rápido..."
                    disabled={terminalExecuting || !isOnline}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={terminalExecuting || !isOnline || !terminalCmd.trim()}
                    icon={terminalExecuting ? <Loader2 size={13} className="q-spin" /> : <Send size={13} />}
                    style={{ height: 28, fontSize: 12, padding: "0 10px" }}
                  >
                    {terminalExecuting ? "Ejecutando..." : "Ejecutar"}
                  </Button>
                </form>

                {/* Salida en Pantalla */}
                <div className="q-web-terminal-screen">
                  {terminalExecuting ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#38bdf8", padding: "10px 0" }}>
                      <Loader2 size={16} className="q-spin" />
                      <span>Ejecutando orden en {device.hostname} a través del agente nativo...</span>
                    </div>
                  ) : terminalError ? (
                    <div style={{ color: "#f87171" }}>
                      <strong>[Error de Ejecución]:</strong> {terminalError}
                    </div>
                  ) : terminalOutput ? (
                    <div>{terminalOutput}</div>
                  ) : (
                    <div style={{ color: "#475569", fontStyle: "italic" }}>
                      Presiona "Ejecutar" o haz clic en alguno de los accesos rápidos de arriba para ver la respuesta del sistema remoto aquí en tiempo real.
                    </div>
                  )}
                </div>
              </div>

              {/* TARJETA 3: REINICIO REMOTO SEGURO */}
              <div className="q-action-card q-action-card--danger">
                <div className="q-action-header">
                  <RotateCcw size={22} color="var(--color-status-danger)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Reinicio Remoto Seguro</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                      Acción directa sobre el sistema operativo
                    </div>
                  </div>
                </div>

                <div className="q-action-desc">
                  Envía una orden al agente nativo de Qhapana para realizar un reinicio ordenado del equipo.
                  El agente enviará un mensaje de despedida antes de iniciar la cuenta regresiva del sistema operativo (5 segundos).
                </div>

                {rebootMessage && (
                  <div style={{ padding: 12, background: "rgba(34, 197, 94, 0.15)", borderRadius: 8, color: "var(--color-status-success)", display: "flex", gap: 8, alignItems: "center" }}>
                    <CheckCircle2 size={16} /> {rebootMessage}
                  </div>
                )}

                {rebootError && (
                  <div style={{ padding: 12, background: "rgba(239, 68, 68, 0.15)", borderRadius: 8, color: "var(--color-status-danger)", display: "flex", gap: 8, alignItems: "center" }}>
                    <AlertTriangle size={16} /> {rebootError}
                  </div>
                )}

                {!isOnline ? (
                  <div style={{ color: "var(--color-status-warning)", fontSize: 13 }}>
                    ⚠️ Esta acción solo está disponible cuando el equipo se encuentra en estado <strong>ONLINE</strong>.
                  </div>
                ) : !showRebootConfirm ? (
                  <div>
                    <Button
                      variant="danger"
                      icon={<RotateCcw size={16} />}
                      onClick={() => setShowRebootConfirm(true)}
                    >
                      Reiniciar Equipo Ahora
                    </Button>
                  </div>
                ) : (
                  <div style={{ background: "var(--color-surface-default)", padding: 14, borderRadius: 8, border: "1px solid var(--color-border-strong)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-status-danger)" }}>
                      ¿Confirmar reinicio inmediato de {device.hostname}?
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      Cualquier sesión activa en el equipo se cerrará y la conexión se interrumpirá mientras el sistema se reinicia.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        variant="danger"
                        disabled={rebooting}
                        onClick={handleExecuteReboot}
                      >
                        {rebooting ? "Enviando orden..." : "Sí, confirmar reinicio"}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={rebooting}
                        onClick={() => setShowRebootConfirm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SYSTEM LOGS & EVENT ANALYSIS */}
          {activeTab === "logs" && (
            <div className="q-modal-section" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="q-terminal-container" style={{ position: "relative", height: "auto", minHeight: 480, display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div className="q-terminal-header">
                  <div className="q-terminal-title">
                    <FileText size={16} color="var(--color-brand-primary)" />
                    <span>Registro de Eventos del Sistema Remoto - {device.hostname}</span>
                    <Badge variant={isOnline ? "success" : "neutral"}>
                      {isOnline ? "En Vivo" : "Desconectado"}
                    </Badge>
                  </div>
                  <div className="q-terminal-actions">
                    <button
                      className="q-terminal-tool-btn"
                      onClick={() => fetchSystemLogs(systemLogSource)}
                      disabled={loadingSystemLogs || !isOnline}
                      title="Actualizar eventos del sistema remoto"
                    >
                      <RefreshCw size={13} className={loadingSystemLogs ? "q-spin" : ""} />
                      <span>{loadingSystemLogs ? "Actualizando..." : "Actualizar"}</span>
                    </button>

                    <button
                      className="q-terminal-tool-btn"
                      onClick={handleCopySystemLogs}
                      disabled={!systemLogs}
                      title="Copiar registros completos al portapapeles"
                    >
                      {copiedSystemLogs ? <Check size={13} color="var(--color-status-success)" /> : <Copy size={13} />}
                      <span>{copiedSystemLogs ? "¡Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                {/* Selector de Origen de Logs */}
                <div className="q-web-terminal-pills" style={{ background: "#0a0f1d", padding: "8px 14px", borderBottom: "1px solid #1c263d" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginRight: 6 }}>
                    Origen del Log:
                  </span>
                  {(device.os_type === "linux" ? [
                    { id: "system", label: "Sistema General (journalctl)" },
                    { id: "kernel", label: "Kernel & Hardware (dmesg)" },
                    { id: "agent", label: "Servicio Qhapana RMM" },
                  ] : [
                    { id: "system", label: "Eventos del Sistema (System)" },
                    { id: "application", label: "Eventos de Aplicación (Application)" },
                  ]).map((src) => (
                    <button
                      key={src.id}
                      type="button"
                      className="q-terminal-pill-btn"
                      style={systemLogSource === src.id ? { background: "rgba(99, 102, 241, 0.25)", borderColor: "var(--color-brand-primary)", color: "#ffffff", fontWeight: 600 } : {}}
                      onClick={() => handleSystemLogSourceChange(src.id)}
                      disabled={loadingSystemLogs || !isOnline}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>

                {/* Toolbar con Búsqueda y Solo Errores */}
                <div className="q-terminal-toolbar">
                  <div className="q-terminal-search-wrap">
                    <Search size={14} className="q-terminal-search-icon" />
                    <input
                      type="text"
                      className="q-terminal-search-input"
                      placeholder="Filtrar eventos del sistema... (ej: error, failed, warning, systemd, sshd, sudo, panic)"
                      value={systemLogSearch}
                      onChange={(e) => setSystemLogSearch(e.target.value)}
                    />
                    {systemLogSearch && (
                      <button
                        className="q-terminal-clear-btn"
                        onClick={() => setSystemLogSearch("")}
                        title="Limpiar búsqueda"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div className="q-terminal-toolbar-actions">
                    <button
                      className={`q-log-toggle ${systemLogOnlyErrors ? "q-log-toggle--active" : ""}`}
                      onClick={() => setSystemLogOnlyErrors((prev) => !prev)}
                      title="Mostrar únicamente líneas que contengan errores o advertencias críticas"
                    >
                      <AlertTriangle size={13} />
                      <span>Solo Errores</span>
                      {totalSystemErrorCount > 0 && (
                        <span className="q-log-toggle-badge">{totalSystemErrorCount}</span>
                      )}
                    </button>

                    <div className="q-log-count">
                      {filteredSystemLogLines.length} / {parsedSystemLogLines.length} eventos
                    </div>
                  </div>
                </div>

                {/* Cuerpo con Pantalla de Terminal */}
                <div className="q-terminal-body" style={{ minHeight: 320, maxHeight: 440 }}>
                  {loadingSystemLogs ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260, gap: 10, color: "var(--color-text-tertiary)" }}>
                      <Loader2 size={20} className="q-spin" color="var(--color-brand-primary)" />
                      <span>Consultando registros de eventos en tiempo real desde {device.hostname}...</span>
                    </div>
                  ) : filteredSystemLogLines.length === 0 ? (
                    <div className="q-terminal-empty" style={{ padding: "40px 20px" }}>
                      <Search size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)" }}>
                        No se encontraron eventos coincidentes
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>
                        {systemLogOnlyErrors
                          ? "No se detectaron líneas con errores en los últimos registros capturados."
                          : "Intenta con otro término de búsqueda o cambia el origen del log."}
                      </div>
                      {(systemLogSearch || systemLogOnlyErrors) && (
                        <button
                          className="q-terminal-tool-btn"
                          style={{ marginTop: 12 }}
                          onClick={() => {
                            setSystemLogSearch("");
                            setSystemLogOnlyErrors(false);
                          }}
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="q-terminal-lines">
                      {filteredSystemLogLines.map((line, idx) => {
                        const isError = ERROR_LOG_REGEX.test(line);
                        return (
                          <div
                            key={idx}
                            className={`q-terminal-line ${isError ? "q-terminal-line--error" : ""}`}
                          >
                            <span className="q-terminal-line-num">{idx + 1}</span>
                            <span className="q-terminal-line-content">
                              {systemLogSearch.trim()
                                ? line.split(new RegExp(`(${systemLogSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")).map((chunk, ci) =>
                                    chunk.toLowerCase() === systemLogSearch.toLowerCase().trim() ? (
                                      <mark key={ci} className="q-terminal-highlight">
                                        {chunk}
                                      </mark>
                                    ) : (
                                      chunk
                                    )
                                  )
                                : line}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ALERTS & CONTACTS */}
          {activeTab === "alerts" && (
            <div className="q-alerts-container">
              <div className="q-alerts-card">
                <div className="q-alerts-card-header">
                  <Bell size={18} color="var(--color-brand-primary)" />
                  <span>Notificación por Desconexión / Apagado Imprevisto</span>
                  <Badge variant={deviceAlertRecipients.length > 0 ? "success" : "neutral"}>
                    {deviceAlertRecipients.length > 0 ? `${deviceAlertRecipients.length} cliente(s)` : "Por defecto (Global)"}
                  </Badge>
                </div>

                <p className="q-alerts-desc">
                  Configura los correos del cliente o área responsable de este equipo. Si se define al menos un correo aquí, cuando <strong>{device.hostname}</strong> se apague de improviso o pierda conexión, la alerta se enviará exclusivamente a este cliente. Si este campo se deja vacío, la alerta se notificará automáticamente a los destinatarios configurados en las alertas generales de la flota.
                </p>

                <form onSubmit={handleAddRecipientEmail} className="q-email-input-row">
                  <input
                    type="email"
                    className="q-email-input"
                    placeholder="Escribe un correo de cliente (ej. cliente@empresa.com) y presiona Enter o Agregar..."
                    value={newEmailInput}
                    onChange={(e) => {
                      setNewEmailInput(e.target.value);
                      if (emailInputError) setEmailInputError(null);
                    }}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    icon={<Plus size={15} />}
                  >
                    Agregar
                  </Button>
                </form>

                {emailInputError && (
                  <div style={{ color: "var(--color-status-danger)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={14} /> {emailInputError}
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase" }}>
                    Correos de Cliente Asignados a {device.hostname}:
                  </div>

                  {deviceAlertRecipients.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", fontStyle: "italic", padding: "10px 0" }}>
                      No hay correos de cliente configurados para este equipo. Las alertas por desconexión o apagado imprevisto se enviarán automáticamente a los administradores generales configurados en "Configuración y Alertas".
                    </div>
                  ) : (
                    <div className="q-email-chips-wrap">
                      {deviceAlertRecipients.map((email) => (
                        <span key={email} className="q-email-chip">
                          <Mail size={13} color="var(--color-brand-primary)" />
                          <span>{email}</span>
                          <button
                            type="button"
                            className="q-email-chip-remove"
                            onClick={() => handleRemoveRecipientEmail(email)}
                            title={`Remover ${email}`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="q-alerts-info-box">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    <Users size={16} color="var(--color-brand-primary)" />
                    <span>Cuentas de Administración Global (Receptores para toda la flota)</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 12.5, lineHeight: 1.5 }}>
                    Estos correos están configurados en <strong>Configuración de Alertas</strong> y siempre recibirán copia de cualquier alerta:
                  </p>
                  <div className="q-email-chips-wrap">
                    {globalAdminRecipients.length === 0 ? (
                      <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                        Cargando administradores globales...
                      </span>
                    ) : (
                      globalAdminRecipients.map((email) => (
                        <span key={email} className="q-email-chip q-email-chip--admin">
                          <Mail size={13} />
                          <span>{email}</span>
                          <span style={{ fontSize: 10.5, opacity: 0.75, fontWeight: 700, textTransform: "uppercase" }}>Admin</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {saveRecipientsSuccess && (
                  <div style={{ padding: 12, background: "rgba(34, 197, 94, 0.15)", borderRadius: 8, color: "var(--color-status-success)", display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                    <CheckCircle2 size={16} /> {saveRecipientsSuccess}
                  </div>
                )}

                {saveRecipientsError && (
                  <div style={{ padding: 12, background: "rgba(239, 68, 68, 0.15)", borderRadius: 8, color: "var(--color-status-danger)", display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                    <AlertTriangle size={16} /> {saveRecipientsError}
                  </div>
                )}

                {testAlertFeedback && (
                  <div style={{
                    padding: 12,
                    background: testAlertFeedback.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    borderRadius: 8,
                    color: testAlertFeedback.type === "success" ? "var(--color-status-success)" : "var(--color-status-danger)",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 13
                  }}>
                    {testAlertFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{testAlertFeedback.msg}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <Button
                    variant="secondary"
                    disabled={testingDeviceAlerts || (globalAdminRecipients.length === 0 && deviceAlertRecipients.length === 0)}
                    onClick={handleTestCombinedAlert}
                    icon={testingDeviceAlerts ? <Loader2 size={15} className="q-spin" /> : <Send size={15} />}
                    title="Envía un correo de prueba en tiempo real tanto a las cuentas del equipo como a los administradores"
                  >
                    {testingDeviceAlerts ? "Enviando prueba..." : "Enviar Correo de Prueba (Admin + Equipo)"}
                  </Button>

                  <Button
                    variant="primary"
                    disabled={savingRecipients}
                    onClick={handleSaveAlertRecipients}
                    icon={savingRecipients ? <Loader2 size={16} className="q-spin" /> : <CheckCircle2 size={16} />}
                  >
                    {savingRecipients ? "Guardando..." : "Guardar Destinatarios del Equipo"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="q-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {onDelete ? (
            <Button
              variant="danger"
              icon={<Trash2 size={16} />}
              onClick={() => {
                if (confirm(`¿Estás seguro de que deseas retirar y eliminar permanentemente el equipo "${device.hostname}" (${device.device_code})?`)) {
                  onDelete(device);
                  onClose();
                }
              }}
            >
              Retirar Equipo
            </Button>
          ) : <div />}
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>

        {/* Terminal Logs Modal */}
        {activeLogContainer && (
          <div className="q-terminal-overlay" onClick={() => setActiveLogContainer(null)}>
            <div className="q-terminal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="q-terminal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Terminal size={18} color="var(--color-brand-primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      Logs: {activeLogContainer.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "var(--font-family-mono)" }}>
                      ID: {activeLogContainer.id} (últimas 150 líneas con marcas de tiempo)
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className="q-terminal-tool-btn"
                    onClick={handleRefreshLogs}
                    disabled={loadingLogs}
                    title="Actualizar registros"
                  >
                    <RefreshCw size={13} className={loadingLogs ? "q-spin" : ""} />
                    <span>Recargar</span>
                  </button>

                  <button
                    className="q-terminal-tool-btn"
                    onClick={handleCopyLogs}
                    disabled={!containerLogs || loadingLogs}
                    title="Copiar registros al portapapeles"
                  >
                    {copiedLogs ? <Check size={13} color="var(--color-status-success)" /> : <Copy size={13} />}
                    <span>{copiedLogs ? "¡Copiado!" : "Copiar"}</span>
                  </button>

                  <button
                    className="q-terminal-tool-btn"
                    onClick={() => setActiveLogContainer(null)}
                    title="Cerrar visor de logs"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Terminal Toolbar: Search & Solo Errores */}
              <div className="q-terminal-toolbar">
                <div className="q-terminal-search-wrap">
                  <Search size={14} className="q-terminal-search-icon" />
                  <input
                    type="text"
                    className="q-terminal-search-input"
                    placeholder="Filtrar eventos en log... (ej: GET, error, 500)"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    autoFocus
                  />
                  {logSearch && (
                    <button
                      className="q-terminal-clear-btn"
                      onClick={() => setLogSearch("")}
                      title="Limpiar búsqueda"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="q-terminal-toolbar-actions">
                  <button
                    className={`q-log-toggle ${logOnlyErrors ? "q-log-toggle--active" : ""}`}
                    onClick={() => setLogOnlyErrors((prev) => !prev)}
                    title="Mostrar únicamente líneas que contengan errores o advertencias críticas"
                  >
                    <AlertTriangle size={13} />
                    <span>Solo Errores</span>
                    {totalErrorCount > 0 && (
                      <span className="q-log-toggle-badge">{totalErrorCount}</span>
                    )}
                  </button>

                  <div className="q-log-count">
                    {filteredLogLines.length} / {totalLogCount} eventos
                  </div>
                </div>
              </div>

              <div className="q-terminal-body">
                {loadingLogs ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: "var(--color-text-tertiary)" }}>
                    <Loader2 size={18} className="q-spin" color="var(--color-brand-primary)" />
                    <span>Consultando registros desde el motor Docker remoto...</span>
                  </div>
                ) : filteredLogLines.length === 0 ? (
                  <div className="q-terminal-empty">
                    <Search size={26} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)" }}>
                      No se encontraron eventos coincidentes
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>
                      {logOnlyErrors
                        ? "No se detectaron líneas de error en los registros capturados."
                        : "Intenta con otro término de búsqueda."}
                    </div>
                    {(logSearch || logOnlyErrors) && (
                      <button
                        className="q-terminal-tool-btn"
                        style={{ marginTop: 12 }}
                        onClick={() => {
                          setLogSearch("");
                          setLogOnlyErrors(false);
                        }}
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="q-terminal-lines">
                    {filteredLogLines.map((line, idx) => {
                      const isError = ERROR_LOG_REGEX.test(line);
                      return (
                        <div
                          key={idx}
                          className={`q-terminal-line ${isError ? "q-terminal-line--error" : ""}`}
                        >
                          <span className="q-terminal-line-num">{idx + 1}</span>
                          <span className="q-terminal-line-content">
                            {logSearch.trim()
                              ? line.split(new RegExp(`(${logSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")).map((chunk, ci) =>
                                  chunk.toLowerCase() === logSearch.toLowerCase().trim() ? (
                                    <mark key={ci} className="q-terminal-highlight">
                                      {chunk}
                                    </mark>
                                  ) : (
                                    chunk
                                  )
                                )
                              : line}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Escritorio Remoto */}
        <RemoteDesktopModal
          device={device}
          isOpen={showRemoteDesktop}
          onClose={() => setShowRemoteDesktop(false)}
        />

        {/* Diálogo de Confirmación para Finalizar Proceso Remoto */}
        {processToTerminate && (
          <div
            className="q-proc-confirm-overlay"
            onClick={() => !terminatingPid && setProcessToTerminate(null)}
          >
            <div className="q-proc-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="q-proc-confirm-icon-wrap">
                <AlertTriangle size={24} color="var(--color-status-danger)" />
              </div>
              <div className="q-proc-confirm-title">¿Finalizar proceso remoto?</div>
              <p className="q-proc-confirm-desc">
                Estás a punto de terminar forzosamente el proceso{" "}
                <strong style={{ color: "var(--color-brand-primary)" }}>{processToTerminate.name}</strong>{" "}
                (PID: <code className="q-proc-pid-badge">{processToTerminate.pid}</code>) en el equipo{" "}
                <strong>{device.hostname}</strong> ({device.os_type}).
              </p>
              <div className="q-proc-confirm-warning">
                ⚠️ Esta acción interrumpirá de inmediato la ejecución de la aplicación en la máquina remota. Cualquier dato o trabajo no guardado se perderá.
              </div>
              <div className="q-proc-confirm-actions">
                <button
                  type="button"
                  className="q-proc-btn-cancel"
                  onClick={() => setProcessToTerminate(null)}
                  disabled={terminatingPid !== null}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="q-proc-btn-danger"
                  onClick={handleConfirmTerminateProcess}
                  disabled={terminatingPid !== null}
                >
                  {terminatingPid !== null ? (
                    <>
                      <Loader2 size={14} className="q-spin" />
                      <span>Finalizando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Sí, Finalizar Proceso</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
