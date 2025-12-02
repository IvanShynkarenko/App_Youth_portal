import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        student: true,
        microInternship: true,
        mentorAssignment: {
          include: {
            mentor: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, mentorId, notes } = body

    const application = await prisma.application.findUnique({
      where: { id: params.id },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Update application
    const updateData: any = {
      status,
    }

    if (status === "REVIEWED") {
      updateData.reviewedAt = new Date()
    }

    if (status === "IN_PROGRESS") {
      updateData.startedAt = new Date()
    }

    if (status === "COMPLETED") {
      updateData.completedAt = new Date()
    }

    if (status === "REJECTED" && notes) {
      updateData.rejectionReason = notes
    }

    await prisma.application.update({
      where: { id: params.id },
      data: updateData,
    })

    // Handle mentor assignment - works for any status
    const existingAssignment = await prisma.mentorAssignment.findUnique({
      where: { applicationId: params.id },
    })

    if (mentorId) {
      // Create or update mentor assignment
      await prisma.mentorAssignment.upsert({
        where: { applicationId: params.id },
        update: { mentorId },
        create: {
          mentorId,
          applicationId: params.id,
          slaMode: "LIGHT",
        },
      })

      // Set mentorAssignedAt timestamp if not already set
      if (!application.mentorAssignedAt) {
        await prisma.application.update({
          where: { id: params.id },
          data: { mentorAssignedAt: new Date() },
        })
      }
    } else if (existingAssignment) {
      // Remove mentor assignment if mentorId is empty but assignment exists
      await prisma.mentorAssignment.delete({
        where: { applicationId: params.id },
      })
    }

    // Create notification
    let notificationMessage = `Your application status has been updated to ${status}`
    if (mentorId) {
      const mentor = await prisma.user.findUnique({
        where: { id: mentorId },
        select: { name: true },
      })
      if (mentor) {
        notificationMessage += `. Mentor ${mentor.name} has been assigned to you.`
      }
    }

    await prisma.notification.create({
      data: {
        userId: application.studentId,
        type: "APPLICATION_STATUS_CHANGED",
        payload: {
          applicationId: params.id,
          newStatus: status,
          message: notificationMessage,
        },
      },
    })

    return NextResponse.json({ message: "Application updated successfully" })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

