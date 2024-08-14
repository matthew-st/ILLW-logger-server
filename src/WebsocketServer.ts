import {EventEmitter, WebSocket, WebSocketServer} from "ws"
export default class WebsocketServer extends EventEmitter {
    port: number
    server: WebSocketServer
    constructor(port: number) {
        super()
        this.port = port
        this.startServer()
    }

    startServer() {
        this.server = new WebSocketServer({ port: this.port })
        this.server.on('connection', (ws: WebSocket) => {
            let timeout = setTimeout(() => {ws.close(3000)}, 10000)
            console.log('Connection')
            ws.on('message', (data) => {
                if(!JSON.parse(data.toString())) {
                    ws.close()
                }
                //@ts-ignore
                const parsed = JSON.parse(data.toString())
                console.log(parsed)
                switch (parsed.op) {
                    case 0:
                        //@ts-ignore
                        clearTimeout(timeout)
                        //@ts-ignore
                        timeout = setTimeout(() => {ws.close(1000, 'hb')}, 15000)
                        this.emit('auth', parsed, ws)
                    break;
                    case 1:
                        this.emit('action', parsed)
                    break;
                    case 2:
                        this.emit('actionReplay', parsed)
                    break;
                    // HB packet
                    case 1000:
                        //@ts-ignore
                        clearTimeout(timeout)
                        //@ts-ignore
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

    broadcast(message: object) {
        this.server.clients.forEach(ws => {
            if (ws.OPEN) {
                ws.send(JSON.stringify(message))
            }
        })
    }
}