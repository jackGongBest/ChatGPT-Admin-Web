import { CustomPrismaService } from 'nestjs-prisma';

import { Inject, Injectable } from '@nestjs/common';

import { ExtendedPrismaClient } from '@/processors/database/prisma.extension';

@Injectable()
export class UserService {
  constructor(
    @Inject('PrismaService')
    private prisma: CustomPrismaService<ExtendedPrismaClient>,
  ) {}

  async getInfo(userId: number) {
    const user = await this.prisma.client.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        role: true,
        email: true,
        phone: true,
        password: true,
      },
    });
    const currentTime = new Date();
    const activatedOrders = await this.prisma.client.order.findMany({
      where: {
        AND: [
          {
            userId: userId,
          },
          {
            startAt: {
              lte: currentTime,
            },
          },
          {
            endAt: {
              gte: currentTime,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc', // 最近的排在前面
      },
    });

    return {
      ...user,
      todos: [...(!user.password ? ['password'] : [])],
      isPremium: activatedOrders.length > 0,
    };
  }

  async updateName(userId: number, name: string) {
    const user = await this.prisma.client.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
      },
      select: {
        name: true,
      },
    });
    return user;
  }

  async getSettings(userId: number) {
    return this.prisma.client.chatSetting.findUnique({
      where: {
        userId,
      },
    });
  }
}
