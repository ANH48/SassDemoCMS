import { PrismaClient } from "./generated/global-client";

export { PrismaClient as GlobalPrismaClient };

let globalClient: PrismaClient | null = null;

export function getGlobalClient(): PrismaClient {
  if (!globalClient) {
    globalClient = new PrismaClient();
  }
  return globalClient;
}
