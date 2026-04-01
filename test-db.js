import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function test() {
    console.log("Connecting to:", MONGODB_URI);
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully");
        
        const Config = mongoose.model('Config', new mongoose.Schema({
            nombreNegocio: String
        }));
        
        const config = await Config.findOne();
        console.log("Config found:", config);
        
        process.exit(0);
    } catch (err) {
        console.error("Connection error:", err);
        process.exit(1);
    }
}

test();
