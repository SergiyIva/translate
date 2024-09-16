import Translate from "./index.js";
import {Redis} from "ioredis";

const redis = new Redis({
    host: "127.0.0.1",
    port: 6379
})

const translate = new Translate(redis)
const res = await translate.translate("привет", {from: "ru", to: "en"})
console.log(res)

console.log(await redis.get("translate:ru:en:google:привет"))
process.exit(0)