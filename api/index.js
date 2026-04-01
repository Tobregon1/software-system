import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

import Producto from './models/Producto.js';
import Venta from './models/Venta.js';
import Config from './models/Config.js';
import Gasto from './models/Gasto.js';
import Cliente from './models/Cliente.js';
import Proveedor from './models/Proveedor.js';
import Usuario from './models/Usuario.js';
import Arqueo from './models/Arqueo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intentar cargar .env desde la raíz si no se cargó (útil para Electron/local)
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

const app = express();
app.use(cors());
app.use(express.json());

// Configurar almacenamiento para uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Servir archivos estáticos
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

const MONGODB_URI = process.env.MONGODB_URI;


const conectarDB = async () => {
    if (mongoose.connection.readyState === 1) return;
    
    if (mongoose.connection.readyState === 2) {
        // Si ya se está conectando, esperamos a que termine
        console.log("Conexión en progreso, esperando...");
        await new Promise((resolve) => {
            mongoose.connection.once('connected', resolve);
            mongoose.connection.once('error', resolve); // resolvemos de todos modos para que el try/catch de abajo falle
        });
        if (mongoose.connection.readyState === 1) return;
    }

    if (!MONGODB_URI) {
        const errorMsg = "ERROR: MONGODB_URI no definida. En Vercel agrégala en Environment Variables. En local, asegúrate de tener un archivo .env";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    try {
        console.log("Conectando a MongoDB...");
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 segundos de timeout
        });
        console.log("Conectado a MongoDB");
    } catch (err) {
        console.error("Error conectando a MongoDB:", err.message);
        if (err.message.includes('auth failed')) {
            console.error("ERROR DE AUTENTICACIÓN: El usuario o contraseña en MONGODB_URI son incorrectos.");
        }
        throw err;
    }
};

// Middleware para asegurar conexión en cada petición
app.use(async (req, res, next) => {
    try {
        await conectarDB();
        next();
    } catch (err) {
        res.status(500).json({ error: "Error de conexión a la base de datos: " + err.message });
    }
});

// Middleware simple de seguridad para rutas sensibles (POST/PUT/DELETE)
// Verifica que se envíe un rol válido desde el frontend
const checkAuth = (rolesPermitidos = ['admin', 'cajero']) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role'];
        if (!userRole || !rolesPermitidos.includes(userRole)) {
            return res.status(403).json({ error: "No tienes permisos para realizar esta acción." });
        }
        next();
    };
};

// Global schema options to map _id to id
mongoose.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
    }
});

// Helper para IDs migrados (soporta ObjectId nuevos o Numéricos viejos)
const getQueryId = (id) => mongoose.isValidObjectId(id) ? { _id: new mongoose.Types.ObjectId(id) } : { _id: Number(id) };

// --- API ROUTES ---

