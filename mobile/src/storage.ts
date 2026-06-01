import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL_KEY = "apiBaseUrl";

function configuredBaseUrl(): string {
  const fromConfig = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  return fromConfig || "http://localhost:3000";
}

/** The API base URL: user override (AsyncStorage) falls back to app config. */
export async function getApiBaseUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(API_BASE_URL_KEY);
    if (stored && stored.trim()) return stored.trim().replace(/\/+$/, "");
  } catch {
    // ignore
  }
  return configuredBaseUrl().replace(/\/+$/, "");
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_BASE_URL_KEY, url.trim());
}

export const defaultApiBaseUrl = () => configuredBaseUrl();
