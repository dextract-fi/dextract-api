import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { ApiModule } from '@api/api.module';
import { DataStoreModule } from '@datastore/datastore.module';
import { CronModule } from '@workers/cron/cron.module';
import appConfig from '@config/app.config';
import apiConfig from '@config/api.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
      load: [appConfig, apiConfig],
    }),
    DataStoreModule.forRoot(),
    ApiModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}