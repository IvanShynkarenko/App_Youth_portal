import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { artifactUrl } = body

    if (!artifactUrl) {
      return NextResponse.json(
        { error: "Artifact URL is required" },
        { status: 400 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        weeklyPlan: {
          include: {
            microInternship: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    // Verify student has access
    const application = await prisma.application.findFirst({
      where: {
        studentId: session.user.id,
        microInternshipId: task.weeklyPlan.microInternship.id,
        status: {
          in: ["IN_PROGRESS", "MENTOR_ASSIGNED"],
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create or update task progress
    const taskProgress = await prisma.taskProgress.upsert({
      where: {
        taskId_studentId: {
          taskId: params.id,
          studentId: session.user.id,
        },
      },
      update: {
        artifactUrl,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      create: {
        taskId: params.id,
        studentId: session.user.id,
        artifactUrl,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    })

    // Create notification for mentor
    if (application.mentorAssignment) {
      await prisma.notification.create({
        data: {
          userId: application.mentorAssignment.mentorId,
          type: "FEEDBACK_RECEIVED",
          payload: {
            taskId: params.id,
            taskProgressId: taskProgress.id,
            studentName: session.user.name,
            message: `${session.user.name} submitted a task for review`,
          },
        },
      })
    }

    return NextResponse.json({
      message: "Task submitted successfully",
      internshipId: task.weeklyPlan.microInternship.id,
    })
  } catch (error) {
    console.error("Error submitting task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

