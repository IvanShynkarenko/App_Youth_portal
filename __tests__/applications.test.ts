/**
 * @jest-environment node
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

describe("Application Flow", () => {
  let studentId: string
  let internshipId: string
  let applicationId: string

  beforeAll(async () => {
    // Create test student
    const hashedPassword = await bcrypt.hash("test123", 10)
    const student = await prisma.user.create({
      data: {
        email: "test-student@example.com",
        passwordHash: hashedPassword,
        name: "Test Student",
        role: "STUDENT",
      },
    })
    studentId = student.id

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: "test-admin@example.com",
        passwordHash: hashedPassword,
        name: "Test Admin",
        role: "ADMIN",
      },
    })

    // Create test internship
    const internship = await prisma.microInternship.create({
      data: {
        title: "Test Internship",
        description: "Test description",
        durationInWeeks: 4,
        tags: "Test",
        status: "PUBLISHED",
        ownerId: admin.id,
      },
    })
    internshipId = internship.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.application.deleteMany({
      where: { studentId },
    })
    await prisma.microInternship.deleteMany({
      where: { id: internshipId },
    })
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } },
    })
    await prisma.$disconnect()
  })

  test("should create an application", async () => {
    const application = await prisma.application.create({
      data: {
        studentId,
        microInternshipId: internshipId,
        motivation: "- Test motivation\n- Point 2",
        status: "SUBMITTED",
      },
    })

    expect(application).toBeDefined()
    expect(application.status).toBe("SUBMITTED")
    applicationId = application.id
  })

  test("should prevent duplicate applications", async () => {
    await expect(
      prisma.application.create({
        data: {
          studentId,
          microInternshipId: internshipId,
          motivation: "Duplicate",
          status: "SUBMITTED",
        },
      })
    ).rejects.toThrow()
  })

  test("should update application status", async () => {
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "REVIEWED",
        reviewedAt: new Date(),
      },
    })

    expect(updated.status).toBe("REVIEWED")
    expect(updated.reviewedAt).toBeDefined()
  })
})

describe("Student Data Isolation", () => {
  let student1Id: string
  let student2Id: string
  let internshipId: string

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("test123", 10)

    const student1 = await prisma.user.create({
      data: {
        email: "student1@test.com",
        passwordHash: hashedPassword,
        name: "Student 1",
        role: "STUDENT",
      },
    })
    student1Id = student1.id

    const student2 = await prisma.user.create({
      data: {
        email: "student2@test.com",
        passwordHash: hashedPassword,
        name: "Student 2",
        role: "STUDENT",
      },
    })
    student2Id = student2.id

    const admin = await prisma.user.create({
      data: {
        email: "admin2@test.com",
        passwordHash: hashedPassword,
        name: "Admin 2",
        role: "ADMIN",
      },
    })

    const internship = await prisma.microInternship.create({
      data: {
        title: "Test Internship 2",
        description: "Test",
        durationInWeeks: 4,
        tags: "Test",
        status: "PUBLISHED",
        ownerId: admin.id,
      },
    })
    internshipId = internship.id
  })

  afterAll(async () => {
    await prisma.application.deleteMany({
      where: {
        studentId: { in: [student1Id, student2Id] },
      },
    })
    await prisma.microInternship.delete({ where: { id: internshipId } })
    await prisma.user.deleteMany({
      where: { email: { contains: "@test.com" } },
    })
    await prisma.$disconnect()
  })

  test("student should only see their own applications", async () => {
    const app1 = await prisma.application.create({
      data: {
        studentId: student1Id,
        microInternshipId: internshipId,
        motivation: "Student 1 motivation",
        status: "SUBMITTED",
      },
    })

    const app2 = await prisma.application.create({
      data: {
        studentId: student2Id,
        microInternshipId: internshipId,
        motivation: "Student 2 motivation",
        status: "SUBMITTED",
      },
    })

    const student1Apps = await prisma.application.findMany({
      where: { studentId: student1Id },
    })

    expect(student1Apps).toHaveLength(1)
    expect(student1Apps[0].id).toBe(app1.id)
    expect(student1Apps[0].id).not.toBe(app2.id)
  })
})

