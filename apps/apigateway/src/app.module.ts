import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ENV, QUOTES_GRPC_URL } from '../constants';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QUOTE_PACKAGE_NAME, QUOTE_SERVICE_NAME } from '@proto';
import { join } from 'path';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        [ENV]: Joi.string().default('local'),
        [QUOTES_GRPC_URL]: Joi.string().required(),
      })
    }),
    ClientsModule.registerAsync([
      {
        name: QUOTE_SERVICE_NAME,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: QUOTE_PACKAGE_NAME,
            protoPath: join(__dirname, './quotes.proto'),
            url: configService.get<string>(QUOTES_GRPC_URL),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
