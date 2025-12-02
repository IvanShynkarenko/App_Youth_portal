/**
 * @jest-environment node
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

describe("Authentication", () => {
  let userId: string

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("testpassword123", 10)
    const user = await prisma.user.create({
      data: {
        email: "auth-test@example.com",
        passwordHash: hashedPassword,
        name: "Auth Test User",
        role: "STUDENT",
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  test("should hash password correctly", async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    expect(user?.passwordHash).toBeDefined()
    expect(user?.passwordHash).not.toBe("testpassword123")

    const isValid = await bcrypt.compare("testpassword123", user!.passwordHash)
    expect(isValid).toBe(true)
  })

  test("should reject incorrect password", async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    const isValid = await bcrypt.compare("wrongpassword", user!.passwordHash)
    expect(isValid).toBe(false)
  })
})

