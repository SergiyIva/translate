type Engine = {
  needkey: boolean;
  fetch: (options: {
    key: string;
    from: string;
    to: string;
    text: string;
  }) => [string, { [key: string]: any }];
  parse: (res: { [key: string]: any }) => string;
};

type Options = string | TranslateOptions;
type TranslateOptions = {
  from?: string;
  to?: string;

  key?: string;
  engine?: "google" | "deepl" | "libre" | "yandex";

  // More advanced types when tweaking the library
  keys?: { [name: string]: string };
  cache?: number;
  engines?: { [name: string]: Engine };

  isExInCache: boolean,
}

declare class Translate {
  private readonly cache;
  private readonly cacheParams;
  private readonly options;

  constructor(cache?: any, options?: TranslateOptions)

  public translate(text: string, opts?: Options): Promise<string>;

  private getId(opts: TranslateOptions, text: string): string
}

export default Translate;
