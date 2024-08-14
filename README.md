# ILLW-logger-v2 server

OP 0, auth packet
from client:
```
{
    op: 0,
    token: string
}
```
from server:
```
{
    op: 0,
    chunk_status: [number, number],
    total_number: number,
    qso_list: QSO[]
}
```

OP 1, action packet to server
from client:
```
{
  op: 1,
  action: {
    type: 'add', 'delete' or 'edit',
    qso: {
      call: string,
      freq: string,
      band: string,
      rstSent: string,
      rstRcvd: string,
      mode: string,
      notes: string,
      time: number,
      id: string,
      operatorCall: string
    },
    opId: string,
    fulfilled: false
  }
}
```

OP 2:
from client:
```
{
  op: 2,
  actions: Action[] // see above for example of actions.
}
```