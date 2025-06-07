import { db } from "./db";
import { users, roles, clients, companies, contacts, companyContacts, caseTypes, studioRoles, courts } from "../shared/schema";

async function seed() {
  try {
    console.log("Iniciando seed de la base de datos...");

  // Crear datos base para causas judiciales
  // Tipos de causa
  const caseTypesData = [
    { name: "Civil", description: "Causas civiles generales" },
    { name: "Penal", description: "Causas penales" },
    { name: "Laboral", description: "Causas laborales y de trabajo" },
    { name: "Familiar", description: "Causas de derecho de familia" },
    { name: "Comercial", description: "Causas comerciales y mercantiles" },
    { name: "Tributario", description: "Causas tributarias y fiscales" },
  ];

  // Roles del estudio
  const studioRolesData = [
    { name: "Abogado Patrocinante", description: "Representación legal principal" },
    { name: "Abogado Procurador", description: "Representación procesal" },
    { name: "Consultor Legal", description: "Asesoría legal especializada" },
    { name: "Perito", description: "Pericia técnica especializada" },
  ];

  // Tribunales
  const courtsData = [
    { name: "1° Juzgado Civil de Santiago", city: "Santiago", region: "Metropolitana", type: "civil", jurisdiction: "Civil" },
    { name: "2° Juzgado Civil de Santiago", city: "Santiago", region: "Metropolitana", type: "civil", jurisdiction: "Civil" },
    { name: "Juzgado de Garantía de Santiago", city: "Santiago", region: "Metropolitana", type: "penal", jurisdiction: "Penal" },
    { name: "1° Juzgado de Familia de Santiago", city: "Santiago", region: "Metropolitana", type: "familia", jurisdiction: "Familia" },
    { name: "Juzgado del Trabajo de Santiago", city: "Santiago", region: "Metropolitana", type: "laboral", jurisdiction: "Laboral" },
  ];

  // Check if legal case data already exists
  const existingCaseTypes = await db.select().from(caseTypes).limit(1);
  if (existingCaseTypes.length === 0) {
    console.log("Creando tipos de causa...");
    await db.insert(caseTypes).values(caseTypesData);

    console.log("Creando roles del estudio...");
    await db.insert(studioRoles).values(studioRolesData);

    console.log("Creando tribunales...");
    await db.insert(courts).values(courtsData);
  } else {
    console.log("Datos de causas judiciales ya existen, saltando...");
  }

    // Crear rol admin
    const [adminRole] = await db.insert(roles).values({
      name: "Administrador",
      description: "Acceso completo al sistema",
      permissions: {},
      isActive: true
    }).returning();

    // Crear usuario admin
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      email: "admin@miscausas.cl",
      password: "admin123",
      firstName: "Admin",
      lastName: "Usuario",
      isActive: true,
      roleId: adminRole.id
    }).returning();

    // Crear algunas empresas de ejemplo
    const [empresa1] = await db.insert(companies).values({
      name: "Constructora Los Andes SpA",
      type: "spa",
      rut: "76.123.456-7",
      email: "contacto@losandes.cl",
      phone: "+56 2 2345 6789",
      address: "Av. Providencia 1234, Oficina 501",
      city: "Santiago",
      region: "Metropolitana",
      legalRepresentative: "Juan Carlos Pérez",
      isActive: true
    }).returning();

    const [empresa2] = await db.insert(companies).values({
      name: "Inversiones del Sur Ltda.",
      type: "ltda",
      rut: "87.654.321-0",
      email: "info@inversur.cl",
      phone: "+56 41 234 5678",
      address: "Calle O'Higgins 567",
      city: "Temuco",
      region: "La Araucanía",
      legalRepresentative: "María Elena González",
      isActive: true
    }).returning();

    // Crear algunos clientes de ejemplo
    const [cliente1] = await db.insert(clients).values({
      type: "natural",
      firstName: "Pedro",
      lastName: "Martínez",
      rut: "12.345.678-9",
      email: "pedro.martinez@email.com",
      phone: "+56 9 8765 4321",
      address: "Las Condes 890",
      city: "Santiago",
      region: "Metropolitana",
      isActive: true
    }).returning();

    const [cliente2] = await db.insert(clients).values({
      type: "juridica",
      companyName: "Tech Solutions SpA",
      rut: "98.765.432-1",
      email: "contacto@techsolutions.cl",
      phone: "+56 2 3456 7890",
      address: "Av. Apoquindo 4567",
      city: "Las Condes",
      region: "Metropolitana",
      isActive: true
    }).returning();

    // Crear algunos contactos
    const [contacto1] = await db.insert(contacts).values({
      firstName: "Ana",
      lastName: "Silva",
      email: "ana.silva@losandes.cl",
      phone: "+56 9 1234 5678",
      position: "Gerente General",
      isActive: true
    }).returning();

    const [contacto2] = await db.insert(contacts).values({
      firstName: "Roberto",
      lastName: "Fuentes",
      email: "roberto.fuentes@inversur.cl",
      phone: "+56 9 8765 4321",
      position: "Director Financiero",
      isActive: true
    }).returning();

    // Crear relaciones contacto-empresa
    await db.insert(companyContacts).values({
      companyId: empresa1.id,
      contactId: contacto1.id,
      role: "Gerente General",
      isPrimary: true,
      isActive: true
    });

    await db.insert(companyContacts).values({
      companyId: empresa2.id,
      contactId: contacto2.id,
      role: "Director Financiero",
      isPrimary: true,
      isActive: true
    });

    console.log("Seed completado exitosamente!");
    console.log(`- Usuario admin creado con ID: ${adminUser.id}`);
    console.log(`- ${2} empresas creadas`);
    console.log(`- ${2} clientes creados`);
    console.log(`- ${2} contactos creados`);
    console.log(`- ${2} relaciones contacto-empresa creadas`);

  } catch (error) {
    console.error("Error durante el seed:", error);
  }
}

export { seed };

// Solo ejecutar si es llamado directamente
seed().then(() => process.exit(0)).catch(console.error);