import { Logger } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  memberId?: string;
}

@WebSocketGateway({ 
  transports: ['websocket'], 
  secure: false, // no need HTTPS
  cors: {
    origin: '*',  // All Frontend domain connect
  }
})
export class SocketGateway implements OnGatewayInit { // OnGatewayInit this work after webocketGatway
  @WebSocketServer()
  private server: Server;  // real Scoket.IO Server

  private logger: Logger = new Logger('SocketEventsGateway');
  private summaryClient: number = 0;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map(); // saves all memberId and their socekt by Map

  public afterInit(server: Server) {
    this.logger.verbose(`WebSocket Server Initialized total: ${this.summaryClient}`)
  }

  handleConnection(client: any, ...args: any[]) {
    this.summaryClient++;
    this.logger.verbose(`== Client connected total: ${this.summaryClient} ==`);

    // for chatting
    client.on('message', (rawMessage: any) => {
      try {
        const messageStr = rawMessage.toString();
        this.logger.log('Raw message received:', messageStr);
        
        const data = JSON.parse(messageStr);
        this.logger.log('Parsed data:', JSON.stringify(data));

        if (data.event === 'subscribe') {
          this.handleSubscribe(client, data);
        } else if (data.event === 'message') {
          this.handleMessage(client, data);
        } else if (data.event === 'typing') {
          this.handleTyping(client, data);
        } else if (data.event === 'unsubscribe') {
          this.handleUnsubscribe(client);
        }
      } catch (err) {
        this.logger.error('Failed to parse message:', err.message);
      }
    });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.memberId) {
      this.connectedClients.delete(client.memberId);
      this.logger.verbose(`Member ${client.memberId} disconnected`);
    }
    this.summaryClient--;
    this.logger.verbose(`== Client disconnected left total: ${this.summaryClient} ==`)
  }


  // Notification

  private handleSubscribe(client: AuthenticatedSocket, data: any): void {
    this.logger.log('=== SUBSCRIBE RECEIVED ===');
    this.logger.log('Payload:', JSON.stringify(data));
    
    const memberId = data?.memberId;
    
    if (!memberId) {
      this.logger.warn('Subscribe failed: no memberId provided');
      this.logger.warn('Payload was:', JSON.stringify(data));
      client.emit('subscribed', { success: false, message: 'No memberId provided' });
      return;
    }
    
    client.memberId = memberId;
    this.connectedClients.set(memberId, client);
    
    this.logger.log(` Member ${memberId} subscribed successfully`);
    
    client.emit('subscribed', {
      success: true,
      memberId: memberId
    });
    
    client.emit('info', {
      event: 'info',
      totalClients: this.connectedClients.size,
      action: 'subscribed'
    });
  }

  private handleMessage(client: AuthenticatedSocket, data: any): void {
    const senderId = client.memberId || data.memberId;
    const messageContent = data.data || data.messageContent;

    this.logger.log(`=== HANDLE MESSAGE START ===`);
    this.logger.log(`Sender ID: ${senderId}`);
    this.logger.log(`Message: ${messageContent}`);
    this.logger.log(`Connected clients: ${this.connectedClients.size}`);
    this.logger.log(`Client in map: ${this.connectedClients.has(senderId)}`);

    if (!senderId) {
      this.logger.warn(' Message from unsubscribed client');
      return;
    }

    const messagePayload = {
      event: 'message',
      text: messageContent,
      messageContent: messageContent,
      memberId: senderId,
      memberData: data.memberData,
      timestamp: new Date(),
      createdAt: new Date()
    };

    this.logger.log(`Payload to broadcast:`, JSON.stringify(messagePayload));
    this.logger.log('Broadcasting message to all clients');
    this.broadcastMessageToAll(messagePayload);
    this.logger.log(`=== HANDLE MESSAGE END ===`);
  }

  private broadcastMessageToAll(payload: any): void {
    const message = JSON.stringify(payload);
    this.logger.log(`Broadcasting to ${this.connectedClients.size} clients`);

    this.connectedClients.forEach((client, memberId) => {
      try {
        this.logger.log(`  → Sending to ${memberId}`);
        client.send(message);
      } catch (error) {
        this.logger.error(`Failed to send to client ${memberId}:`, error.message);
      }
    });

    this.logger.log(' Broadcast complete');
  }

  private handleTyping(client: AuthenticatedSocket, data: any): void {
    if (data?.receiverId) {
      const receiverClient = this.connectedClients.get(data.receiverId);
      if (receiverClient) {
        receiverClient.emit('userTyping', {
          senderId: client.memberId,
          isTyping: data.isTyping,
        });
        this.logger.log(`Typing indicator sent to ${data.receiverId}`);
      }
    }
  }

  private handleUnsubscribe(client: AuthenticatedSocket): void {
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

  public emitMessageToUser(memberId: string, message: any): void {
    const client = this.connectedClients.get(memberId);
    if (client) {
      client.emit('newMessage', message);
      this.logger.log(`Message sent to member ${memberId}`);
    } else {
      this.logger.log(`Member ${memberId} not connected, message will be stored`);
    }
  }
}
