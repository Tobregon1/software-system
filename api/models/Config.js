import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
    nombreNegocio: { type: String, default: "Kiosco System" },
    direccion: String,
    telefono: String,
    mensajePie: String,
    logoUrl: String,
    qrAlias: String,
    puntosXpeso: { type: Number, default: 1000 },
    valorPunto: { type: Number, default: 100 }
});

export default mongoose.model('Config', configSchema);
