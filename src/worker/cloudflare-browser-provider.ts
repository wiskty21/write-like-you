import {
  launch,
  type BrowserWorker,
} from "@cloudflare/playwright";
import type {
  BrowserProvider,
  BrowserSession,
} from "../scraping/browser-provider";

export class CloudflareBrowserProvider implements BrowserProvider {
  constructor(private readonly binding: BrowserWorker) {}

  async open(): Promise<BrowserSession> {
    return launch(this.binding);
  }
}
