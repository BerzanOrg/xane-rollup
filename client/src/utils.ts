import { IncomingMessage } from "http"

export const readBodyJson = (req: IncomingMessage) => {
    return new Promise<unknown>((resolve, reject) => {
        let body = ""
        req.on("data", (chunk) => {
            body += "" + chunk
        })
        req.on("end", () => {
            resolve(JSON.parse(body))
        })
        req.on("error", (err) => {
            reject(err)
        })
    })
}
