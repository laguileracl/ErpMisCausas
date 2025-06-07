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
    let query = db.select().from(accounts).where(eq(accounts.isActive, true));
    
    if (parentId !== undefined) {
      query = query.where(eq(accounts.parentId, parentId));
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

  // Voucher Management
  async getVouchers(): Promise<Voucher[]> {
    return await db.select().from(vouchers).orderBy(desc(vouchers.issueDate));
  }

  async getVoucherById(id: number): Promise<Voucher | null> {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id));
    return voucher || null;
  }

  async createVoucher(voucherData: InsertVoucher): Promise<Voucher> {
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
}

export const accountingService = new AccountingService();