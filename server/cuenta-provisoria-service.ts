import { db } from "./db";
import { 
  cuentaProvisoria, 
  cuentaProvisoriaMovements, 
  legalCases, 
  vouchers, 
  voucherLines, 
  accounts,
  type CuentaProvisoria, 
  type CuentaProvisoriaMovement,
  type InsertCuentaProvisoria,
  type InsertCuentaProvisoriaMovement 
} from "@shared/schema";
import { eq, and, desc, asc, between, sql } from "drizzle-orm";

export class CuentaProvisoriaService {

  // Crear nueva cuenta provisoria para un período específico
  async createCuentaProvisoria(data: InsertCuentaProvisoria): Promise<CuentaProvisoria> {
    // Verificar si ya existe para este período
    const existing = await db
      .select()
      .from(cuentaProvisoria)
      .where(
        and(
          eq(cuentaProvisoria.legalCaseId, data.legalCaseId),
          eq(cuentaProvisoria.period, data.period)
        )
      );

    if (existing.length > 0) {
      throw new Error(`Ya existe una cuenta provisoria para el período ${data.period}`);
    }

    const [created] = await db
      .insert(cuentaProvisoria)
      .values(data)
      .returning();

    // Generar movimientos automáticamente desde los comprobantes
    await this.generateMovementsFromVouchers(created.id, data.legalCaseId, data.year, data.month);

    return created;
  }

  // Obtener cuenta provisoria por ID
  async getCuentaProvisoriaById(id: number): Promise<CuentaProvisoria | null> {
    const [result] = await db
      .select()
      .from(cuentaProvisoria)
      .where(eq(cuentaProvisoria.id, id));

    return result || null;
  }

  // Obtener cuentas provisorias de una causa
  async getCuentasProvisoriasByCaseId(legalCaseId: number): Promise<CuentaProvisoria[]> {
    return await db
      .select()
      .from(cuentaProvisoria)
      .where(eq(cuentaProvisoria.legalCaseId, legalCaseId))
      .orderBy(desc(cuentaProvisoria.year), desc(cuentaProvisoria.month));
  }

  // Obtener movimientos de una cuenta provisoria
  async getMovements(cuentaProvisoriaId: number): Promise<CuentaProvisoriaMovement[]> {
    return await db
      .select()
      .from(cuentaProvisoriaMovements)
      .where(eq(cuentaProvisoriaMovements.cuentaProvisoriaId, cuentaProvisoriaId))
      .orderBy(asc(cuentaProvisoriaMovements.orderIndex));
  }

