import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SparqlModule } from './sparql';
import { ApiStatsModule } from './api_stats';

@Module({
  imports: [
    SparqlModule.forRoot('http://sparql.southgreen.fr'), // TODO
    ApiStatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
