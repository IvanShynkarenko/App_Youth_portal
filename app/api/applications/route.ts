import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      microInternshipId,
      motivation,
      interests,
      city,
      linkedinUrl,
      portfolioUrl,
    } = body

    if (!microInternshipId || !motivation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if internship exists and is published
    const internship = await prisma.microInternship.findUnique({
      where: { id: microInternshipId },
    })

    if (!internship || internship.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Internship not found or not available" },
        { status: 404 }
      )
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        studentId_microInternshipId: {
          studentId: session.user.id,
          microInternshipId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied for this internship" },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        studentId: session.user.id,
        microInternshipId,
        motivation,
        interests,
        city,
        linkedinUrl,
        portfolioUrl,
        status: "SUBMITTED",
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "APPLICATION_STATUS_CHANGED",
        payload: {
          applicationId: application.id,
          newStatus: "SUBMITTED",
          message: "Your application has been submitted successfully!",
        },
      },
    })

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: application.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Application error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

