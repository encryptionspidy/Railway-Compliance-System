import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getUserNotifications(
    @CurrentUser() currentUser: any,
    @Query('isRead') isRead?: string,
  ) {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.notificationsService.getUserNotifications(
      currentUser.id,
      isReadBool,
    );
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.notificationsService.markAsRead(id, currentUser.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() currentUser: any) {
    return this.notificationsService.markAllAsRead(currentUser.id);
  }
}
