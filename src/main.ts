import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.use(cookieParser())
	app.enableCors({
		origin: process.env.CLIENT_URL,
		credentials: true,
		exposedHeaders: ['set-cookie']
	})

	const PORT = process.env.PORT || 5000 // Добавляем поддержку Render
	await app.listen(PORT, '0.0.0.0') // '0.0.0.0' обязательно для облака
	console.log(`Server started on port ${PORT}`)
}
bootstrap()
