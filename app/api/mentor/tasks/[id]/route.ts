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

    if (!session || session.user.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const taskProgress = await prisma.taskProgress.findUnique({
      where: { id: params.id },
      include: {
        task: {
          include: {
            weeklyPlan: true,
          },
        },
        student: true,
        feedbacks: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!taskProgress) {
      return NextResponse.json(
        { error: "Task progress not found" },
        { status: 404 }
      )
    }

    // Verify mentor has access to this student
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

    return NextResponse.json(taskProgress)
  } catch (error) {
    console.error("Error fetching task progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