  // Generar movimientos automáticamente desde comprobantes
  async generateMovementsFromVouchers(
    cuentaProvisoriaId: number,
    legalCaseId: number,
    year: number,
    month: number
  ): Promise<void> {
    // Limpiar movimientos existentes
    await db
      .delete(cuentaProvisoriaMovements)
      .where(eq(cuentaProvisoriaMovements.cuentaProvisoriaId, cuentaProvisoriaId));

    // Obtener comprobantes del período
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const vouchersData = await db
      .select({
        voucher: vouchers,
        lines: voucherLines,
        account: accounts,
      })
      .from(vouchers)
      .leftJoin(voucherLines, eq(vouchers.id, voucherLines.voucherId))
      .leftJoin(accounts, eq(voucherLines.accountId, accounts.id))
      .where(
        and(
          eq(vouchers.legalCaseId, legalCaseId),
          between(sql`DATE(${vouchers.issueDate})`, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(vouchers.issueDate), asc(voucherLines.lineOrder));

    let runningBalance = 0;
    let orderIndex = 1;

    // Obtener saldo anterior (último saldo del mes anterior)
    const previousPeriod = month === 1 ? `${year - 1}-12` : `${year}-${(month - 1).toString().padStart(2, '0')}`;
    const previousCuenta = await db
      .select()
      .from(cuentaProvisoria)
      .where(
        and(
          eq(cuentaProvisoria.legalCaseId, legalCaseId),
          eq(cuentaProvisoria.period, previousPeriod)
        )
      );

    if (previousCuenta.length > 0) {
      runningBalance = previousCuenta[0].saldoFinal;
      
      // Agregar saldo anterior como primer movimiento
      await db.insert(cuentaProvisoriaMovements).values({
        cuentaProvisoriaId,
        date: startDate,
        description: "Saldo anterior",
        tipo: "ingreso",
        amount: runningBalance,
        balance: runningBalance,
        orderIndex: orderIndex++,
      });
    }

    let totalIngresos = 0;
    let totalEgresos = 0;

    // Procesar cada línea de comprobante
    for (const row of vouchersData) {
      if (!row.lines || !row.account) continue;

      const isIngreso = row.account.type === 'income' || 
                        (row.account.type === 'asset' && row.lines.debitAmount > 0);
      
      const amount = row.lines.totalAmount;
      const tipo = isIngreso ? 'ingreso' : 'egreso';
      
      if (tipo === 'ingreso') {
        runningBalance += amount;
        totalIngresos += amount;
      } else {
        runningBalance -= amount;
        totalEgresos += amount;
      }

      await db.insert(cuentaProvisoriaMovements).values({
        cuentaProvisoriaId,
        date: new Date(row.voucher.issueDate),
        description: row.lines.description,
        documentType: row.voucher.documentType,
        documentNumber: row.voucher.folioNumber,
        tipo,
        amount,
        balance: runningBalance,
        accountId: row.account.id,
        voucherId: row.voucher.id,
        orderIndex: orderIndex++,
      });
    }

    // Actualizar totales en la cuenta provisoria
    await db
      .update(cuentaProvisoria)
      .set({
        totalIngresos,
        totalEgresos,
        saldoAnterior: previousCuenta.length > 0 ? previousCuenta[0].saldoFinal : 0,
        saldoFinal: runningBalance,
      })
      .where(eq(cuentaProvisoria.id, cuentaProvisoriaId));
  }

  // Generar datos para PDF con formato específico de tribunal
  async generatePDFData(cuentaProvisoriaId: number): Promise<{
    cuenta: CuentaProvisoria;
    legalCase: any;
    movements: CuentaProvisoriaMovement[];
    summary: {
      saldoAnterior: number;
      totalIngresos: number;
      totalEgresos: number;
      saldoFinal: number;
    };
  }> {
    const cuenta = await this.getCuentaProvisoriaById(cuentaProvisoriaId);
    if (!cuenta) {
      throw new Error("Cuenta provisoria no encontrada");
    }

    // Obtener datos de la causa judicial
    const [legalCase] = await db
      .select()
      .from(legalCases)
      .where(eq(legalCases.id, cuenta.legalCaseId));

    if (!legalCase) {
      throw new Error("Causa judicial no encontrada");
    }

    const movements = await this.getMovements(cuentaProvisoriaId);

    return {
      cuenta,
      legalCase,
      movements,
      summary: {
        saldoAnterior: cuenta.saldoAnterior,
        totalIngresos: cuenta.totalIngresos,
        totalEgresos: cuenta.totalEgresos,
        saldoFinal: cuenta.saldoFinal,
      },
    };
  }

  // Generar nombre de archivo según formato: ROL + nombre_deudor + mes + año
  generateFileName(rol: string, debtorName: string, month: number, year: number): string {
    const monthName = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ][month - 1];

    const cleanDebtorName = debtorName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();

    return `${rol}_${cleanDebtorName}_${monthName}_${year}.pdf`;
  }

  // Obtener resumen financiero por período
  async getFinancialSummary(legalCaseId: number, year: number, month?: number): Promise<{
    totalIngresos: number;
    totalEgresos: number;
    saldoFinal: number;
    numeroMovimientos: number;
  }> {
    let whereCondition = and(
      eq(cuentaProvisoria.legalCaseId, legalCaseId),
      eq(cuentaProvisoria.year, year)
    );

    if (month) {
      whereCondition = and(whereCondition, eq(cuentaProvisoria.month, month));
    }

    const result = await db
      .select({
        totalIngresos: sql<number>`SUM(${cuentaProvisoria.totalIngresos})`,
        totalEgresos: sql<number>`SUM(${cuentaProvisoria.totalEgresos})`,
        saldoFinal: sql<number>`SUM(${cuentaProvisoria.saldoFinal})`,
        numeroMovimientos: sql<number>`COUNT(*)`,
      })
      .from(cuentaProvisoria)
      .where(whereCondition);

    return result[0] || {
      totalIngresos: 0,
      totalEgresos: 0,
      saldoFinal: 0,
      numeroMovimientos: 0,
    };
  }

  // Actualizar estado de la cuenta provisoria
  async updateStatus(id: number, status: 'draft' | 'approved' | 'submitted'): Promise<void> {
    await db
      .update(cuentaProvisoria)
      .set({ status })
      .where(eq(cuentaProvisoria.id, id));
  }

  // Validar integridad de los datos
  async validateCuentaProvisoria(id: number): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const cuenta = await this.getCuentaProvisoriaById(id);
    if (!cuenta) {
      return { isValid: false, errors: ["Cuenta provisoria no encontrada"] };
    }

    const movements = await this.getMovements(id);
    const errors: string[] = [];

    // Validar que los totales coincidan
    const calculatedIngresos = movements
      .filter(m => m.tipo === 'ingreso' && m.description !== 'Saldo anterior')
      .reduce((sum, m) => sum + m.amount, 0);

    const calculatedEgresos = movements
      .filter(m => m.tipo === 'egreso')
      .reduce((sum, m) => sum + m.amount, 0);

    if (calculatedIngresos !== cuenta.totalIngresos) {
      errors.push("Total de ingresos no coincide con los movimientos");
    }

    if (calculatedEgresos !== cuenta.totalEgresos) {
      errors.push("Total de egresos no coincide con los movimientos");
    }

    // Validar saldo final
    const expectedBalance = cuenta.saldoAnterior + calculatedIngresos - calculatedEgresos;
    if (expectedBalance !== cuenta.saldoFinal) {
      errors.push("Saldo final no coincide con el cálculo esperado");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const cuentaProvisoriaService = new CuentaProvisoriaService();