import { Controller, Get, Res, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { Empty, Quote } from '@proto';
import { Observable } from 'rxjs';
import { Response } from 'aws-serverless-express';
import { gRPCToHttpInterceptor } from './exception';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/quote')
  @UseInterceptors(gRPCToHttpInterceptor)
  getRandomQuote(): Promise<Observable<Quote>> {
    return this.appService.getRandomQuote();
  }

  @Get('/page')
  @UseInterceptors(gRPCToHttpInterceptor)
  getPage(@Res() response: Response): Promise<void> {
    return this.appService.getPage(response);
  }

  @Get('/error')
  @UseInterceptors(gRPCToHttpInterceptor)
  getError(): Promise<Empty> {
    return this.appService.getError();
  }
}
