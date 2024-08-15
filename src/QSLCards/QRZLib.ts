import {parseString} from 'xml2js'
import * as util from 'util'
import fetch from 'node-fetch'

export default class QRZHandler {
    private key: string
    private creds: [string, string]
    constructor(login: string, pass: string) {
        this.creds = [login, pass]
        this._getNewKey()
    }

    async _getNewKey() {
        let URL = `https://xmldata.qrz.com/xml/current/?username=${this.creds[0]};password=${this.creds[1]}&agent=CSLlog.v2`
        let xml = await fetch(URL).then(res => res.text())
        parseString(xml, async (err, parsed) => {
            if (err) {
                console.log("XML parse error", err)
                return
            }
            if (!parsed["QRZDatabase"] && !parsed["QRZDatabase"]["Session"] && !parsed["QRZDatabase"]["Session"][0]["Key"]) {
                if (parsed["QRZDatabase"]["Session"][0]["Error"]) {
                    if (parsed["QRZDatabase"]["Session"][0]["Error"].includes("Not found:")) {
                        return {error: "Not found."}
                    }
                } else {
                    return console.log(`XML Error QRZ\n\n\n${util.inspect(parsed, {depth: 4})}\n\n\n`)
                }
            }
            this.key = parsed["QRZDatabase"]["Session"][0]["Key"][0]
        })
    }

    async getUser(callsign: string): Promise<{ name: string; email: string }> {
        if (!this.key) {
            return await this._getNewKey().then(() => this.getUser(callsign)).then(val => val)
        }
        let URL = `https://xmldata.qrz.com/xml/current/?s=${this.key};callsign=${callsign}`
        let xml = await fetch(URL).then(res => res.text())
        let userReturned;
        parseString(xml, async (err, parsed) => {
            if (err) {
                console.log("XML parse error", err)
                return
            }
            if (!parsed["QRZDatabase"] && !parsed["QRZDatabase"]["Session"] && !parsed["QRZDatabase"]["Session"][0]["Key"]) {
                if (parsed["QRZDatabase"]["Session"][0]["Error"]) {
                    if (parsed["QRZDatabase"]["Session"][0]["Error"].includes("Not found:")) {
                        return {error: "Not found."}
                    }
                } else if (parsed["QRZDatabase"]["Session"][0]["Error"] == "Session Timeout") {
                    return this._getNewKey().then(()=>this.getUser(callsign)).then(val => val)
                } else {
                    return console.log(`XML Error QRZ\n\n\n${util.inspect(parsed, {depth: 4})}\n\n\n`)
                }
                return console.log(`XML Error QRZ\n\n\n${util.inspect(parsed, {depth: 4})}\n\n\n`)
            }
            userReturned = parsed["QRZDatabase"]["Callsign"][0]
        })
        return {
            //@ts-ignore
            name: userReturned?.fname,
            //@ts-ignore
            email: userReturned?.email || "me@ocld.cc"
        }
    }   
}