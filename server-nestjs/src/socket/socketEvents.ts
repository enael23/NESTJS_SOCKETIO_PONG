import { Interval } from "@nestjs/schedule";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { interval } from "rxjs";
import { Server, Socket } from 'socket.io'

@WebSocketGateway({cors: {origin: '*',},})
export class SocketEvents {

    @WebSocketServer()
    server: Server;

    pos: number = 100;
    balR: number = 10;
    balPosX: number = 200;
    balPosY: number = 200;
    balVelX: number = 5;
    balVelY: number = 10;

    paddleKeyUp: boolean = false;
    paddleKeyDown: boolean = false;

    tic: number = 0;

    id: string = null;

    //connexion
    handleConnection(client: Socket){
        console.log(`Client Connected: ${client.id}`);
        if (this.id == null){
            this.id = client.id;
            console.log(this.id);
        }
    }
    
    //deconnexion
    handleDisconnect(client: Socket){
        console.log(`Client disConnected : ${client.id}`);
    }

    //recevoir un event (s'abonner a un message)
    @SubscribeMessage('message')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: Socket){
        // envoyer un event
        console.log(`Message : ${data}`);
        this.server.emit('message', client.id, data);
    }

    @SubscribeMessage('keyPress')
    handleKeyPress(@MessageBody() key: string, @ConnectedSocket() client: Socket){
        console.log(`Key pressed : ${key}`);
        // if (key == 'ArrowUp'){this.pos -= 10;}
        // if (key == 'ArrowDown'){this.pos += 10;}
        // this.server.emit('key', this.pos);
        // this.server.emit('key', this.pos, this.balPosX, this.balPosY);
        if (key == 'ArrowUp' && client.id == this.id){this.paddleKeyUp = true;}
        if (key == 'ArrowDown' && client.id == this.id){this.paddleKeyDown = true;}
    }

    @SubscribeMessage('keyRelease')
    handleKeyRelease(@MessageBody() key: string){
        console.log(`Key released: ${key}`);
        // if (key == 'ArrowUp'){this.pos -= 10;}
        // if (key == 'ArrowDown'){this.pos += 10;}
        // this.server.emit('key', this.pos);
        // this.server.emit('key', this.pos, this.balPosX, this.balPosY);
        if (key == 'ArrowUp'){this.paddleKeyUp = false;}
        if (key == 'ArrowDown'){this.paddleKeyDown = false;}
    }


    @Interval(15)
    handleInterval(){
        if (this.balPosX < this.balR || this.balPosX > 400 - this.balR)
            this.balVelX = -this.balVelX;
        if (this.balPosY < this.balR || this.balPosY > 400 - this.balR)
            this.balVelY = -this.balVelY;
        this.balPosX += this.balVelX;
        this.balPosY += this.balVelY;

        if (this.paddleKeyDown){this.pos += 20;}
        if (this.paddleKeyUp){this.pos -= 20;}

        this.server.emit('key', this.pos, this.balPosX, this.balPosY);
        // console.log(`tic ${this.tic++}`);
    }
}