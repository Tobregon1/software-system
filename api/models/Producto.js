import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0 },
    codigo: { type: String, unique: true, sparse: true },
    codigoInterno: { type: Number, unique: true, sparse: true },
    descuento: { type: Number, default: 0, min: 0, max: 100 },
    iva: { type: Number, default: 21 },
    precioCosto: { type: Number, default: 0 },
    multiplicador: { type: Number, default: 1.5 },
    categoria: { type: String, default: 'General' },
    imagenUrl: String,
    promoRule: mongoose.Schema.Types.Mixed,
    stockMinimo: { type: Number, default: 5 },
    proveedorId: String,
    fechaVencimiento: String
});

// Limpiar nombre de IDs concatenados antes de guardar (ej: "Pepitos #199" -> "Pepitos")
productoSchema.pre('save', function(next) {
    if (this.nombre) {
        this.nombre = this.nombre.replace(/\s+#\d+$/, '').trim();
    }
    next();
});

// También limpiar en la respuesta JSON para corregir datos existentes sobre la marcha
productoSchema.set('toJSON', {
    transform: (doc, ret) => {
        if (ret.nombre) {
            ret.nombre = ret.nombre.replace(/\s+#\d+$/, '').trim();
        }
        return ret;
    }
});

export default mongoose.model('Producto', productoSchema);
