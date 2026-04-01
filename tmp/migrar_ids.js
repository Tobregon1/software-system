import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const productoSchema = new mongoose.Schema({
    codigoInterno: Number
}, { strict: false });

const Producto = mongoose.model('Producto', productoSchema);

async function migrar() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Conectado para migración");

        const productos = await Producto.find({ codigoInterno: { $exists: false } }).sort({ _id: 1 });
        console.log(`Encontrados ${productos.length} productos sin ID interno`);

        let nextId = 1;
        const lastProd = await Producto.findOne({ codigoInterno: { $exists: true } }).sort({ codigoInterno: -1 });
        if (lastProd) nextId = lastProd.codigoInterno + 1;

        for (const p of productos) {
            p.codigoInterno = nextId++;
            await p.save();
            console.log(`Producto ${p.nombre || p._id} -> ID ${p.codigoInterno}`);
        }

        console.log("Migración completada");
    } catch (err) {
        console.error("Error en migración:", err);
    } finally {
        await mongoose.disconnect();
    }
}

migrar();
