import nodemailer from 'nodemailer'
import QRZHandler from './QRZLib'
import generate from './generate'
import { QSO } from '../types'

let transport = nodemailer.createTransport({
    host: process.env.email_host,
    port: 587,
    secure: false,
    auth: {
        user: process.env.email_user,
        pass: process.env.email_pass
    }
})
let qrz = new QRZHandler(process.env.qrz_user, process.env.qrz_pass)
export default async function handleQSLMail(qsos: QSO[]) {
    qsos.forEach(async (QSO) => {
        let user = await qrz.getUser(QSO.call)
        let generated = await generate(QSO)
        transport.sendMail({
            from: 'GB0CSL E-mail QSL cards <gb0csl@ocld.cc>',
            to: `${user.name} <me@ocld.cc>`,
            subject: `73s ${QSO.call} de GB0CSL`,
            text: `Hello ${user.name}.
            You have recently made a contact with the GB0CSL Covesea lighthouse station.
            Your QSL card for your QSO ${QSO.id} is attached below.
            
            73s from MFARS at GB0CSL
            Email system designed by MM0KLQ for MFARS. Any queries please contact matthew@mm0klq.co.uk`,
            attachments: [
                {filename: 'front.png', content: generated.front},
                {filename: 'back.png', content: generated.back}
            ]
        })
    })
}