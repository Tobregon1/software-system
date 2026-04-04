import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Pillar",
        icon: path.join(__dirname, 'build', 'logo1.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
    });

    // Inyectar bandera POS para el frontend
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript('window.isPosOnly = true;');
    });

    // Start Express API Server
    const apiPath = path.join(__dirname, 'api', 'index.js');
    serverProcess = fork(apiPath, [], {
        env: { ...process.env, PORT: 8000 }
    });

    // We wait briefly for the server to start, then load it
    // Using a timeout is simplest, or we can poll until 8000 is open.
    // Since it's local, 1.5s is usually enough.
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:8000');
    }, 1500);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) serverProcess.kill();
});
