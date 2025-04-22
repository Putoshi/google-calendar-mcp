import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;
let serverProcess;
let serverPort = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // 開発時はDevToolsを開く
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // アプリのパスを表示
  const appPath = app.isPackaged
    ? path.dirname(app.getPath("exe"))
    : process.cwd();

  mainWindow.webContents.send("app-path", appPath);
}

function startServer() {
  // 環境変数でポートを設定
  process.env.PORT = serverPort.toString();

  serverProcess = spawn("node", ["build/index.js"], {
    stdio: "pipe",
    env: { ...process.env, PORT: serverPort.toString() },
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(`Server: ${data}`);
    mainWindow.webContents.send("server-log", data.toString());
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`Server Error: ${data}`);
    mainWindow.webContents.send("server-error", data.toString());
  });

  serverProcess.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
    mainWindow.webContents.send("server-closed", code);
  });

  // サーバーの起動を待機
  setTimeout(() => {
    mainWindow.webContents.send("server-started", serverPort);
  }, 2000);
}

app.whenReady().then(() => {
  createWindow();
  startServer();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
