import { db } from "./db";
import { 
  accounts, 
  vouchers, 
  voucherLines, 
  legalCases,
  type Account,
  type Voucher,
  type VoucherLine,
  type InsertAccount,
  type InsertVoucher,
  type InsertVoucherLine
} from "@shared/schema";
import { eq, and, desc, asc, sum, sql, between, like, inArray } from "drizzle-orm";

export class AccountingService {
  // Chart of Accounts Management
  async getAccounts(parentId?: number): Promise<Account[]> {
    const query = db.select().from(accounts).where(eq(accounts.isActive, true));
    
    if (parentId !== undefined) {
      query.where(eq(accounts.parentId, parentId));
    }
    
    return await query.orderBy(asc(accounts.code));
  }

  async createAccount(accountData: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(accountData).returning();
    return account;
  }

  async updateAccount(id: number, accountData: Partial<InsertAccount>): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return account;
  }

  async getAccountsByType(type: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.type, type), eq(accounts.isActive, true)))
      .orderBy(asc(accounts.code));
  }

  // Legal Case Accounts Management
  async getLegalCaseAccounts(legalCaseId: number): Promise<Account[]> {
    return await db
      .select({
        id: accounts.id,
        code: accounts.code,
        name: accounts.name,
        type: accounts.type,
        category: accounts.category,
        parentId: accounts.parentId,
        isActive: accounts.isActive,
        description: accounts.description,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .innerJoin(legalCaseAccounts, eq(accounts.id, legalCaseAccounts.accountId))
      .where(
        and(
          eq(legalCaseAccounts.legalCaseId, legalCaseId),
          eq(legalCaseAccounts.isActive, true),
          eq(accounts.isActive, true)
        )
      )
      .orderBy(asc(accounts.code));
  }

  async assignAccountsToLegalCase(legalCaseId: number, accountIds: number[]): Promise<void> {
    const values = accountIds.map(accountId => ({
      legalCaseId,
      accountId,
      isActive: true,
    }));

    await db.insert(legalCaseAccounts).values(values);
  }

  // Voucher Management
  async getVouchers(filters?: {
    legalCaseId?: number;
    contactId?: number;
    companyId?: number;
    documentType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Voucher[]> {
    let query = db.select().from(vouchers);

    if (filters?.legalCaseId) {
      query = query.where(eq(vouchers.legalCaseId, filters.legalCaseId));
    }
    if (filters?.contactId) {
      query = query.where(eq(vouchers.contactId, filters.contactId));
    }
    if (filters?.companyId) {
      query = query.where(eq(vouchers.companyId, filters.companyId));
    }
    if (filters?.documentType) {
      query = query.where(eq(vouchers.documentType, filters.documentType));
    }
    if (filters?.status) {
      query = query.where(eq(vouchers.status, filters.status));
    }
    if (filters?.startDate && filters?.endDate) {
      query = query.where(between(vouchers.issueDate, filters.startDate, filters.endDate));
    }

    query = query.orderBy(desc(vouchers.issueDate));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getVoucherById(id: number): Promise<Voucher | null> {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id));
    return voucher || null;
  }

  async createVoucher(voucherData: InsertVoucher): Promise<Voucher> {
    // Generate unique voucher number
    const voucherNumber = await this.generateVoucherNumber();
    
    const [voucher] = await db
      .insert(vouchers)
      .values({ ...voucherData, voucherNumber })
      .returning();
    
    return voucher;
  }

  async updateVoucher(id: number, voucherData: Partial<InsertVoucher>): Promise<Voucher> {
    const [voucher] = await db
      .update(vouchers)
      .set({ ...voucherData, updatedAt: new Date() })
      .where(eq(vouchers.id, id))
      .returning();
    return voucher;
  }

  async deleteVoucher(id: number): Promise<void> {
    // First delete related journal entries and lines
    const journalEntriesToDelete = await db
      .select({ id: journalEntries.id })
      .from(journalEntries)
      .where(eq(journalEntries.voucherId, id));

    for (const entry of journalEntriesToDelete) {
      await db.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, entry.id));
    }
    
    await db.delete(journalEntries).where(eq(journalEntries.voucherId, id));
    await db.delete(voucherLines).where(eq(voucherLines.voucherId, id));
    await db.delete(vouchers).where(eq(vouchers.id, id));
  }

  // Voucher Lines Management
  async getVoucherLines(voucherId: number): Promise<VoucherLine[]> {
    return await db
      .select()
      .from(voucherLines)
      .where(eq(voucherLines.voucherId, voucherId))
      .orderBy(asc(voucherLines.lineOrder));
  }

  async createVoucherLine(lineData: InsertVoucherLine): Promise<VoucherLine> {
    const [line] = await db.insert(voucherLines).values(lineData).returning();
    return line;
  }

  async updateVoucherLine(id: number, lineData: Partial<InsertVoucherLine>): Promise<VoucherLine> {
    const [line] = await db
      .update(voucherLines)
      .set(lineData)
      .where(eq(voucherLines.id, id))
      .returning();
    return line;
  }

  async deleteVoucherLine(id: number): Promise<void> {
    await db.delete(voucherLines).where(eq(voucherLines.id, id));
  }

  // Journal Entry Management
  async generateJournalEntry(voucherId: number): Promise<JournalEntry> {
    const voucher = await this.getVoucherById(voucherId);
    if (!voucher) {
      throw new Error("Voucher not found");
    }

    const lines = await this.getVoucherLines(voucherId);
    if (lines.length === 0) {
      throw new Error("Voucher has no lines");
    }

    const entryNumber = await this.generateEntryNumber();
    const totalDebit = lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.creditAmount, 0);

    if (totalDebit !== totalCredit) {
      throw new Error("Debit and credit amounts must be equal");
    }

    const [journalEntry] = await db
      .insert(journalEntries)
      .values({
        voucherId,
        entryNumber,
        entryDate: voucher.issueDate,
        description: voucher.description,
        totalDebit,
        totalCredit,
        isPosted: false,
      })
      .returning();

    // Create journal entry lines
    for (const [index, line] of lines.entries()) {
      await db.insert(journalEntryLines).values({
        journalEntryId: journalEntry.id,
        accountId: line.accountId,
        description: line.description,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        lineOrder: index + 1,
      });
    }

    return journalEntry;
  }

  async postJournalEntry(id: number, userId: number): Promise<JournalEntry> {
    const [entry] = await db
      .update(journalEntries)
      .set({
        isPosted: true,
        postedBy: userId,
        postedAt: new Date(),
      })
      .where(eq(journalEntries.id, id))
      .returning();

    return entry;
  }

  // General Ledger and Reports
  async getGeneralLedger(filters?: {
    legalCaseId?: number;
    accountId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    let query = db
      .select({
        entryDate: journalEntries.entryDate,
        entryNumber: journalEntries.entryNumber,
        description: journalEntryLines.description,
        accountCode: accounts.code,
        accountName: accounts.name,
        debitAmount: journalEntryLines.debitAmount,
        creditAmount: journalEntryLines.creditAmount,
        voucherNumber: vouchers.voucherNumber,
        documentType: vouchers.documentType,
        folioNumber: vouchers.folioNumber,
      })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
      .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
      .innerJoin(vouchers, eq(journalEntries.voucherId, vouchers.id))
      .where(eq(journalEntries.isPosted, true));

    if (filters?.legalCaseId) {
      query = query.where(eq(vouchers.legalCaseId, filters.legalCaseId));
    }
    if (filters?.accountId) {
      query = query.where(eq(journalEntryLines.accountId, filters.accountId));
    }
    if (filters?.startDate && filters?.endDate) {
      query = query.where(between(journalEntries.entryDate, filters.startDate, filters.endDate));
    }

    const entries = await query.orderBy(asc(journalEntries.entryDate), asc(journalEntries.entryNumber));

    // Calculate running balances
    const ledgerWithBalances = [];
    let runningBalance = 0;

    for (const entry of entries) {
      runningBalance += entry.debitAmount - entry.creditAmount;
      ledgerWithBalances.push({
        ...entry,
        balance: runningBalance,
      });
    }

    return ledgerWithBalances;
  }

  async getIncomeStatement(legalCaseId?: number, startDate?: Date, endDate?: Date) {
    let query = db
      .select({
        accountCode: accounts.code,
        accountName: accounts.name,
        accountType: accounts.type,
        accountCategory: accounts.category,
        amount: sum(sql`${journalEntryLines.creditAmount} - ${journalEntryLines.debitAmount}`).as('amount'),
      })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
      .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
      .innerJoin(vouchers, eq(journalEntries.voucherId, vouchers.id))
      .where(
        and(
          eq(journalEntries.isPosted, true),
          inArray(accounts.type, ['income', 'expense'])
        )
      )
      .groupBy(accounts.id, accounts.code, accounts.name, accounts.type, accounts.category);

    if (legalCaseId) {
      query = query.where(eq(vouchers.legalCaseId, legalCaseId));
    }
    if (startDate && endDate) {
      query = query.where(between(journalEntries.entryDate, startDate, endDate));
    }

    const results = await query.orderBy(asc(accounts.code));

    const income = results.filter(r => r.accountType === 'income');
    const expenses = results.filter(r => r.accountType === 'expense');
    
    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netIncome,
    };
  }

  async getBalanceSheet(legalCaseId?: number, asOfDate?: Date) {
    let query = db
      .select({
        accountCode: accounts.code,
        accountName: accounts.name,
        accountType: accounts.type,
        accountCategory: accounts.category,
        amount: sum(sql`${journalEntryLines.debitAmount} - ${journalEntryLines.creditAmount}`).as('amount'),
      })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
      .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
      .innerJoin(vouchers, eq(journalEntries.voucherId, vouchers.id))
      .where(
        and(
          eq(journalEntries.isPosted, true),
          inArray(accounts.type, ['asset', 'liability', 'equity'])
        )
      )
      .groupBy(accounts.id, accounts.code, accounts.name, accounts.type, accounts.category);

    if (legalCaseId) {
      query = query.where(eq(vouchers.legalCaseId, legalCaseId));
    }
    if (asOfDate) {
      query = query.where(sql`${journalEntries.entryDate} <= ${asOfDate}`);
    }

    const results = await query.orderBy(asc(accounts.code));

    const assets = results.filter(r => r.accountType === 'asset');
    const liabilities = results.filter(r => r.accountType === 'liability');
    const equity = results.filter(r => r.accountType === 'equity');
    
    const totalAssets = assets.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalEquity = equity.reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
    };
  }

  // Cuenta Provisoria for Chilean courts
  async getCuentaProvisoria(legalCaseId: number, periodStartDate: Date, periodEndDate: Date) {
    // Get the legal case details
    const [legalCase] = await db
      .select()
      .from(legalCases)
      .where(eq(legalCases.id, legalCaseId));

    if (!legalCase) {
      throw new Error("Legal case not found");
    }

    // Get previous balance (before period start)
    const previousBalance = await this.getBalanceAsOf(legalCaseId, new Date(periodStartDate.getTime() - 1));
    
    // Get period movements
    const periodMovements = await this.getIncomeStatement(legalCaseId, periodStartDate, periodEndDate);
    
    // Calculate account balances for standard categories
    const categories = {
      "1. FONDOS RECIBIDOS": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "fondos_recibidos"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "fondos_recibidos"),
      },
      "2. VENTAS DE BIENES MUEBLES": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "ventas_muebles"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "ventas_muebles"),
      },
      "3. VENTAS DE INMUEBLES": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "ventas_inmuebles"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "ventas_inmuebles"),
      },
      "4. HONORARIOS DEL LIQUIDADOR": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "honorarios_liquidador"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "honorarios_liquidador"),
      },
      "5. INTERESES GANADOS": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "intereses_ganados"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "intereses_ganados"),
      },
      "6. OTROS INGRESOS": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "otros_ingresos"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "otros_ingresos"),
      },
      "7. PAGO A MINISTRO DE FE": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "ministro_fe"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "ministro_fe"),
      },
      "8. GASTOS DE PUBLICIDAD": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "gastos_publicidad"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "gastos_publicidad"),
      },
      "9. GASTOS DE BODEGAJE": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "gastos_bodegaje"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "gastos_bodegaje"),
      },
      "10. HONORARIOS DE TERCEROS": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "honorarios_terceros"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "honorarios_terceros"),
      },
      "11. GASTOS GENERALES": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "gastos_generales"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "gastos_generales"),
      },
      "12. OTROS GASTOS": {
        saldoAnterior: this.getCategoryBalance(previousBalance, "otros_gastos"),
        montoPeriodo: this.getCategoryMovement(periodMovements, "otros_gastos"),
      },
    };

    // Calculate totals for each category
    const processedCategories = Object.entries(categories).map(([name, data]) => ({
      categoria: name,
      saldoAnterior: data.saldoAnterior,
      montoPeriodo: data.montoPeriodo,
      totalAcumulado: data.saldoAnterior + data.montoPeriodo,
    }));

    // Calculate fondo disponible
    const totalIngresos = processedCategories.slice(0, 6).reduce((sum, cat) => sum + cat.totalAcumulado, 0);
    const totalGastos = processedCategories.slice(6).reduce((sum, cat) => sum + cat.totalAcumulado, 0);
    const fondoDisponible = totalIngresos - totalGastos;

    return {
      legalCase,
      period: {
        startDate: periodStartDate,
        endDate: periodEndDate,
      },
      categories: processedCategories,
      totales: {
        totalIngresos,
        totalGastos,
        fondoDisponible,
      },
    };
  }

  // Utility methods
  private async generateVoucherNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `V${year}`;
    
    const lastVoucher = await db
      .select({ voucherNumber: vouchers.voucherNumber })
      .from(vouchers)
      .where(like(vouchers.voucherNumber, `${prefix}%`))
      .orderBy(desc(vouchers.voucherNumber))
      .limit(1);

    if (lastVoucher.length === 0) {
      return `${prefix}-001`;
    }

    const lastNumber = parseInt(lastVoucher[0].voucherNumber.split('-')[1]) || 0;
    return `${prefix}-${String(lastNumber + 1).padStart(3, '0')}`;
  }

  private async generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE${year}`;
    
    const lastEntry = await db
      .select({ entryNumber: journalEntries.entryNumber })
      .from(journalEntries)
      .where(like(journalEntries.entryNumber, `${prefix}%`))
      .orderBy(desc(journalEntries.entryNumber))
      .limit(1);

    if (lastEntry.length === 0) {
      return `${prefix}-001`;
    }

    const lastNumber = parseInt(lastEntry[0].entryNumber.split('-')[1]) || 0;
    return `${prefix}-${String(lastNumber + 1).padStart(3, '0')}`;
  }

  private async getBalanceAsOf(legalCaseId: number, asOfDate: Date) {
    return await this.getBalanceSheet(legalCaseId, asOfDate);
  }

  private getCategoryBalance(balance: any, category: string): number {
    // This would map account categories to their balances
    // Implementation depends on how categories are structured
    return 0;
  }

  private getCategoryMovement(movements: any, category: string): number {
    // This would map account categories to their movements
    // Implementation depends on how categories are structured
    return 0;
  }
}

export const accountingService = new AccountingService();