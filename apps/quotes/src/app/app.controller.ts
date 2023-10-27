import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import {
  GetPageResponse,
  Quote,
  QuoteServiceController,
  QuoteServiceControllerMethods,
} from '@proto';
import { Observable } from 'rxjs';

@Controller()
@QuoteServiceControllerMethods()
export class AppController implements QuoteServiceController {
  constructor(private readonly appService: AppService) { }

  getRandomQuote(): Quote | Promise<Quote> | Observable<Quote> {
    return this.appService.getRandomQuote();
  }

  getPage(): Observable<GetPageResponse> {
    return this.appService.getPage();
  }

  getError(): Promise<void> {
    return this.appService.getError();
  }
}
