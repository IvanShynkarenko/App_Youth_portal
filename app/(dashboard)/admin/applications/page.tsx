import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

async function getApplications(status?: string) {
  return await prisma.application.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
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
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const applications = await getApplications(searchParams.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Applications Management</h1>
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <Link href="/admin/applications">
              <Button variant={!searchParams.status ? "default" : "outline"}>
                All
              </Button>
            </Link>
            <Link href="/admin/applications?status=SUBMITTED">
              <Button
                variant={searchParams.status === "SUBMITTED" ? "default" : "outline"}
              >
                Pending
              </Button>
            </Link>
            <Link href="/admin/applications?status=IN_PROGRESS">
              <Button
                variant={searchParams.status === "IN_PROGRESS" ? "default" : "outline"}
              >
                In Progress
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {applications.length} Application{applications.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">Internship</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Mentor</th>
                      <th className="text-left p-2">Submitted</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b">
                        <td className="p-2">{app.student.name}</td>
                        <td className="p-2">{app.microInternship.title}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              app.status === "SUBMITTED"
                                ? "bg-yellow-100 text-yellow-800"
                                : app.status === "IN_PROGRESS"
                                ? "bg-green-100 text-green-800"
                                : app.status === "COMPLETED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-2">
                          {app.mentorAssignment?.mentor.name || "Not assigned"}
                        </td>
                        <td className="p-2">{formatDate(app.submittedAt)}</td>
                        <td className="p-2">
                          <Link href={`/admin/applications/${app.id}`}>
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

