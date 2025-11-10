import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  memberId?: string;
}

@WebSocketGateway({ 
  transports: ['websocket'], 
  secure: false,
  cors: {
    origin: '*',
  }
})
export class SocketGateway implements OnGatewayInit {
  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger('SocketEventsGateway');
  private summaryClient: number = 0;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  public afterInit(server: Server) {
    this.logger.verbose(`WebSocket Server Initialized total: ${this.summaryClient}`)
  }

  handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    this.summaryClient++;
    this.logger.log(`== Client connected total: ${this.summaryClient} ==`)
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.memberId) {
      this.connectedClients.delete(client.memberId);
      this.logger.log(`Member ${client.memberId} disconnected`);
    }
    this.summaryClient--;
    this.logger.log(`== Client disconnected left total: ${this.summaryClient} ==`)
  }

  @SubscribeMessage('message')
  public handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('subscribe')
  public handleSubscribe(client: AuthenticatedSocket, payload: { memberId: string }): void {
    if (payload?.memberId) {
      client.memberId = payload.memberId;
      this.connectedClients.set(payload.memberId, client);
      this.logger.log(`Member ${payload.memberId} subscribed to notifications`);
      client.emit('subscribed', { success: true, memberId: payload.memberId });
    } else {
      this.logger.warn('Subscribe failed: no memberId provided');
      client.emit('subscribed', { success: false, message: 'No memberId provided' });
    }
  }

  // Notification

  @SubscribeMessage('unsubscribe')
  public handleUnsubscribe(client: AuthenticatedSocket): void {
    if (client.memberId) {
      this.connectedClients.delete(client.memberId);
      this.logger.log(`Member ${client.memberId} unsubscribed from notifications`);
      client.memberId = undefined;
    }
  }

  public emitNotificationToUser(memberId: string, notification: any): void {
    const client = this.connectedClients.get(memberId);
    if (client) {
      client.emit('newNotification', notification);
      this.logger.log(`Notification sent to member ${memberId}`);
    } else {
      this.logger.log(`Member ${memberId} not connected, notification will be queued`);
    }
  }

  public broadcastNotification(notification: any): void {
    this.server.emit('broadcastNotification', notification);
    this.logger.log('Notification broadcast to all clients');
  }
}
