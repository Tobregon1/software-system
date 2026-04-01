import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    usuario: { type: String, unique: true, required: true },
    clave: { type: String, required: true },
    rol: { type: String, default: 'cajero' },
    nombre: { type: String, required: true }
});

export default mongoose.model('Usuario', usuarioSchema);
