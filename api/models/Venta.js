import mongoose from 'mongoose';

const ventaSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    fecha: { type: Date, default: Date.now },
    items: { type: Array, required: true },
    total: { type: Number, required: true, min: 0 },
    metodoPago: { type: String, default: 'Efectivo' },
    clienteId: String,
    cerrada: { type: Boolean, default: true }
});

export default mongoose.model('Venta', ventaSchema);
