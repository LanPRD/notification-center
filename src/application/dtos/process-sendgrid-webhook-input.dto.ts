export interface SendGridEventInputDto {
  email: string;
  event: string;
  notificationId?: string;
  reason?: string;
  timestamp: number;
}
