import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const internship = await prisma.microInternship.findUnique({
      where: { id: params.id },
    })

    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(internship)
  } catch (error) {
    console.error("Error fetching internship:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

