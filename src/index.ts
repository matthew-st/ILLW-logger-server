import { chunk } from "./functions"
import WebsocketServer from "./WebsocketServer"

require('ckey')
const server = new WebsocketServer(3903)
const QSOs: any[] = []
server.on('auth', (pkt, ws: WebSocket) => {
    if (pkt.token != process.env.TOKEN) {
        ws.send(JSON.stringify({
            op: 0,
            unauthenticated: true
        }))
        return ws.close(3000)
    }
    // Send chunks of QSOs from database
    let chunks = chunk(QSOs, 10)
    chunks.forEach((chunk, idx) => {
        ws.send(JSON.stringify({
            op: 0,
            chunk_status: [idx + 1,chunks.length],
            total_amount: QSOs.length,
            qso_list: chunk
        }))    
    })
})

server.on('listening', () => {
    console.log(`Websocket listening on ${server.port}`)
})