import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Handler, Context, Callback } from 'aws-lambda' // Vercel использует AWS-совместимый формат
import * as cookieParser from 'cookie-parser'
import { ExpressAdapter } from '@nestjs/platform-express'
import * as express from 'express'

let cachedServer: any

async function bootstrapServer() {
	const expressApp = express()
	const app = await NestFactory.create(
		AppModule,
		new ExpressAdapter(expressApp)
	)

	app.use(cookieParser())
	app.enableCors({
		origin: process.env.CLIENT_URL,
		credentials: true,
		exposedHeaders: ['set-cookie']
	})

	await app.init()
	return expressApp
}

export const handler: Handler = async (
	event: any,
	context: Context,
	callback: Callback
) => {
	if (!cachedServer) {
		cachedServer = await bootstrapServer()
	}
	return cachedServer(event, context, callback)
}
