import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { ApiModule } from '@api/api.module';
import { DataStoreModule } from '@datastore/datastore.module';
import { CronModule } from '@workers/cron/cron.module';
import { environmentConfig } from '@config/environment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
    }),
    DataStoreModule.forRoot(),
    ApiModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}