import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { ProductDto } from './dto/product.dto'

@Injectable()
export class ProductService {
	constructor(private prisma: PrismaService) {}

	async getAll(searchTerm?: string) {
		if (searchTerm) return this.getSearchTermFilter(searchTerm)

		return this.prisma.product.findMany({
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				category: true
			}
		})
	}

	private async getSearchTermFilter(searchTerm: string) {
		return this.prisma.product.findMany({
			where: {
				OR: [
					{
						title: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					},
					{
						description: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				]
			},
			include: {
				category: true
			}
		})
	}

	async getByStoreId(storeId: string) {
		return this.prisma.product.findMany({
			where: {
				storeId
			},
			include: {
				category: true,
				color: true
			}
		})
	}

	async getById(id: string) {
		const product = await this.prisma.product.findUnique({
			where: {
				id
			},
			include: {
				category: true,
				color: true,
				reviews: {
					include: {
						user: true
					}
				}
			}
		})

		if (!product) throw new NotFoundException('Товар не найден')

		return product
	}

	async getByCategory(categoryId: string) {
		const products = await this.prisma.product.findMany({
			where: {
				category: {
					id: categoryId
				}
			},
			include: {
				category: true
			}
		})

		if (!products) throw new NotFoundException('Товары не найдены')

		return products
	}

	async getMostPopular() {
		const mostPopularProducts = await this.prisma.orderItem.groupBy({
			by: ['productId'],
			_count: {
				id: true
			},
			orderBy: {
				_count: {
					id: 'desc'
				}
			}
		})

		const productIds = mostPopularProducts.map(item => item.productId)

		const products = await this.prisma.product.findMany({
			where: {
				id: {
					in: productIds
				}
			},
			include: {
				category: true
			}
		})

		return products
	}

	async getSimilar(id: string) {
		const currentProduct = await this.getById(id)

		if (!currentProduct)
			throw new NotFoundException('Текущий товар не найден')

		const products = await this.prisma.product.findMany({
			where: {
				category: {
					title: currentProduct.category.title
				},
				NOT: {
					id: currentProduct.id
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				category: true
			}
		})

		return products
	}

	async create(storeId: string, dto: ProductDto) {
		return this.prisma.product.create({
			data: {
				title: dto.title,
				description: dto.description,
				price: dto.price,
				images: dto.images,
				categoryId: dto.categoryId,
				colorId: dto.colorId,
				storeId
			}
		})
	}

	async update(id: string, dto: ProductDto) {
		await this.getById(id)

		return this.prisma.product.update({
			where: { id },
			data: dto
		})
	}

	async delete(id: string) {
		await this.getById(id)

		await this.prisma.review.deleteMany({
			where: {
				productId: id
			}
		})

		return this.prisma.product.delete({
			where: { id }
		})
	}
}
