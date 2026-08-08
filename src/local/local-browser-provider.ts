import { chromium } from "playwright";
import type {
  BrowserProvider,
  BrowserSession,
} from "../scraping/browser-provider";

export class LocalBrowserProvider implements BrowserProvider {
  async open(): Promise<BrowserSession> {
    return chromium.launch({ channel: "chrome", headless: false });
  }
}
