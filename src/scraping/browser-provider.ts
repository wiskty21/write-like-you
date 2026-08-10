export interface ScrapingLocator {
  count(): Promise<number>;
  first(): ScrapingLocator;
  nth(index: number): ScrapingLocator;
  locator(selector: string): ScrapingLocator;
  innerText(): Promise<string>;
  getAttribute(name: string): Promise<string | null>;
}

export interface ScrapingPage {
  goto(
    url: string,
    options: { waitUntil: "domcontentloaded"; timeout: number },
  ): Promise<{ ok(): boolean; status(): number } | null>;
  locator(selector: string): ScrapingLocator;
  waitForTimeout(timeout: number): Promise<void>;
}

export interface BrowserSession {
  newPage(options: { locale: string }): Promise<ScrapingPage>;
  close(): Promise<void>;
}

export interface BrowserProvider {
  open(): Promise<BrowserSession>;
}
