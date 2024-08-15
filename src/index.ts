import { PrismaClient } from "@prisma/client"
import { chunk } from "./functions"
import WebsocketServer from "./WebsocketServer"
import { ActionPacket, ActionReplayPacket, AuthPacket } from "./types"
import handleQSLMail from "./QSLCards"

// This is incredibly hacky, but it tells JSON.stringify how to serialize the BigInt used in the timestamp.
//@ts-ignore
BigInt.prototype['toJSON'] = function () { 
    return this.toString()
}

require('ckey')
const prisma = new PrismaClient()
const server = new WebsocketServer(3903, prisma)

server.on('auth', async (pkt: AuthPacket, ws: WebSocket) => {
    let QSOs = await prisma.qSO.findMany()
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

server.on('action', async (data: ActionPacket, ws: WebSocket) => {
    if(!data.action.opId) {ws.close(1000)}
    if (!data.action.qso.id 
        && !data.action.qso.call 
        && !data.action.qso.freq 
        && !data.action.qso.rstSent 
        && !data.action.qso.rstRcvd 
        && !data.action.qso.mode 
        && !data.action.qso.time 
        && !data.action.qso.operatorCall) {
        if (ws.OPEN) {ws.send(JSON.stringify({
            op: 5,
            opId: data.action.opId
        }))}
    }
    if (data.action.type == 'add') {
        await server.addQSO(data.action)
    } else if (data.action.type == 'edit') {
        await server.editQSO(data.action)
    } else if (data.action.type == 'delete') {
        await server.deleteQSO(data.action)
    }
})

server.on('actionReplay', async (data: ActionReplayPacket, ws: WebSocket) => {
    for (let action_idx in data.actions) {
        let action = data.actions[action_idx]
        if(!action.opId) {ws.close(1000)}
        if (!action.qso.id 
            && !action.qso.call 
            && !action.qso.freq 
            && !action.qso.rstSent 
            && !action.qso.rstRcvd 
            && !action.qso.mode 
            && !action.qso.time 
            && !action.qso.operatorCall) {
            if (ws.OPEN) {ws.send(JSON.stringify({
                op: 5,
                opId: action.opId
            }))}
        }
        if (action.type == 'add') {
            await server.addQSO(action)
        } else if (action.type == 'edit') {
            await server.editQSO(action)
        } else if (action.type == 'delete') {
            await server.deleteQSO(action)
        }

    }    
})

server.on('listening', () => {
    console.log(`Websocket listening on ${server.port}`)
    setInterval(async () => {
        let QSOsToMail = await prisma.qSO.findMany({where: {emailed: false}})
        handleQSLMail(QSOsToMail)
        await prisma.qSO.updateMany({
            where: {emailed: false},
            data: {emailed: true}
        })
    }, 30000)
})