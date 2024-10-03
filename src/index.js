// translate.js
// Translate text into different languages;

// Cache the different translations to avoid resending requests
import inMemoryCache from "./cache.js";
import engines from "./engines/index.js";
// Load a language parser to allow for more flexibility in the language choice
import languages from "./languages/index.js";
import axios from "axios";

class Translate {
    options = {
        from: "en",
        to: "en",
        cache: undefined,
        engine: "google",
        key: undefined,
        url: "translate",
        languages: languages,
        engines: engines,
        keys: {},
        isExInCache: true,
    }
    cache
    cacheParams

    constructor(cache = inMemoryCache, options = {}) {
        this.cache = cache
        this.options = {
            ...this.options,
            ...options,
        }
        this.cacheParams = this.options.isExInCache ? ["EX", 60 * 60 * 24 * 7] : [60 * 60 * 24 * 7]
    }

    async translate(text, opts = {}) {
        // Load all of the appropriate options (verbose but fast)
        // Note: not all of those *should* be documented since some are internal only
        if (typeof opts === "string") opts = {to: opts};
        const invalidKey = Object.keys(opts).find(
            (k) => k !== "from" && k !== "to"
        );
        if (invalidKey) {
            throw new Error(`Invalid option with the name '${invalidKey}'`);
        }
        opts.from = languages(opts.from || this.options.from);
        opts.to = languages(opts.to || this.options.to);
        opts.cache = this.options.cache;
        opts.engine = this.options.engine;
        opts.url = this.options.url;
        opts.id = `${opts.url}:${opts.from}:${opts.to}:${opts.engine}:${opts.text}`;
        opts.keys = this.options.keys || {};
        for (let name in this.options.keys) {
            // The options has stronger preference than the global value
            opts.keys[name] = opts.keys[name] || this.options.keys[name];
        }
        opts.key = opts.key || this.options.key || opts.keys[opts.engine];

        // Use the desired engine
        const engine = this.options.engines[opts.engine];

        const base = text.split(",").map(t => t.trim()).map(t => t.toLowerCase());
        const translateObject = base.reduce((acc, cur) => ({...acc, [cur]: cur}), {});

        for (const key of base) {
            const id = this.getId(opts, key);
            const cached = await this.cache.get(id);
            if (cached) translateObject[key] = cached;
        }

        const toTranslate = base.filter(k => k === translateObject[k]);

        opts.text = toTranslate.join(", ");

        if (!toTranslate.length) return Object.values(translateObject).join(", ");

        // Target is the same as origin, just return the string
        if (opts.to === opts.from) {
            return Promise.resolve(opts.text);
        }

        if (engine.needkey && !opts.key) {
            throw new Error(
                `The engine "${opts.engine}" needs a key, please provide it`
            );
        }

        const fetchOpts = engine.fetch(opts);
        return await axios(...fetchOpts)
            .then(engine.parse)
            .then(async (translated) => {
                const transArr = translated.split(",").map(t => t.trim()).map(t => t.toLowerCase());
                for (const key of toTranslate) {
                    const i = toTranslate.indexOf(key);
                    await this.cache.set(this.getId(opts, key), transArr[i], ...this.cacheParams);
                    translateObject[key] = transArr[i];
                }

                return Object.values(translateObject).join(", ");
            })
            .then(value => value);
    }

    getId(opts, text) {
        return `${opts.url}:${opts.from}:${opts.to}:${opts.engine}:${text}`
    }
}

export default Translate;