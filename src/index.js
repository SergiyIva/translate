// translate.js
// Translate text into different languages;

// Cache the different translations to avoid resending requests
import inMemoryCache from "./cache.js";
import engines from "./engines/index.js";
// Load a language parser to allow for more flexibility in the language choice
import languages from "./languages/index.js";
import axios from "axios";

const getId = (opts, text) => `${opts.url}:${opts.from}:${opts.to}:${opts.engine}:${text}`;

// Main function
const Translate = function (cache= inMemoryCache, options = {}) {
  if (!(this instanceof Translate)) {
    return new Translate(options);
  }

  const defaults = {
    from: "en",
    to: "en",
    cache: undefined,
    engine: "google",
    key: "translate",
    url: undefined,
    languages: languages,
    engines: engines,
    keys: {},
  };

  const translate = async (text, opts = {}) => {
    // Load all of the appropriate options (verbose but fast)
    // Note: not all of those *should* be documented since some are internal only
    if (typeof opts === "string") opts = { to: opts };
    const invalidKey = Object.keys(opts).find(
      (k) => k !== "from" && k !== "to"
    );
    if (invalidKey) {
      throw new Error(`Invalid option with the name '${invalidKey}'`);
    }
    opts.from = languages(opts.from || translate.from);
    opts.to = languages(opts.to || translate.to);
    opts.cache = translate.cache;
    opts.engine = translate.engine;
    opts.url = translate.url;
    opts.id = `${opts.url}:${opts.from}:${opts.to}:${opts.engine}:${opts.text}`;
    opts.keys = translate.keys || {};
    for (let name in translate.keys) {
      // The options has stronger preference than the global value
      opts.keys[name] = opts.keys[name] || translate.keys[name];
    }
    opts.key = opts.key || translate.key || opts.keys[opts.engine];

    // Use the desired engine
    const engine = translate.engines[opts.engine];

    const base = text.split(",").map(t => t.trim()).map(t => t.toLowerCase());
    const translateObject = base.reduce((acc, cur) => ({ ...acc, [cur]: cur }), {});

    for (const key of base) {
      const id = getId(opts, key);
      const cached = await cache.get(id);
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
            await cache.set(getId(opts, key), transArr[i], "EX", 60 * 60 * 24 * 7);
            translateObject[key] = transArr[i];
          }

          return Object.values(translateObject).join(", ");
        })
        .then(value => value);
  };

  for (let key in defaults) {
    translate[key] =
      typeof options[key] === "undefined" ? defaults[key] : options[key];
  }
  return translate;
};

// Small hack needed for Webpack/Babel: https://github.com/webpack/webpack/issues/706
const exp = new Translate();
exp.Translate = Translate;
export default exp;
export { Translate };
