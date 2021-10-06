#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'monocdk';
import { TelegramBotStack } from '../cdk/telegram-bot-stack';

const app = new App();
new TelegramBotStack(app, 'TelegramBotStack');
