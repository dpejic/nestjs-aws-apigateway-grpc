import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { AppModule } from './app/app.module';
import { QUOTE_PACKAGE_NAME } from '@proto';
import { ConfigService } from '@nestjs/config';
import { GRPC_URL } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      protoPath: join(__dirname, './quotes.proto'),
      package: QUOTE_PACKAGE_NAME,
      url: configService.get<string>(GRPC_URL),
    },
  });
  await app.startAllMicroservices();

  Logger.log(
    `🚀 Application is running on ${configService.get<string>(GRPC_URL)}`
  );
}

bootstrap();
