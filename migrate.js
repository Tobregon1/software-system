import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI no definida en .env");
  process.exit(1);
}

// Modelos (Copiados de api/index.js o simplificados para migración)
const Producto = mongoose.model('Producto', new mongoose.Schema({
  nombre: String, precio: Number, stock: Number, codigo: String, descuento: Number, iva: Number, precioCosto: Number, multiplicador: Number, categoria: String, imagenUrl: String, promoRule: mongoose.Schema.Types.Mixed, stockMinimo: Number, proveedorId: String, fechaVencimiento: String
}));
const Venta = mongoose.model('Venta', new mongoose.Schema({ fecha: Date, items: Array, total: Number, metodoPago: String, clienteId: String, cerrada: Boolean }));
const Config = mongoose.model('Config', new mongoose.Schema({ nombreNegocio: String, direccion: String, telefono: String, mensajePie: String, logoUrl: String, qrAlias: String, puntosXpeso: Number, valorPunto: Number }));
const Gasto = mongoose.model('Gasto', new mongoose.Schema({ fecha: Date, monto: Number, descripcion: String }));
const Cliente = mongoose.model('Cliente', new mongoose.Schema({ nombre: String, telefono: String, saldo: Number, puntos: Number }));
const Proveedor = mongoose.model('Proveedor', new mongoose.Schema({ nombre: String, contacto: String, notas: String }));
const Usuario = mongoose.model('Usuario', new mongoose.Schema({ usuario: String, clave: String, rol: String, nombre: String }));
const Arqueo = mongoose.model('Arqueo', new mongoose.Schema({ fecha: Date, usuarioId: String, efectivoFisico: Number, efectivoRegistrado: Number, diferencia: Number, totalesPorMetodo: mongoose.Schema.Types.Mixed, totalGeneral: Number, notas: String }));

const BACKEND_PATH = path.join(__dirname, '..', 'backend-kiosco');

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log("Conectado a MongoDB para migración...");

  const files = {
    'productos.json': Producto,
    'ventas.json': Venta,
    'config.json': Config,
    'gastos.json': Gasto,
    'clientes.json': Cliente,
    'proveedores.json': Proveedor,
    'usuarios.json': Usuario,
    'arqueos.json': Arqueo
  };

  for (const [filename, Model] of Object.entries(files)) {
    const filepath = path.join(BACKEND_PATH, filename);
    if (fs.existsSync(filepath)) {
      console.log(`Migrando ${filename}...`);
      let data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      // Manejar caso de objeto único (config.json)
      if (!Array.isArray(data)) data = [data];

      // Eliminar IDs numéricos viejos para que MongoDB genere nuevos _id
      const cleanedData = data.map(item => {
        const { id, ...rest } = item;
        return rest;
      });

      if (cleanedData.length > 0) {
        await Model.insertMany(cleanedData);
        console.log(`✓ ${filename} migrado (${cleanedData.length} registros)`);
      }
    }
  }

  console.log("\nMigración completada con éxito.");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Error durante la migración:", err);
  process.exit(1);
});
