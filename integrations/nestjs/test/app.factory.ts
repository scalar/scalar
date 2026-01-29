import { Module } from '@nestjs/common'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'

@Module({})
class AppTestModule {}

export async function createTestApp({ fastify }: { fastify?: boolean } = {}) {
  const moduleRef = await Test.createTestingModule({
    imports: [AppTestModule],
  }).compile()

  const app = fastify ? moduleRef.createNestApplication(new FastifyAdapter()) : moduleRef.createNestApplication()

  return app
}
