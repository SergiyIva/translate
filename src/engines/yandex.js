export default {
    needkey: true,
    fetch: ({key, from, to, text}) => [
        `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${key}&lang=${from}-${to}&text=${encodeURIComponent(
            text
        )}`,
        {method: "POST", body: {}},
    ],
    parse: (res) => {
        const body = res.data;
        if (body.code !== 200) {
            throw new Error(body.message);
        }
        return body.text[0];
    }
};
