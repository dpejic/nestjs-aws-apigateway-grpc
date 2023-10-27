import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import { createServer, proxy } from 'aws-serverless-express';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { Server } from 'http';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { ENV, PORT } from '../constants';
import { Environment } from '@types';
import { GrpcServerExceptionFilter } from 'nestjs-grpc-exceptions';

let cachedServer: Server;

const bootstrapServer = async () => {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adapter as never
  );
  app.useGlobalFilters(new GrpcServerExceptionFilter());
  await app.init();

  const config = app.get<ConfigService>(ConfigService);
  const environment = config.get<string>(ENV);
  const port = config.get<number>(PORT);

  if (environment === Environment.LOCAL) {
    Logger.log(`🚀 NestJS server is running on port ${port}`);
    await app.listen(port);
    return null;
  }

  return createServer(expressApp);
};

export const api = async (event, context) => {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  Logger.log(`🚀 NestJS server is running...`);
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};

bootstrapServer();
