import { Client } from "../types/client";

const STORAGE_KEY_CLIENTS = "sticker-crm-clients";

export const loadClients = (): Client[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CLIENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading clients:", error);
    return [];
  }
};

export const saveClients = (clients: Client[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
  } catch (error) {
    console.error("Error saving clients:", error);
  }
};
