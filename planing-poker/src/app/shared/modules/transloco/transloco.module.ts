import { NgModule } from '@angular/core';
import { getBrowserLang, TRANSLOCO_CONFIG, TRANSLOCO_LOADER, translocoConfig, TranslocoModule as NgTranslocoModule } from '@ngneat/transloco';
import { TranslocoMessageFormatModule } from '@ngneat/transloco-messageformat';
import { TRANSLOCO_PERSIST_LANG_STORAGE, TranslocoPersistLangModule } from '@ngneat/transloco-persist-lang';
import { environment } from '../../../../environments/environment';
import { TranslocoHttpLoader } from './transloco.http-loader';

@NgModule({
  imports: [
    TranslocoPersistLangModule.forRoot({
      storage: {
        provide: TRANSLOCO_PERSIST_LANG_STORAGE,
        useValue: localStorage,
      },
    }),
    TranslocoMessageFormatModule.forRoot()
  ],
  exports: [
    NgTranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en', 'ru'],
        defaultLang: getBrowserLang() || 'ru',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      })
    },
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader },
  ]
})
export class TranslocoModule {}
