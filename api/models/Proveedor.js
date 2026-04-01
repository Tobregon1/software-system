import mongoose from 'mongoose';

const proveedorSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    nombre: { type: String, required: true },
    contacto: String,
    notas: String
});

export default mongoose.model('Proveedor', proveedorSchema);
