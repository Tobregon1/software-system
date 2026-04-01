import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    nombre: { type: String, required: true },
    telefono: String,
    saldo: { type: Number, default: 0 },
    puntos: { type: Number, default: 0 }
});

export default mongoose.model('Cliente', clienteSchema);
