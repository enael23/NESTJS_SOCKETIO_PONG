import { Interval } from "@nestjs/schedule";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { interval } from "rxjs";
import { Server, Socket } from 'socket.io'

@WebSocketGateway({cors: {origin: '*',},})
export class SocketEvents {

    @WebSocketServer()
    server: Server;

    width: number = 600;
    height: number = 400;
    paddleHeight: number = 80;
    paddleWidth: number = 15;
    paddleSpeed: number = 10;
    ballRadius: number = 5;

    p1: number = this.height / 2;
    p2: number = this.height / 2;
    balR: number = 10;
    balPosX: number = this.width / 2;
    balPosY: number = this.height / 2;
    balVelX: number = 5;
    balVelY: number = 10;
    p1Score: number = 0;
    p2Score: number = 0;

    p1KeyUp: boolean = false;
    p1KeyDown: boolean = false;
    p2KeyUp: boolean = false;
    p2KeyDown: boolean = false;

    tic: number = 0;

    p1Id: string = null;
    p2Id: string = null;

    //connexion
    handleConnection(client: Socket){
        console.log(`Client Connected: ${client.id}`);
        if (this.p1Id == null){
            this.p1Id = client.id;
            console.log(`p1Id = ${this.p1Id}`);
        }
        else if (this.p2Id == null){
            this.p2Id = client.id;
            console.log(`p2Id = ${this.p1Id}`);
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
        if (key == 'ArrowUp' && client.id == this.p1Id){this.p1KeyUp = true;}
        if (key == 'ArrowDown' && client.id == this.p1Id){this.p1KeyDown = true;}
        if (key == 'ArrowUp' && client.id == this.p2Id){this.p2KeyUp = true;}
        if (key == 'ArrowDown' && client.id == this.p2Id){this.p2KeyDown = true;}
    }

    @SubscribeMessage('keyRelease')
    handleKeyRelease(@MessageBody() key: string, @ConnectedSocket() client: Socket){
        console.log(`Key released: ${key}`);
        // if (key == 'ArrowUp'){this.pos -= 10;}
        // if (key == 'ArrowDown'){this.pos += 10;}
        // this.server.emit('key', this.pos);
        // this.server.emit('key', this.pos, this.balPosX, this.balPosY);
        if (key == 'ArrowUp' && client.id == this.p1Id){this.p1KeyUp = false;}
        if (key == 'ArrowDown' && client.id == this.p1Id){this.p1KeyDown = false;}
        if (key == 'ArrowUp' && client.id == this.p2Id){this.p2KeyUp = false;}
        if (key == 'ArrowDown' && client.id == this.p2Id){this.p2KeyDown = false;}
    }

    resetBall(){
        this.balPosX = this.width / 2;
        this.balPosY = this.height / 2;
        this.balVelX = -3;
        if (Math.random() > .5)
            this.balVelX = 3;
        this.balVelY = Math.floor(Math.random() * 20) - 10;
        this.server.emit('message', `Score : ${this.p1Score} - ${this.p2Score}`);
    }

    @Interval(15)
    handleInterval(){
        if (this.balVelX < 0 && this.balPosX == this.paddleWidth
            && this.balPosY > this.p1 - this.paddleHeight/2
            && this.balPosY < this.p1 + this.paddleHeight/2){
                this.balVelX = -this.balVelX;
                this.balVelY = -(this.p1 - this.balPosY)/4;
            }
        else if (this.balVelX > 0 && this.balPosX == this.width - this.paddleWidth
            && this.balPosY > this.p2 - this.paddleHeight/2
            && this.balPosY < this.p2 + this.paddleHeight/2){
                this.balVelX = -this.balVelX;
                this.balVelY = -(this.p2 - this.balPosY)/4;
            }
        else if (this.balPosX < this.balR){
                this.p2Score++;
                this.resetBall();
            }
        else if (this.balPosX > this.width - this.balR){
                // this.balVelX = -this.balVelX;
                this.p1Score++;
                this.resetBall();
            }

        if (this.balPosY < this.balR || this.balPosY > this.height - this.balR)
            this.balVelY = -this.balVelY;


        this.balPosX += this.balVelX;
        this.balPosY += this.balVelY;

        if (this.p1KeyDown && (this.p1 + this.paddleHeight/2) < this.height)
        {this.p1 += this.paddleSpeed;}
        if (this.p1KeyUp && (this.p1 - this.paddleHeight/2) > 0)
        {this.p1 -= this.paddleSpeed;}
        if (this.p2KeyDown && (this.p2 + this.paddleHeight/2) < this.height)
        {this.p2 += this.paddleSpeed;}
        if (this.p2KeyUp && (this.p2 - this.paddleHeight/2) > 0)
        {this.p2 -= this.paddleSpeed;}

        this.server.emit('key', this.p1, this.p2, this.balPosX, this.balPosY);
        // console.log(`tic ${this.tic++}`);
    }
}