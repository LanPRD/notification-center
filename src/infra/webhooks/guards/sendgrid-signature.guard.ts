import { EnvService } from "@/infra/env/env.service";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { createPublicKey, verify } from "node:crypto";

// https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
@Injectable()
export class SendGridSignatureGuard implements CanActivate {
  private readonly logger = new Logger(SendGridSignatureGuard.name);

  constructor(private readonly envService: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const signature = request.headers[
      "x-twilio-email-event-webhook-signature"
    ] as string;
    const timestamp = request.headers[
      "x-twilio-email-event-webhook-timestamp"
    ] as string;
    const rawBody = (request as any).rawBody?.toString() ?? "";

    if (!this.verifySignature(signature, timestamp, rawBody)) {
      this.logger.warn("Invalid webhook signature received");
      throw new UnauthorizedException("Invalid webhook signature");
    }

    return true;
  }

  private verifySignature(
    signature: string,
    timestamp: string,
    rawBody: string
  ): boolean {
    const publicKeyRaw = this.envService.get(
      "SENDGRID_WEBHOOK_VERIFICATION_KEY"
    );

    // Skip verification in demo/dev mode when key is not configured
    if (!publicKeyRaw) {
      this.logger.warn(
        "SENDGRID_WEBHOOK_VERIFICATION_KEY not configured - skipping signature verification"
      );

      return true;
    }

    if (!signature || !timestamp) {
      this.logger.warn("Missing signature or timestamp headers");
      return false;
    }

    try {
      const payload = timestamp + rawBody;
      const decodedSignature = Buffer.from(signature, "base64");

      const publicKeyPem =
        publicKeyRaw.includes("BEGIN PUBLIC KEY") ? publicKeyRaw : (
          `-----BEGIN PUBLIC KEY-----\n${publicKeyRaw}\n-----END PUBLIC KEY-----`
        );

      const publicKey = createPublicKey({
        key: publicKeyPem,
        format: "pem"
      });

      return verify(null, Buffer.from(payload), publicKey, decodedSignature);
    } catch (error) {
      this.logger.error("Signature verification failed", error);
      return false;
    }
  }
}
