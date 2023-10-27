# Harnessing the Power of a Monorepo: AWS Serverless API Gateway, NestJS, and Microservices gRPC

![logo](https://i.ibb.co/jZ3bRLH/logo.png)

# Introduction

In the ever-evolving landscape of software development, staying agile and efficient is crucial for success. One approach that has gained significant traction in recent years is the use of a monorepo, a single repository that houses all your codebase. In this article, we will explore the concept of a monorepo and its benefits. Furthermore, we will highlight the importance of utilizing AWS Serverless API Gateway, NestJS, and Microservices gRPC in a monorepo setup, showcasing how this combination can supercharge your development process.

## What actually is Monorepo?

A monorepo, which means `single` and `repository`, is an approach where all the code for a project or a suite of related projects is stored in a single version control repository. Traditionally, developers would manage multiple repositories for different components of their application, such as frontend, backend, and various microservices. In contrast, a monorepo consolidates all these components into one unified codebase.

Now that we've provided a bit of explanation about what a monorepo is, let's dive into why using AWS Serverless API Gateway, NestJS, and Microservices gRPC in this setup is a game-changer.

## NestJS

NestJS is a NodeJS framework, fully supporting Typescript, for building server-side NodeJS applications. It supports design patterns like [Dependency Injection](https://www.freecodecamp.org/news/a-quick-intro-to-dependency-injection-what-it-is-and-when-to-use-it-7578c84fa88f/) and uses decorators (annotations in Java) which allows you to quickly define routes, request params, and many other possibilities, and it is considered as the JavaScript version of the [Spring MVC annotations](https://www.baeldung.com/spring-mvc-annotations).

## The Power of AWS Serverless API Gateway

**AWS Serverless API Gateway** simplifies the deployment and management of APIs. In a monorepo, this service can be a central point for managing API endpoints across different components of your application. It provides scalability, security, and easy integration with other AWS services.

## gRPC (Google Remote Procedure Call)

Microservices are an integral part of modern application development. **gRPC (Google Remote Procedure Call)** is a high-performance framework that facilitates communication between microservices.
In a monorepo setup, using Microservices gRPC ensures seamless interaction between different parts of your application, promoting modularity and scalability.

gRPC is a fast and efficient remote procedure call (RPC) thanks to its use of binary serialization, multiplexing, and asynchronous communication, reducing network and processing overhead. While there are other protocols available, this article primarily focuses on gRPC.

Before we dive deeper, let's see what the project structure looks like.

## Project Structure
```typescript
/apps
  /apigateway
    /bin
      - apigateway.ts // Entry point for AWS CDK application deployment
    /cdk.out // Stores the synthesized AWS CloudFormation templates
    /constants
      - index.ts // Constants definition
    /dist
    /lib
      - apigateway-stack.ts // AWS CDK stack definition for API Gateway
    /src
      /exception
        - gRPC-to-http.exception.ts // NestJS interceptor for transforming gRPC errors to HTTP exceptions
      - app.controller.ts // Application controller
      - app.module.ts // Application module
      - app.service.ts // Application service
      - main.ts // Main application file
    - cdk.json // AWS CDK configuration file
    ...
...
/libs
  /apigateway-cdk
    /src
      /executors
        /bootstrap
          - executor.ts // NX Executor for bootstrapping
        /deploy
          - executor.ts // NX Executor for deployment
        /destroy
          - executor.ts // NX Executor for resource destruction
  /proto
    /src
      - quotes.proto // Protocol Buffers definition for "quotes" service
  /types
    /src/lib/src
      - gRPC-to-http-code.ts // Mapping of gRPC error codes to HTTP status codes
```

**Now let's focus on the most important stuff** 🤫

### APIGATEWAY

The `apigateway` project is a NestJS application integrated with AWS API Gateway. This application serves as the central point for request management and communication with microservices using the gRPC protocol. It efficiently routes requests and ensures the integration of microservices into our serverless architecture.

- `/cdk-out` - *Stores the synthesized AWS CloudFormation templates and other deployment artifacts when you run the cdk deploy command. These templates define the infrastructure resources the CDK application intends to create in your AWS account.*

- `cdk.json` - *Configuration file for AWS CDK applications, specifying how to run the application and what context or settings it should use.*

- `apigateway.ts` - *The apigateway.ts file is the entry point for deploying an AWS CDK (Cloud Development Kit) application. It creates an instance of the AWS CDK App, defines infrastructure components in a specific stack, and then uses *app.synth()* to generate AWS CloudFormation templates for deployment.*

```typescript
import { App } from 'aws-cdk-lib';
import { AppStack } from '../lib/apigateway-stack';
import { ACCOUNT_NUMBER, ACCOUNT_REGION, ENV, QUOTES_gRPC_URL } from '../constants';
import * as path from 'path';
import * as Joi from 'joi';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Set the configuration based on the environment or use 'production' as the default
const configuration = process.env.CONFIGURATION || 'production';

// Define the path to the environment file
const envPath = path.resolve(__dirname, `../.env.${configuration}`);

// Initialize the configuration module
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    [ENV]: Joi.string().default('local'),
    [ACCOUNT_NUMBER]: Joi.string().required(),
    [ACCOUNT_REGION]: Joi.string().required(),
    [QUOTES_gRPC_URL]: Joi.string().required(),
  }),
  envFilePath: envPath,
});

// Create an instance of the configuration service
const configService = new ConfigService();

// Create an instance of the AWS CDK App
const app = new App();

// Create a new AWS CDK stack for the NestJS API Gateway
new AppStack(app, 'NestjsApiGatewayStack', configService, {
  env: {
    account: configService.get<string>(ACCOUNT_NUMBER),
    region: configService.get<string>(ACCOUNT_REGION),
  },
});

// Generate AWS CloudFormation templates for deployment
app.synth();

```

- `apigateway-stack.ts` - *This file defines an AWS CDK stack for deploying an AWS API Gateway with a Lambda function.*
```typescript
import { ConfigService } from '@nestjs/config';
import { Stack, App, StackProps, Duration } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, LayerVersion, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { ENV, QUOTES_gRPC_URL } from '../constants';

// Define a custom AWS CDK Stack for deploying the NestJS API Gateway
export class AppStack extends Stack {
  constructor(scope: App, id: string, configService: ConfigService, props?: StackProps) {
    super(scope, id, props);

    // Create a LayerVersion to manage dependencies for the Lambda function
    const lambdaLayer = new LayerVersion(this, 'HandlerLayer', {
      code: Code.fromAsset(
        path.resolve(__dirname, '../dist/apps/apigateway/node_modules')
      ),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
      description: 'Api Handler Dependencies',
    });

    // Define the Lambda function that will handle API requests
    const handler = new Function(this, 'Handler', {
      code: Code.fromAsset(path.resolve(__dirname, '../dist/apps/apigateway'), {
        exclude: ['node_modules'],
      }),
      functionName: 'ApiGateway', // Name of the Lambda function
      handler: 'main.api', // Entry point for the Lambda function
      layers: [lambdaLayer], // Attach the previously defined Lambda Layer
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(20), // Set a 20-second execution timeout
      environment: {
        NODE_PATH: '$NODE_PATH:/opt', // Configure the NODE_PATH environment variable
        ENV: configService.get<string>(ENV), // Get the environment from the ConfigService
        QUOTES_gRPC_URL: configService.get<string>(QUOTES_gRPC_URL), // Get the gRPC URL from the ConfigService
      },
    });

    // Create an AWS Lambda REST API, serving as the API Gateway
    new LambdaRestApi(this, 'Api', {
      handler: handler, // Attach the Lambda function as the handler
      proxy: true, // Enable proxy mode to forward requests to the Lambda function
    });
  }
}

```

- `gRPC-to-http.exception.ts` - *This file defines a NestJS interceptor called *gRPCToHttpInterceptor* that transforms errors from a gRPC call into HTTP exceptions.*
```typescript
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HTTP_CODE_FROM_gRPC } from '@types';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class gRPCToHttpInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<Error> | Promise<Observable<Error>> {
    return next.handle().pipe(
      catchError((err) => {
        const statusCode =
          HTTP_CODE_FROM_gRPC[err.code] || HttpStatus.INTERNAL_SERVER_ERROR;

        let message;
        try {
          const exception = JSON.parse(err.details);
          if (exception.error) {
            message = exception.error;
          }
        } catch (jsonError) {
          message = err.details;
        }

        return throwError(
          () =>
            new HttpException(
              {
                message,
                statusCode,
                error: HttpStatus[statusCode],
              },
              statusCode,
              {
                cause: err,
              }
            )
        );
      })
    );
  }
}
```

- `project.json` - *The file in the Nx workspace configuration specifies the build and deployment settings for the "apigateway" project. 
  <br><br>Additionally, three custom commands for `deploying`, `destroying`, and `bootstrapping` the application have been added, with custom executors to be defined later. 
  <br><br>The `generatePackageJson` option is set to true in the build configurations to generate a minimal package.json file for the apigateway app to include its necessary dependencies located in the node_modules directory.*

```json
"build": {
  "executor": "@nrwl/webpack:webpack",
  "outputs": ["{options.outputPath}"],
  "options": {
    "target": "node",
    "compiler": "tsc",
    "outputPath": "apps/apigateway/dist/apps/apigateway",
    "main": "apps/apigateway/src/main.ts",
    "tsConfig": "apps/apigateway/tsconfig.app.json",
    "assets": [ // Configuration for assets
      {
        "glob": "*.proto", // Include .proto files
        "input": "libs/proto/src", // Source directory for .proto files
        "output": "/" // Destination directory in the build output
      }
    ]
  },
  "configurations": {
    "development": {
      // Generate a package.json file for production in order to have separate and be able to install only required
      // packages for lambda
      "generatePackageJson": true
    },
    "production": {
      "generatePackageJson": true
    }
  }
},
"deploy": { // Command for deploying the AWS CDK application
  "executor": "./libs/apigateway-cdk:deploy",
  "options": {}
},
"destroy": { // Command for destroying the AWS CDK application
  "executor": "./libs/apigateway-cdk:destroy",
  "options": {}
},
"bootstrap": { // Command for bootstrapping the AWS CDK application
  "executor": "./libs/apigateway-cdk:bootstrap",
  "options": {}
},
```

### LIBS

In the `libs` folder of this NX monorepo, the code is organized into sub-projects designed for specific purposes:

- `apigateway-cdk`: Contains custom build executors for streamlining AWS API Gateway deployments using AWS CDK, offering commands for building, deploying, and destroying the CDK stack.

- `proto`: Houses Protocol Buffers (protobuf) files defining gRPC service contracts used in this project.

- `types`: Provides TypeScript code for mapping gRPC status codes to corresponding HTTP status codes, aiding in gRPC response handling in a Nest.js application.

`bootstrap/executor.ts` - *It builds the "apigateway" project, installs its dependencies using npm ci, and bootstraps an AWS CDK stack for deployment while logging progress and handling potential errors.*

```
# Generate custom executor
nx generate @nx/plugin:executor bootstrap --project=libs/apigateway-cdk
```

```
# Bootstrap project
nx bootstrap apigateway --configurations production

# Deploy project
nx deploy apigateway --configurations production

# Destroy project
nx destroy apigateway --configurations production
```

**executor.ts**
```typescript
import { ExecutorContext, logger } from '@nrwl/devkit';
import * as childProcess from 'child_process';

// Define an async function for the deployment executor
export default async function deployExecutor(
  options: any,
  context: ExecutorContext
) {
  try {
    const configuration = options.configurations;

    // Log a message indicating the project is being built
    logger.info('Building the project...');
    runCommand(
      `nx build apigateway -c ${configuration}`,
      context.cwd
    );

    process.chdir(context.cwd);

    // Log a message indicating that dependencies are being installed
    logger.info('Installing dependencies...');
    runCommand(
      'npm install --legacy-peer-deps',
      'apps/apigateway/dist/apps/apigateway'
    );

    // Log a message indicating that the AWS CDK stack is being bootstrapped
    logger.info('Bootstrapping AWS CDK stack...');
    runCommand(`CONFIGURATION=${configuration} cdk bootstrap`, 'apps/apigateway');

    // Return a success status
    return { success: true };
  } catch (error) {
    // Log an error message if deployment fails and return a failure status
    logger.error('Deployment failed:');
    return { success: false };
  }
}

// Define a function to run a shell command
function runCommand(command: string, cwd: string) {
  childProcess.execSync(command, { cwd, stdio: 'inherit' });
}
```

- **proto** - *This folder contains proto files used for gRPC*

```
nx build proto
```

**project.json** - *Custom build command*
```json
"build": {
  "executor": "nx:run-commands",
  "options": {
    // Define the command for generating TypeScript files from .proto definitions
    "command": "protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./ --ts_proto_opt=nestJs=true ./libs/proto/src/*.proto"
  }
}
```

**quotes.proto**

```proto
syntax = "proto3";

package quote;

// Define a gRPC service called "QuoteService"
service QuoteService {
  // RPC method to get a random quote, returning a "Quote" message
  rpc GetRandomQuote (Empty) returns (Quote) {}

  // RPC method to get a page of quotes, returning a stream of "GetPageResponse" messages
  rpc GetPage (Empty) returns (stream GetPageResponse);

  // RPC method to get an error response, returning an "Empty" message
  rpc GetError (Empty) returns (Empty);
}

// Define an "Empty" message, which represents an empty message
message Empty {};

// Define a "Quote" message with fields "id" and "quote"
message Quote {
  string id = 1;
  string quote = 2;
}

// Define a "GetPageResponse" message with a field "html_chunk"
message GetPageResponse {
  string html_chunk = 1;
}
```

- **types** - *This folder contains gRPC status map to HTTP status codes*

**gRPC-to-http-code.ts**
```typescript
import { status as Status } from "@grpc/grpc-js";
import { HttpStatus } from "@nestjs/common";

// Define a mapping to translate gRPC status codes to corresponding HTTP status codes
export const HTTP_CODE_FROM_gRPC: Record<number, number> = {
  [Status.OK]: HttpStatus.OK,
  [Status.CANCELLED]: HttpStatus.METHOD_NOT_ALLOWED,
  [Status.UNKNOWN]: HttpStatus.BAD_GATEWAY,
  [Status.INVALID_ARGUMENT]: HttpStatus.UNPROCESSABLE_ENTITY,
  [Status.DEADLINE_EXCEEDED]: HttpStatus.REQUEST_TIMEOUT,
  [Status.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [Status.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [Status.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [Status.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
  [Status.FAILED_PRECONDITION]: HttpStatus.PRECONDITION_REQUIRED,
  [Status.ABORTED]: HttpStatus.METHOD_NOT_ALLOWED,
  [Status.OUT_OF_RANGE]: HttpStatus.PAYLOAD_TOO_LARGE,
  [Status.UNIMPLEMENTED]: HttpStatus.NOT_FOUND,
  [Status.INTERNAL]: HttpStatus.BAD_REQUEST,
  [Status.UNAVAILABLE]: HttpStatus.BAD_GATEWAY,
  [Status.DATA_LOSS]: HttpStatus.INTERNAL_SERVER_ERROR,
  [Status.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
};
```

# Protocol Buffer Compiler Installation

[Compiler installation documentation](https://grpc.io/docs/protoc-installation/)

## Linux

```
sudo apt-get update
sudo apt-get install protobuf-compiler
```

## MacOS
```
brew install protobuf
```

# AWS CLI

[Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

```
aws --version
aws configure (access key, secret key, region)
```

# Run project locally
```
npm install
nx serve apigateway
nx serve quotes
```

# Watch Error logs from the lambda function
```
aws logs filter-log-events --log-group-name /aws/lambda/ApiGateway --filter-pattern "ERROR"
```

# GET Requests
```
/GET localhost:3400/page
/GET localhost:3400/quote
/GET localhost:3400/error
```

# Requirements
Node >=18.0.0

```
# Linux/MacOS
nvm install --lts
```
