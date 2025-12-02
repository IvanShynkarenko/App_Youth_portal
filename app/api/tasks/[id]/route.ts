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

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        artifactTemplate: true,
        weeklyPlan: {
          include: {
            microInternship: true,
          },
        },
        taskProgresses: {
          where: { studentId: session.user.id },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    // Verify student has access to this task
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

    const result = {
      ...task,
      taskProgress: task.taskProgresses[0] || null,
      internshipId: task.weeklyPlan.microInternship.id,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

