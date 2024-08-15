export interface Action {
    type: string,
    qso: QSO,
    opId: string
    fulfilled: boolean
}

export interface QSO {
    call: string
    freq: string
    band: string
    rstSent: string
    rstRcvd: string
    mode: string
    notes: string
    time: string
    id: string
    operatorCall: string
}

export interface AuthPacket {
    token: string
}
export interface ActionPacket {
    action: Action
}
export interface ActionReplayPacket {
    actions: Action[]
}