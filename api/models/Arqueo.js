import mongoose from 'mongoose';

const arqueoSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    fecha: { type: Date, default: Date.now },
    usuarioId: String,
    efectivoFisico: Number,
    efectivoRegistrado: Number,
    diferencia: Number,
    totalesPorMetodo: mongoose.Schema.Types.Mixed,
    totalGeneral: Number,
    notas: String
});

export default mongoose.model('Arqueo', arqueoSchema);
