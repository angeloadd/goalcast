/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '@fb/app.config';
import { App } from '@fb/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
