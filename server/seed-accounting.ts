import { db } from "./db";
import { accounts, vouchers, voucherLines } from "@shared/schema";

async function seedAccounting() {
  console.log("Seeding accounting data...");

  // Create chart of accounts
  const accountsToCreate = [
    // Activos
    { code: "1.1.1", name: "Caja", type: "asset", category: "efectivo", isActive: true },
    { code: "1.1.2", name: "Banco Estado", type: "asset", category: "bancos", isActive: true },
    { code: "1.2.1", name: "Cuentas por Cobrar", type: "asset", category: "cuentas_por_cobrar", isActive: true },
    { code: "1.3.1", name: "Muebles y Enseres", type: "asset", category: "activo_fijo", isActive: true },

    // Pasivos
    { code: "2.1.1", name: "Proveedores", type: "liability", category: "cuentas_por_pagar", isActive: true },
    { code: "2.2.1", name: "IVA Débito Fiscal", type: "liability", category: "impuestos", isActive: true },
    { code: "2.2.2", name: "IVA Crédito Fiscal", type: "asset", category: "impuestos", isActive: true },

    // Patrimonio
    { code: "3.1.1", name: "Capital", type: "equity", category: "capital", isActive: true },
    { code: "3.2.1", name: "Utilidades Retenidas", type: "equity", category: "utilidades", isActive: true },

    // Ingresos
    { code: "4.1.1", name: "Honorarios Profesionales", type: "income", category: "honorarios", isActive: true },
    { code: "4.1.2", name: "Fondos Recibidos", type: "income", category: "fondos_recibidos", isActive: true },
    { code: "4.2.1", name: "Ventas de Bienes Muebles", type: "income", category: "ventas_muebles", isActive: true },
    { code: "4.2.2", name: "Ventas de Inmuebles", type: "income", category: "ventas_inmuebles", isActive: true },
    { code: "4.3.1", name: "Intereses Ganados", type: "income", category: "intereses_ganados", isActive: true },
    { code: "4.9.1", name: "Otros Ingresos", type: "income", category: "otros_ingresos", isActive: true },

    // Gastos
    { code: "5.1.1", name: "Gastos de Oficina", type: "expense", category: "gastos_generales", isActive: true },
    { code: "5.1.2", name: "Gastos de Publicidad", type: "expense", category: "gastos_publicidad", isActive: true },
    { code: "5.1.3", name: "Gastos de Bodegaje", type: "expense", category: "gastos_bodegaje", isActive: true },
    { code: "5.2.1", name: "Honorarios de Terceros", type: "expense", category: "honorarios_terceros", isActive: true },
    { code: "5.2.2", name: "Pago a Ministro de Fe", type: "expense", category: "ministro_fe", isActive: true },
    { code: "5.9.1", name: "Otros Gastos", type: "expense", category: "otros_gastos", isActive: true },
  ];

  const createdAccounts = [];
  for (const account of accountsToCreate) {
    try {
      const [createdAccount] = await db.insert(accounts).values(account).returning();
      createdAccounts.push(createdAccount);
    } catch (error) {
      console.log(`Account ${account.code} already exists, skipping...`);
    }
  }

  // Create sample vouchers
  const vouchersToCreate = [
    {
      documentType: "factura",
      folioNumber: "001-12345",
      issueDate: "2024-12-01",
      description: "Honorarios profesionales por asesoría legal",
      subtotal: 100000,
      taxAmount: 19000,
      total: 119000,
      status: "pending",
      createdBy: 1,
    },
    {
      documentType: "boleta",
      folioNumber: "002-67890",
      issueDate: "2024-12-02",
      description: "Consulta jurídica",
      subtotal: 50000,
      taxAmount: 0,
      total: 50000,
      status: "paid",
      createdBy: 1,
    },
    {
      documentType: "voucher",
      folioNumber: "V-001",
      issueDate: "2024-12-03",
      description: "Gastos de oficina - papelería",
      subtotal: 25000,
      taxAmount: 4750,
      total: 29750,
      status: "posted",
      createdBy: 1,
    },
  ];

  for (const voucher of vouchersToCreate) {
    try {
      // Generate voucher number
      const year = new Date().getFullYear();
      const voucherNumber = `V${year}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      const [createdVoucher] = await db
        .insert(vouchers)
        .values({ ...voucher, voucherNumber })
        .returning();

      // Create voucher lines for the first voucher (honorarios)
      if (voucher.folioNumber === "001-12345") {
        await db.insert(voucherLines).values([
          {
            voucherId: createdVoucher.id,
            accountId: createdAccounts.find(a => a.code === "4.1.1")?.id || 1,
            description: "Honorarios profesionales",
            quantity: "1",
            unitPrice: 100000,
            totalAmount: 100000,
            isTaxable: true,
            debitAmount: 0,
            creditAmount: 100000,
            lineOrder: 1,
          },
          {
            voucherId: createdVoucher.id,
            accountId: createdAccounts.find(a => a.code === "2.2.1")?.id || 2,
            description: "IVA 19%",
            quantity: "1",
            unitPrice: 19000,
            totalAmount: 19000,
            isTaxable: false,
            debitAmount: 0,
            creditAmount: 19000,
            lineOrder: 2,
          },
          {
            voucherId: createdVoucher.id,
            accountId: createdAccounts.find(a => a.code === "1.2.1")?.id || 3,
            description: "Cuenta por cobrar",
            quantity: "1",
            unitPrice: 119000,
            totalAmount: 119000,
            isTaxable: false,
            debitAmount: 119000,
            creditAmount: 0,
            lineOrder: 3,
          },
        ]);
      }
    } catch (error) {
      console.log("Error creating voucher:", error);
    }
  }

  console.log("Accounting data seeded successfully!");
}

// Run the seed function if this file is executed directly
seedAccounting()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });

export { seedAccounting };