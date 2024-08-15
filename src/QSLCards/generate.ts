import * as fs from "fs"
import { createCanvas, loadImage } from "canvas"
import wrapText from "./wrapText"
import { QSO } from "../types"
const queries = [
    { name: "to", x: 50, y: 347, w: 350, h: 80 },
    { name: "date", x: 1105, y: 346, w: 432, h: 78 },
    { name: "op", x: 1105, y: 424, w: 432, h: 78 },
    { name: "freq", x: 1105, y: 502, w: 432, h: 78 },
    { name: "mode", x: 1105, y: 580, w: 432, h: 78 },
    { name: "rstS", x: 1105, y: 658, w: 432, h: 78 },
    { name: "rstR", x: 1105, y: 736, w: 432, h: 78 },
    { name: "notes", x: 50, y: 510, w: 500, h: 310 },
    { name: "id", x: 790, y: 877, w: 300, h: 34 }
]
const front = fs.readFileSync("./images/Front.png")
const back = fs.readFileSync("./images/Back.png")

export default async function generate(qso: QSO): Promise<{ back: Buffer; front: Buffer }> {
    let qso_render: any = {}
    let sendBlank = false
    qso_render.date = new Date(qso.time).toUTCString().slice(0,-4)
    qso_render.rstS = qso.rstSent
    qso_render.rstR = qso.rstRcvd
    qso_render.mode = qso.mode
    qso_render.op = qso.operatorCall
    qso_render.to = qso.call
    qso_render.id = qso.id
    qso_render.freq = qso.freq
    qso_render.notes = qso.notes
    queries.forEach((q) => {
        if (!qso_render[q.name] && q.name != "notes") {
            sendBlank = true
        }
    })
    if (sendBlank) {
        return {back, front}
    } else {
        const img = await loadImage(back)
        const canvas = createCanvas(1600, 1028)
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0)
        ctx.fillStyle = "#000000"
        ctx.textBaseline = "middle"
        queries.forEach((q) => {
            if (q.name == "to") {
                ctx.textAlign = "left"
                ctx.font = "48px Sans"
                ctx.fillText(qso_render[q.name], q.x + q.w / 1.5, q.y + q.h / 1.9, q.w)
            } else if (q.name == "notes") {
                ctx.font = "24px Sans"
                ctx.textAlign = "left"
                let text = wrapText(ctx, qso_render["notes"], q.x, q.y, q.w, 28)
                let num = 1
                text.forEach(item => {
                    if (num > 10) return;
                    //@ts-ignore
                    ctx.fillText(item[0], item[1], item[2])
                    num++
                })
            } else {
                ctx.font = "32px Sans"
                ctx.textAlign = "center"
                ctx.fillText(qso_render[q.name], q.x + q.w / 2, q.y + q.h / 2, q.w)
            }
        })
        return {back: canvas.toBuffer(), front}
    }
}