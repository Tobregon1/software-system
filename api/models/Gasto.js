import mongoose from 'mongoose';

const gastoSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    fecha: { type: Date, default: Date.now },
    monto: { type: Number, required: true, min: 0 },
    descripcion: { type: String, required: true }
});

export default mongoose.model('Gasto', gastoSchema);