// PRODUCTOS
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Producto.find().sort({ codigoInterno: 1 });
        res.json(productos);
    } catch (err) {
        fs.appendFileSync('error-log.txt', `${new Date().toISOString()} - ERROR /api/productos: ${err.stack}\n`);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

app.get('/api/productos/next-id', async (req, res) => {
    try {
        const lastProd = await Producto.findOne().sort({ codigoInterno: -1 });
        const nextId = lastProd && lastProd.codigoInterno ? lastProd.codigoInterno + 1 : 1;
        res.json({ nextId });
    } catch (err) {
        res.status(500).json({ error: "Error calculando próximo ID" });
    }
});

app.post('/api/productos', checkAuth(['admin']), async (req, res) => {
    try {
        const { nombre, precio, stock, codigoInterno } = req.body;
        if (!nombre || precio === undefined) {
            return res.status(400).json({ error: "Nombre y precio son requeridos" });
        }
        if (precio < 0) return res.status(400).json({ error: "El precio no puede ser negativo" });

        const body = { ...req.body };
        if (!body.codigoInterno) {
            const lastProd = await Producto.findOne().sort({ codigoInterno: -1 });
            body.codigoInterno = lastProd && lastProd.codigoInterno ? lastProd.codigoInterno + 1 : 1;
        }

        const nuevo = new Producto(body);
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/productos/:id', checkAuth(['admin']), async (req, res) => {
    try {
        const { precio, nombre } = req.body;
        if (precio !== undefined && precio < 0) return res.status(400).json({ error: "El precio no puede ser negativo" });
        if (nombre !== undefined && !nombre.trim()) return res.status(400).json({ error: "El nombre no puede estar vacío" });

        const actualizado = await Producto.findOneAndUpdate(getQueryId(req.params.id), req.body, { new: true });
        if (!actualizado) return res.status(404).json({ error: "Producto no encontrado" });
        res.json(actualizado);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/productos/:id', checkAuth(['admin']), async (req, res) => {
    try {
        const eliminado = await Producto.findOneAndDelete(getQueryId(req.params.id));
        if (!eliminado) return res.status(404).json({ error: "Producto no encontrado" });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// VENTAS
app.get('/api/ventas', async (req, res) => {
    try {
        const { criterio } = req.query;
        let query = {};

        if (criterio) {
            const ahora = new Date();
            ahora.setHours(0, 0, 0, 0);

            if (criterio === 'Hoy') {
                query.fecha = { $gte: ahora };
            } else if (criterio === 'Ayer') {
                const ayer = new Date(ahora);
                ayer.setDate(ayer.getDate() - 1);
                query.fecha = { $gte: ayer, $lt: ahora };
            } else if (criterio === 'Semana') {
                const semana = new Date(ahora);
                semana.setDate(semana.getDate() - 7);
                query.fecha = { $gte: semana };
            } else if (criterio === 'Mes') {
                const mes = new Date(ahora);
                mes.setDate(1); // Inicio de mes
                query.fecha = { $gte: mes };
            }
        }

        const ventasRaw = await Venta.find(query).sort({ fecha: -1 });
        
        // Mapear _id a id para consistencia
        const ventas = ventasRaw.map(v => {
            const obj = v.toObject();
            obj.id = obj._id;
            return obj;
        });

        res.json(ventas);
    } catch (err) {
        console.error("Error obteniendo ventas:", err);
        res.status(500).json({ error: "Error al obtener ventas" });
    }
});

app.post('/api/ventas', checkAuth(['admin', 'cajero']), async (req, res) => {
    try {
        const { items, total, metodoPago, clienteId } = req.body;
        if (!items || !items.length) return res.status(400).json({ error: "El carrito no puede estar vacío" });
        if (total === undefined || total < 0) return res.status(400).json({ error: "Total inválido" });

        const nuevaVenta = new Venta({ items, total, metodoPago, clienteId, cerrada: false });

        // Actualizar saldo y puntos de cliente
        if (clienteId) {
            const cliente = await Cliente.findOne(getQueryId(clienteId));
            if (cliente) {
                if (metodoPago === 'Fiado') {
                    cliente.saldo += total;
                }
                const config = await Config.findOne() || { puntosXpeso: 1000 };
                cliente.puntos += Math.floor(total / config.puntosXpeso);
                await cliente.save();
            }
        }

        // Restar stock
        for (const item of items) {
            await Producto.findOneAndUpdate(
                { $or: [{ _id: item._id }, { codigo: item.codigo }] },
                { $inc: { stock: -item.cantidad } }
            );
        }

        await nuevaVenta.save();
        res.status(201).json(nuevaVenta);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/ventas/:id', checkAuth(['admin']), async (req, res) => {
    try {
        const venta = await Venta.findOne(getQueryId(req.params.id));
        if (!venta) return res.status(404).json({ error: "Venta no encontrada" });

        // Devolver stock
        for (const item of (venta.items || [])) {
            await Producto.findOneAndUpdate(
                { $or: [{ _id: item._id }, { codigo: item.codigo }] },
                { $inc: { stock: item.cantidad } }
            );
        }

        // Revertir deuda y puntos del cliente
        if (venta.clienteId) {
            const cliente = await Cliente.findOne(getQueryId(venta.clienteId));
            if (cliente) {
                if (venta.metodoPago === 'Fiado') {
                    cliente.saldo = Math.max(0, cliente.saldo - venta.total);
                }
                const config = await Config.findOne() || { puntosXpeso: 1000 };
                const puntosRestar = Math.floor(venta.total / config.puntosXpeso);
                cliente.puntos = Math.max(0, cliente.puntos - puntosRestar);
                await cliente.save();
            }
        }

        await Venta.findOneAndDelete(getQueryId(req.params.id));
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/reporte/cierre', async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const ventasHoy = await Venta.find({
            fecha: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        const cantidadVentas = ventasHoy.length;
        const totalRecaudado = ventasHoy.reduce((acc, v) => acc + (v.total || 0), 0);

        const productosMasVendidos = {};
        ventasHoy.forEach(v => {
            (v.items || []).forEach(item => {
                const nombre = item.nombre || 'Desconocido';
                if (!productosMasVendidos[nombre]) productosMasVendidos[nombre] = 0;
                productosMasVendidos[nombre] += Number(item.cantidad) || 1;
            });
        });

        res.json({
            cantidadVentas,
            totalRecaudado,
            productosMasVendidos
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const ventas = await Venta.find().lean();
        const gastos = await Gasto.find().lean();
        const clientes = await Cliente.find().lean();
        const productos = await Producto.find().lean();

        const totalVentas = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
        const totalGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);
        const totalDeudaClientes = clientes.reduce((acc, c) => acc + (c.saldo || 0), 0);

        const porMetodo = ventas.reduce((acc, v) => {
            const met = v.metodoPago || 'Efectivo';
            acc[met] = (acc[met] || 0) + v.total;
            return acc;
        }, {});

        const valorInventario = productos.reduce((acc, p) => acc + (Number(p.precioCosto || 0) * Number(p.stock || 0)), 0);

        const productSales = {};
        const porCategoria = {};
        const prodMap = new Map();
        productos.forEach(p => prodMap.set(p.nombre, p));

        ventas.forEach(v => {
            (v.items || []).forEach(item => {
                // Top vendidos
                if (!productSales[item.nombre]) productSales[item.nombre] = 0;
                productSales[item.nombre] += Number(item.cantidad) || 0;

                // Categoria y rentabilidad
                const p = prodMap.get(item.nombre);
                const categoria = (p && p.categoria) ? p.categoria : 'Sin Categoría';
                const costo = p ? (Number(p.precioCosto) || 0) : 0;
                const precioVenta = Number(item.precio) || 0;
                const gananciaUnitaria = precioVenta - costo;
                const cantidad = Number(item.cantidad) || 0;
                const ventaItem = precioVenta * cantidad;
                const gananciaItem = gananciaUnitaria * cantidad;

                if (!porCategoria[categoria]) {
                    porCategoria[categoria] = { ventas: 0, ganancia: 0 };
                }
                porCategoria[categoria].ventas += ventaItem;
                porCategoria[categoria].ganancia += gananciaItem;
            });
        });

        const topVendidos = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }));

        let gananciaBrutaVentas = 0;
        Object.values(porCategoria).forEach(cat => {
            gananciaBrutaVentas += cat.ganancia;
        });
        const gananciaNeta = gananciaBrutaVentas - totalGastos;

        let vencidos = 0;
        let proximos = 0;
        const ahora = new Date();
        const en7Dias = new Date();
        en7Dias.setDate(ahora.getDate() + 7);

        productos.forEach(p => {
            if (p.fechaVencimiento) {
                const fechaVen = new Date(p.fechaVencimiento);
                if (fechaVen < ahora) vencidos++;
                else if (fechaVen <= en7Dias) proximos++;
            }
        });

        res.json({
            totalVentas,
            totalGastos,
            totalDeudaClientes,
            porMetodo,
            valorInventario,
            productosBajoStock: productos.filter(p => p.stock <= (p.stockMinimo || 0)).length,
            gananciaNeta,
            porCategoria,
            topVendidos,
            alertasVencimiento: { vencidos, proximos }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/session-total', async (req, res) => {
    try {
        const ventasAbiertas = await Venta.find({ cerrada: false }).lean();
        const total = ventasAbiertas.reduce((acc, v) => acc + (v.total || 0), 0);
        res.json({ total, cantidad: ventasAbiertas.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cierre-caja', async (req, res) => {
    try {
        const ventasAbiertas = await Venta.find({ cerrada: false }).lean();
        const total = ventasAbiertas.reduce((acc, v) => acc + (v.total || 0), 0);
        
        const detalles = [];
        for (const v of ventasAbiertas) {
            for (const item of (v.items || [])) {
                detalles.push({
                    fecha: v.fecha,
                    producto: item.nombre || "Item",
                    cantidad: item.cantidad,
                    precio_unit: item.precio || 0,
                    subtotal: item.cantidad * (item.precio || 0)
                });
            }
        }
        await Venta.updateMany({ cerrada: false }, { cerrada: true });
        res.json({ total, detalles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CONFIG
app.get('/api/config', async (req, res) => {
    try {
        let config = await Config.findOne();
        if (!config) {
            config = new Config();
            await config.save();
        }
        
        // Normalizar URL de logo para evitar Mixed Content y apuntar a la ruta relativa
        if (config.logoUrl && config.logoUrl.includes('localhost')) {
            try {
                const url = new URL(config.logoUrl);
                config.logoUrl = url.pathname; // ej: /uploads/logo...
                if (!config.logoUrl.startsWith('/api')) {
                    config.logoUrl = '/api' + config.logoUrl;
                }
            } catch (e) {
                // Si no es una URL válida, intentar limpiar manualmente
                config.logoUrl = config.logoUrl.replace(/http:\/\/localhost:\d+/, '');
                if (config.logoUrl.startsWith('/uploads')) {
                    config.logoUrl = '/api' + config.logoUrl;
                }
            }
        }
        
        res.json(config);
    } catch (err) {
        fs.appendFileSync('error-log.txt', `${new Date().toISOString()} - ERROR /api/config: ${err.stack}\n`);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/config', checkAuth(['admin']), async (req, res) => {
    try {
        const config = await Config.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(config);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RUTAS DE LOGO
app.post('/api/config/logo', checkAuth(['admin']), upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Sube una imagen válida" });

        const logoUrl = `/api/uploads/${req.file.filename}`;
        
        // Actualizar config
        await Config.findOneAndUpdate({}, { logoUrl }, { upsert: true });
        
        // Eliminar logo viejo si existe
        if (req.body.oldLogoUrl) {
            const oldPath = path.join(__dirname, '..', req.body.oldLogoUrl.replace('/api/', ''));
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        res.json({ logoUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/config/logo', checkAuth(['admin']), async (req, res) => {
    try {
        const config = await Config.findOne();
        if (config && config.logoUrl) {
            const logoPath = path.join(__dirname, '..', config.logoUrl.replace('/api/', ''));
            if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
            config.logoUrl = "";
            await config.save();
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN & USUARIOS
app.post('/api/login', async (req, res) => {
    try {
        const { usuario, clave } = req.body;
        const user = await Usuario.findOne({ usuario, clave });
        if (user) {
            res.json({ id: user._id, usuario: user.usuario, rol: user.rol, nombre: user.nombre });
        } else {
            res.status(401).json({ error: "Credenciales inválidas" });
        }
    } catch (err) {
        fs.appendFileSync('error-log.txt', `${new Date().toISOString()} - ERROR /api/login: ${err.stack}\n`);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/usuarios', checkAuth(['admin']), async (req, res) => {
    try {
        const usuarios = await Usuario.find({}, 'usuario rol nombre');
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/usuarios', checkAuth(['admin']), async (req, res) => {
    try {
        const { usuario, clave, nombre } = req.body;
        if (!usuario || !clave || !nombre) return res.status(400).json({ error: "Faltan campos obligatorios" });

        const nuevo = new Usuario(req.body);
        await nuevo.save();
        res.status(201).json({ id: nuevo._id, usuario: nuevo.usuario, rol: nuevo.rol, nombre: nuevo.nombre });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/usuarios/:id', checkAuth(['admin']), async (req, res) => {
    try {
        await Usuario.findOneAndDelete(getQueryId(req.params.id));
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CLIENTES, PROVEEDORES, GASTOS, ARQUEO...
// (Implementar similares a los de arriba)

app.get('/api/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.find();
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clientes', checkAuth(['admin', 'cajero']), async (req, res) => {
    try {
        if (!req.body.nombre) return res.status(400).json({ error: "Nombre es requerido" });
        const nuevo = new Cliente(req.body);
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/clientes/:id', checkAuth(['admin']), async (req, res) => {
    try {
        await Cliente.findOneAndDelete(getQueryId(req.params.id));
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/clientes/:id/canjear-puntos', async (req, res) => {
    try {
        const { puntos } = req.body;
        const cliente = await Cliente.findOne(getQueryId(req.params.id));
        const config = await Config.findOne();
        if (!cliente) return res.status(404).send("Cliente no encontrado");
        if (cliente.puntos < puntos) return res.status(400).send("Puntos insuficientes");
        
        const descuento = puntos * (config?.valorPunto || 100);
        cliente.puntos -= puntos;
        await cliente.save();
        res.json({ descuento, puntosRestantes: cliente.puntos });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/clientes/:id/pago', async (req, res) => {
    try {
        const { monto } = req.body;
        const cliente = await Cliente.findOne(getQueryId(req.params.id));
        if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

        cliente.saldo = Math.max(0, cliente.saldo - Number(monto));
        await cliente.save();
        res.json(cliente);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GASTOS
app.get('/api/gastos', async (req, res) => {
    try {
        const gastos = await Gasto.find();
        res.json(gastos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/gastos/hoy', async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        
        const gastos = await Gasto.find({
            fecha: { $gte: start, $lte: end }
        });
        res.json(gastos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/gastos', checkAuth(['admin', 'cajero']), async (req, res) => {
    try {
        const { monto, descripcion } = req.body;
        if (!monto || !descripcion) return res.status(400).json({ error: "Monto y descripción son requeridos" });
        const nuevo = new Gasto(req.body);
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/gastos/:id', checkAuth(['admin']), async (req, res) => {
    try {
        await Gasto.findOneAndDelete(getQueryId(req.params.id));
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PROVEEDORES
app.get('/api/proveedores', async (req, res) => {
    try {
        const proveedores = await Proveedor.find();
        res.json(proveedores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/proveedores', checkAuth(['admin', 'cajero']), async (req, res) => {
    try {
        if (!req.body.nombre) return res.status(400).json({ error: "Nombre es requerido" });
        const nuevo = new Proveedor(req.body);
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/proveedores/:id', checkAuth(['admin']), async (req, res) => {
    try {
        await Proveedor.findOneAndDelete(getQueryId(req.params.id));
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ARQUEO
app.get('/api/arqueo/actual', async (req, res) => {
    try {
        const ventasAbiertas = await Venta.find({ cerrada: false }).lean();
        const porMetodo = ventasAbiertas.reduce((acc, v) => {
            const met = v.metodoPago || 'Efectivo';
            acc[met] = (acc[met] || 0) + v.total;
            return acc;
        }, {});
        const totalRegistrado = ventasAbiertas.reduce((acc, v) => acc + v.total, 0);
        res.json({ ventasCount: ventasAbiertas.length, porMetodo, totalRegistrado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/arqueo/cerrar', checkAuth(['admin', 'cajero']), async (req, res) => {
    try {
        const { efectivoFisico, notas, usuarioId } = req.body;
        const ventasAbiertas = await Venta.find({ cerrada: false });

        if (ventasAbiertas.length === 0 && !efectivoFisico) {
            return res.status(400).json({ error: "No hay actividad para cerrar." });
        }
        // ... rest of the logic

        const porMetodo = ventasAbiertas.reduce((acc, v) => {
            const met = v.metodoPago || 'Efectivo';
            acc[met] = (acc[met] || 0) + v.total;
            return acc;
        }, {});

        const totalRegistrado = ventasAbiertas.reduce((acc, v) => acc + v.total, 0);
        const efectivoRegistrado = porMetodo['Efectivo'] || 0;
        const diferencia = Number(efectivoFisico) - efectivoRegistrado;

        const nuevoArqueo = new Arqueo({
            usuarioId,
            efectivoFisico: Number(efectivoFisico),
            efectivoRegistrado,
            diferencia,
            totalesPorMetodo: porMetodo,
            totalGeneral: totalRegistrado,
            notas: notas || ""
        });

        await Venta.updateMany({ cerrada: false }, { cerrada: true });
        await nuevoArqueo.save();

        res.status(201).json(nuevoArqueo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/arqueo/historial', async (req, res) => {
    try {
        const { desde, hasta, usuarioId } = req.query;
        let query = {};

        // Filtro de fecha
        if (desde || hasta) {
            query.fecha = {};
            if (desde) query.fecha.$gte = new Date(desde);
            if (hasta) {
                const h = new Date(hasta);
                h.setHours(23, 59, 59, 999);
                query.fecha.$lte = h;
            }
        }

        // Filtro de usuario
        if (usuarioId) {
            query.usuarioId = usuarioId;
        }

        const arqueos = await Arqueo.find(query).sort({ fecha: -1 }).lean();
        
        // Obtener nombres de usuarios para poblar la tabla
        const usuarios = await Usuario.find({}, 'usuario nombre').lean();
        const userMap = {};
        usuarios.forEach(u => {
            userMap[u._id.toString()] = u.nombre || u.usuario;
        });

        const result = arqueos.map(arq => ({
            ...arq,
            id: arq._id,
            nombreUsuario: userMap[arq.usuarioId] || 'Usuario Desconocido'
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Servir frontend en producción (dist)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
});

// Exportar para Vercel
export default app;

// Iniciar servidor si no es Vercel
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
}
