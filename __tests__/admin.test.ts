/**
 * @jest-environment node
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

describe("Admin Permissions", () => {
  let adminId: string
  let studentId: string
  let mentorId: string
  let internshipId: string
  let applicationId: string

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("test123", 10)

    const admin = await prisma.user.create({
      data: {
        email: "admin-test@example.com",
        passwordHash: hashedPassword,
        name: "Admin Test",
        role: "ADMIN",
      },
    })
    adminId = admin.id

    const student = await prisma.user.create({
      data: {
        email: "student-test@example.com",
        passwordHash: hashedPassword,
        name: "Student Test",
        role: "STUDENT",
      },
    })
    studentId = student.id

    const mentor = await prisma.user.create({
      data: {
        email: "mentor-test@example.com",
        passwordHash: hashedPassword,
        name: "Mentor Test",
        role: "MENTOR",
      },
    })
    mentorId = mentor.id

    const internship = await prisma.microInternship.create({
      data: {
        title: "Admin Test Internship",
        description: "Test",
        durationInWeeks: 4,
        tags: "Test",
        status: "PUBLISHED",
        ownerId: adminId,
      },
    })
    internshipId = internship.id

    const application = await prisma.application.create({
      data: {
        studentId,
        microInternshipId: internshipId,
        motivation: "Test motivation",
        status: "SUBMITTED",
      },
    })
    applicationId = application.id
  })

  afterAll(async () => {
    await prisma.mentorAssignment.deleteMany({
      where: { applicationId },
    })
    await prisma.application.delete({ where: { id: applicationId } })
    await prisma.microInternship.delete({ where: { id: internshipId } })
    await prisma.user.deleteMany({
      where: {
        email: { contains: "-test@example.com" },
      },
    })
    await prisma.$disconnect()
  })

  test("admin should be able to change application status", async () => {
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "REVIEWED",
        reviewedAt: new Date(),
      },
    })

    expect(updated.status).toBe("REVIEWED")
  })

  test("admin should be able to assign mentor", async () => {
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "MENTOR_ASSIGNED",
        mentorAssignedAt: new Date(),
      },
    })

    const assignment = await prisma.mentorAssignment.create({
      data: {
        mentorId,
        applicationId,
        slaMode: "LIGHT",
      },
    })

    expect(assignment).toBeDefined()
    expect(assignment.mentorId).toBe(mentorId)
    expect(assignment.applicationId).toBe(applicationId)
  })
})

