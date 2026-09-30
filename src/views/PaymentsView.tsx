import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  RefreshCw,
  X,
  Printer,
  Building2,
  Calendar,
} from "lucide-react";
import { Badge } from "../components/Badge/Badge";
import { Button } from "../components/Button/Button";
import { KpiCard } from "../components/KpiCard/KpiCard";
import { getTransactions, getPaymentStats } from "../services/api";
import type { Transaction, PaymentStats } from "../types/payment";
import "./PaymentsView.css";

export const PaymentsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txList, st] = await Promise.all([getTransactions(), getPaymentStats()]);
      setTransactions(txList);
      setStats(st);
    } catch (err) {
      console.error("Error cargando transacciones:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTx = transactions.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.transaction_ref.toLowerCase().includes(term) ||
      (t.organization_name && t.organization_name.toLowerCase().includes(term)) ||
      (t.user_name && t.user_name.toLowerCase().includes(term)) ||
      (t.user_email && t.user_email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="q-payments-view">
      {/* Cabecera */}
      <div className="q-payments-header">
        <div>
          <h1>Historial de Pagos y Facturación SaaS</h1>
          <p>
            Supervisa las transacciones realizadas, suscripciones activas por cliente y emite comprobantes digitales.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={fetchData} loading={isLoading}>
          <RefreshCw size={14} /> Actualizar
        </Button>
      </div>

      {/* Tarjetas KPI */}
      <div className="q-payments-kpis">
        <KpiCard
          title="Volumen Facturado (Est. USD)"
          value={`$ ${stats ? stats.total_revenue_usd.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}`}
          subtitle="Total acumulado en suscripciones"
          icon={<DollarSign size={20} />}
        />

        <KpiCard
          title="Total de Transacciones"
          value={stats ? stats.total_transactions : 0}
          subtitle="Pagos procesados con éxito"
          icon={<CreditCard size={20} />}
        />

        <KpiCard
          title="Suscripciones Activas"
          value={stats ? stats.active_subscriptions : 0}
          subtitle={`Pro: ${stats?.pro_count || 0} | Enterprise: ${stats?.enterprise_count || 0}`}
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)", borderRadius: "8px", padding: "0 12px", height: "38px", minWidth: "280px" }}>
          <Search size={15} color="var(--color-text-secondary)" />
          <input
            type="text"
            placeholder="Buscar por referencia, cliente o usuario..."
            style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: "13px", color: "var(--color-text-primary)" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="q-payments-card">
        <table className="q-payments-table">
          <thead>
            <tr>
              <th>Referencia TXN</th>
              <th>Cliente / Organización</th>
              <th>Usuario</th>
              <th>Plan</th>
              <th>Monto</th>
              <th>Método / Pasarela</th>
              <th>Cupón</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                  No se encontraron pagos registrados en el sistema.
                </td>
              </tr>
            ) : (
              filteredTx.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "12px", color: "var(--color-brand-primary)" }}>
                      {t.transaction_ref}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                      <Building2 size={14} color="var(--color-brand-primary)" />
                      {t.organization_name || "N/A"}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.user_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{t.user_email}</div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={t.plan_tier === "ENTERPRISE" ? "warning" : "info"}>
                      {t.plan_tier} ({t.billing_cycle === "yearly" ? "Anual" : "Mensual"})
                    </Badge>
                  </td>
                  <td>
                    <span className="q-payment-amount">
                      {t.currency} {t.amount.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CreditCard size={14} />
                      {t.card_brand ? `${t.card_brand} •••• ${t.card_last4}` : t.gateway}
                    </span>
                  </td>
                  <td>
                    {t.promo_code ? (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                        {t.promo_code}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={13} />
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <Badge variant={t.status === "COMPLETED" ? "success" : "warning"}>
                      {t.status === "COMPLETED" ? "Completado" : t.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedReceipt(t)}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      <FileText size={13} /> Ver Recibo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Comprobante Digital */}
      {selectedReceipt && (
        <div className="q-checkout-modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="q-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <button className="q-modal-close" onClick={() => setSelectedReceipt(null)}>
              <X size={20} />
            </button>

            <div className="q-receipt-header">
              <div className="q-receipt-brand">Qhapana RMM</div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                Comprobante Electrónico de Pago SaaS
              </p>
              <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-brand-primary)" }}>
                {selectedReceipt.transaction_ref}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="q-receipt-row">
                <span>Cliente / Razón Social:</span>
                <strong>{selectedReceipt.organization_name}</strong>
              </div>
              <div className="q-receipt-row">
                <span>Titular de la Cuenta:</span>
                <span>{selectedReceipt.user_name} ({selectedReceipt.user_email})</span>
              </div>
              <div className="q-receipt-row">
                <span>Plan Contratado:</span>
                <strong>{selectedReceipt.plan_tier} RMM</strong>
              </div>
              <div className="q-receipt-row">
                <span>Frecuencia:</span>
                <span>{selectedReceipt.billing_cycle === "yearly" ? "Anual (Descuento -20% aplicado)" : "Mensual"}</span>
              </div>
              <div className="q-receipt-row">
                <span>Método de Pago:</span>
                <span>{selectedReceipt.card_brand ? `${selectedReceipt.card_brand} terminada en ${selectedReceipt.card_last4}` : selectedReceipt.gateway}</span>
              </div>
              {selectedReceipt.promo_code && (
                <div className="q-receipt-row" style={{ color: "#10b981" }}>
                  <span>Cupón Promocional:</span>
                  <strong>{selectedReceipt.promo_code}</strong>
                </div>
              )}
              <div className="q-receipt-row">
                <span>Fecha de Emisión:</span>
                <span>{new Date(selectedReceipt.created_at).toLocaleString()}</span>
              </div>
              <div className="q-receipt-row">
                <span>Estado:</span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Pago Exitoso</span>
              </div>

              <div className="q-receipt-row q-receipt-total">
                <span>Total Cobrado:</span>
                <span>{selectedReceipt.currency} {selectedReceipt.amount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={14} /> Imprimir Recibo
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedReceipt(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
