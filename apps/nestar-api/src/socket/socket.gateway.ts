import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'http';

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
  private logger: Logger = new Logger('SocketEventsGateway');
  private summaryClinent: number = 0;


  public afterInit(server: Server) {
    this.logger.log(`WebSocket Server Initialized total: ${this.summaryClinent}`)
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    this.summaryClinent++;
    this.logger.log(`== Client connected total: ${this.summaryClinent} ==`)
  }

  handleDisconnect(client: WebSocket) {
    this.summaryClinent--;
    this.logger.log(`== Client disconnected left total: ${this.summaryClinent} ==`)
  }

  @SubscribeMessage('message')
  public handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
