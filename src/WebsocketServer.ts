import { PrismaClient } from "@prisma/client"
import {EventEmitter, WebSocket, WebSocketServer} from "ws"
import { Action } from "./types"
export default class WebsocketServer extends EventEmitter {
    port: number
    server: WebSocketServer
    prisma: PrismaClient
    constructor(port: number, prisma: PrismaClient) {
        super()
        this.port = port
        this.prisma = prisma
        this.startServer()
    }

    startServer() {
        this.server = new WebSocketServer({ port: this.port })
        this.server.on('connection', (ws: WebSocket) => {
            let timeout = setTimeout(() => {ws.close(3000)}, 10000)
            let authed = false
            ws.on('message', (data) => {
                if(!JSON.parse(data.toString())) {
                    ws.close()
                }
                const parsed = JSON.parse(data.toString())
                if (!authed && parsed.op != 0) {ws.close(3000)}
                switch (parsed.op) {
                    case 0:
                        clearTimeout(timeout)
                        timeout = setTimeout(() => {ws.close(1000, 'hb')}, 15000)
                        authed = true
                        this.emit('auth', parsed, ws)
                    break;
                    case 1:
                        this.emit('action', parsed, ws)
                    break;
                    case 2:
                        this.emit('actionReplay', parsed, ws)
                    break;
                    // HB packet
                    case 1000:
                        clearTimeout(timeout)
                        timeout = setTimeout(() => {ws.close(1000, 'HB')}, 15000)
                        ws.send(JSON.stringify({
                            op: 1000,
                        }))
                }
            })
        })
        this.server.on('listening', () => {
            this.emit('listening')
        })
    }
    async addQSO(data: Action) {
        await this.prisma.qSO.create({
            data: data.qso
        })
        this.broadcast({
            op: 1,
            qso: data.qso,
            opId: data.opId
        })
    }

    async editQSO(data: Action) {
        await this.prisma.qSO.update({
            where: {
                id: data.qso.id
            },
            data: data.qso
        })
        this.broadcast({
            op: 2,
            qso: data.qso,
            opId: data.opId
        })
    }

    async deleteQSO(data: Action) {
        await this.prisma.qSO.delete({
            where: {
                id: data.qso.id
            }
        })
        this.broadcast({
            op: 3,
            id: data.qso.id,
            opId: data.opId
        })
    }

    broadcast(message: object) {
        this.server.clients.forEach(ws => {
            if (ws.OPEN) {
                ws.send(JSON.stringify(message))
            }
        })
    }
}