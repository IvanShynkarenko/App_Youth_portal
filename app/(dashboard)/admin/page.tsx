import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

async function getAdminStats() {
  const [
    totalApplications,
    pendingApplications,
    activeInternships,
    totalStudents,
    totalMentors,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: "SUBMITTED" } }),
    prisma.microInternship.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "MENTOR" } }),
  ])

  // Calculate completion rate
  const completedApplications = await prisma.application.count({
    where: { status: "COMPLETED" },
  })
  const startedApplications = await prisma.application.count({
    where: { status: { in: ["IN_PROGRESS", "COMPLETED"] } },
  })
  const completionRate =
    startedApplications > 0
      ? (completedApplications / startedApplications) * 100
      : 0

  return {
    totalApplications,
    pendingApplications,
    activeInternships,
    totalStudents,
    totalMentors,
    completionRate: Math.round(completionRate),
  }
}

async function getRecentApplications() {
  return await prisma.application.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      student: true,
      microInternship: true,
    },
  })
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  const stats = await getAdminStats()
  const recentApplications = await getRecentApplications()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalApplications}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.pendingApplications} pending review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Internships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.activeInternships}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.completionRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {stats.totalStudents} students, {stats.totalMentors} mentors
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/admin/internships">
              <Card className="hover:bg-gray-50 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Manage Internships</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create and edit micro-internships
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/applications">
              <Card className="hover:bg-gray-50 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Review Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Review and assign mentors
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/analytics">
              <Card className="hover:bg-gray-50 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View metrics and reports
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">Internship</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Submitted</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
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
                        <td className="p-2">{formatDate(app.submittedAt)}</td>
                        <td className="p-2">
                          <Link href={`/admin/applications/${app.id}`}>
                            <Button size="sm" variant="outline">
                              View
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

