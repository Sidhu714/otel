import { WebSocketServer } from "ws"


export function attachWsServer(httpServer,store){

    const wss = new WebSocketServer({
        server : httpServer
    });

    wss.on('connection',(ws) =>{
        console.log('[ws] client connected');

        send(ws,{
            type : 'snapshot',
            traces : store.list()
        });

        ws.on('close',() => console.log('[ws] client disconnected'));
        ws.on('error', (err) => console.error('[ws] error:', err.message));
    })

    store.on('trace:update',(trace) => {
        broadcast(wss,{
            type : "trace:update",
            trace : trace
        });
    })

    store.on("store:clear",() => {
        broadcast(wss, { type: 'store:clear' });
    })

    return wss;
}

function broadcast(wss,msg){
    const paylaod = JSON.stringify(msg);

    for(const client of wss.clients){
        if(client.readyState === 1) client.send(paylaod);
    }
}


function send(ws,msg){
    if(ws.readyState === 1) ws.send(JSON.stringify(msg))
}