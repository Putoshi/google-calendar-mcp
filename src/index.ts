import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";
import http from "http";

// Import modular components
import { initializeOAuth2Client } from "./auth/client.js";
import { AuthServer } from "./auth/server.js";
import { TokenManager } from "./auth/tokenManager.js";
import { getToolDefinitions } from "./handlers/listTools.js";
import { handleCallTool } from "./handlers/callTool.js";

// --- Global Variables ---
// Create server instance (global for export)
const server = new Server(
  {
    name: "google-calendar",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set port from environment variable
const PORT = parseInt(process.env.PORT || "8080", 10);

let oauth2Client: OAuth2Client;
let tokenManager: TokenManager;
let authServer: AuthServer;
let httpServer: http.Server | null = null;

// --- Main Application Logic ---
async function main() {
  try {
    console.log("Starting application...");

    // 1. Initialize Authentication
    console.log("Initializing OAuth2 client...");
    oauth2Client = await initializeOAuth2Client();
    tokenManager = new TokenManager(oauth2Client);
    authServer = new AuthServer(oauth2Client);

    // 2. Start auth server if authentication is required
    // Skip authentication in Cloud Run environment
    if (process.env.K_SERVICE) {
      console.log("Running in Cloud Run environment, skipping authentication");
    } else {
      console.log("Starting authentication server...");
      const authSuccess = await authServer.start();
      if (!authSuccess) {
        console.error("Authentication failed");
        process.exit(1);
      }
    }

    // 3. Set up MCP Handlers
    console.log("Setting up MCP handlers...");
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return getToolDefinitions();
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!process.env.K_SERVICE) {
        if (!(await tokenManager.validateTokens())) {
          throw new Error(
            "Authentication required. Please run 'npm run auth' to authenticate."
          );
        }
      }
      return handleCallTool(request, oauth2Client);
    });

    // 4. Connect Server Transport
    console.log("Connecting to MCP transport...");
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // 5. Start HTTP server for Cloud Run
    console.log("Starting HTTP server...");
    httpServer = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Google Calendar MCP is running\n");
    });

    // Start server and wait for it to be ready
    console.log(`Attempting to listen on port ${PORT}...`);
    await new Promise<void>((resolve, reject) => {
      if (!httpServer) {
        reject(new Error("HTTP server not initialized"));
        return;
      }

      httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Server successfully listening on port ${PORT}`);
        resolve();
      });

      httpServer.on("error", (err) => {
        console.error("Server error:", err);
        reject(err);
      });
    });

    console.log("Application startup completed successfully");

    // 6. Set up Graceful Shutdown
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (error: unknown) {
    console.error("Fatal error during startup:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    await cleanup();
    process.exit(1);
  }
}

// --- Cleanup Logic ---
async function cleanup() {
  try {
    console.log("Starting cleanup...");
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer?.close(() => {
          console.log("HTTP server closed");
          resolve();
        });
      });
    }
    if (authServer) {
      await authServer.stop();
      console.log("Auth server stopped");
    }
    console.log("Cleanup completed");
    process.exit(0);
  } catch (error: unknown) {
    console.error("Error during cleanup:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

// --- Exports & Execution Guard ---
// Export server and main for testing or potential programmatic use
export { main, server };

// Run main() only when this script is executed directly
const isDirectRun =
  import.meta.url.startsWith("file://") &&
  process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch(() => {
    process.exit(1);
  });
}
