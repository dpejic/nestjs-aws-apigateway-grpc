import { App } from 'aws-cdk-lib';
import { AppStack } from '../lib/apigateway-stack';
import { ACCOUNT_NUMBER, ACCOUNT_REGION, ENV, QUOTES_GRPC_URL } from '../constants';
import * as path from 'path';
import * as Joi from 'joi';
import { ConfigModule, ConfigService } from '@nestjs/config';

const configuration = process.env.CONFIGURATION || 'production';
const envPath = path.resolve(__dirname, `../.env.${configuration}`);

ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    [ENV]: Joi.string().default('local'),
    [ACCOUNT_NUMBER]: Joi.string().required(),
    [ACCOUNT_REGION]: Joi.string().required(),
    [QUOTES_GRPC_URL]: Joi.string().required(),
  }),
  envFilePath: envPath,
});

const configService = new ConfigService();

const app = new App();
new AppStack(app, 'NestjsApiGatewayStack', configService, {
  env: {
    account: configService.get<string>(ACCOUNT_NUMBER),
    region: configService.get<string>(ACCOUNT_REGION),
  },
});

app.synth();
