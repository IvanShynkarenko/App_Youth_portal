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

    if (!session || session.user.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, feedback } = body

    if (!action || !["approve", "request_changes"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    const taskProgress = await prisma.taskProgress.findUnique({
      where: { id: params.id },
      include: {
        task: true,
        student: true,
      },
    })

    if (!taskProgress) {
      return NextResponse.json(
        { error: "Task progress not found" },
        { status: 404 }
      )
    }

    // Verify mentor has access
    const assignment = await prisma.mentorAssignment.findFirst({
      where: {
        mentorId: session.user.id,
        application: {
          studentId: taskProgress.studentId,
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update task progress status
    const newStatus = action === "approve" ? "APPROVED" : "IN_PROGRESS"

    await prisma.taskProgress.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        approvedAt: action === "approve" ? new Date() : null,
      },
    })

    // Create feedback if provided
    if (feedback) {
      await prisma.feedback.create({
        data: {
          authorId: session.user.id,
          taskProgressId: params.id,
          text: feedback,
        },
      })
    }

    // Update SLA metrics
    await prisma.mentorAssignment.update({
      where: { id: assignment.id },
      data: {
        totalReplies: { increment: 1 },
        onTimeReplies: { increment: 1 }, // Simplified - could check if within 48h
      },
    })

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: taskProgress.studentId,
        type: "FEEDBACK_RECEIVED",
        payload: {
          taskProgressId: params.id,
          taskTitle: taskProgress.task.title,
          status: newStatus,
          message:
            action === "approve"
              ? "Your task has been approved!"
              : "Your mentor requested changes.",
        },
      },
    })

    return NextResponse.json({
      message: "Review submitted successfully",
    })
  } catch (error) {
    console.error("Error reviewing task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

