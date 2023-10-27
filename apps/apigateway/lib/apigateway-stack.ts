import { ConfigService } from '@nestjs/config';
import { Stack, App, StackProps, Duration } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, LayerVersion, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { ENV, QUOTES_GRPC_URL } from '../constants';

export class AppStack extends Stack {
  constructor(scope: App, id: string, configService: ConfigService, props?: StackProps) {
    super(scope, id, props);

    const lambdaLayer = new LayerVersion(this, 'HandlerLayer', {
      code: Code.fromAsset(
        path.resolve(__dirname, '../dist/apps/apigateway/node_modules')
      ),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
      description: 'Api Handler Dependencies',
    });

    const handler = new Function(this, 'Handler', {
      code: Code.fromAsset(path.resolve(__dirname, '../dist/apps/apigateway'), {
        exclude: ['node_modules'],
      }),
      functionName: 'ApiGateway',
      handler: 'main.api',
      layers: [lambdaLayer],
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(20),
      environment: {
        NODE_PATH: '$NODE_PATH:/opt',
        ENV: configService.get<string>(ENV),
        QUOTES_GRPC_URL: configService.get<string>(QUOTES_GRPC_URL),
      },
    });

    new LambdaRestApi(this, 'Api', {
      handler: handler,
      proxy: true,
    });
  }
}
