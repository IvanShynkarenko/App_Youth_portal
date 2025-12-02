import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"

async function getInternship(id: string) {
  return await prisma.microInternship.findUnique({
    where: { id },
    include: {
      weeklyPlans: {
        orderBy: { weekNumber: "asc" },
        include: {
          tasks: true,
        },
      },
    },
  })
}

export default async function InternshipDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const internship = await getInternship(params.id)

  if (!internship || internship.status !== "PUBLISHED") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to internships
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    {internship.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {internship.durationInWeeks} weeks • {internship.tags}
                  </CardDescription>
                </div>
                <Link href={`/internships/${internship.id}/apply`}>
                  <Button size="lg">Apply Now</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed whitespace-pre-line">
                  {internship.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Plan</CardTitle>
              <CardDescription>
                What you'll be working on each week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {internship.weeklyPlans.map((week) => (
                  <div key={week.id} className="border-l-4 border-primary pl-4">
                    <h3 className="text-xl font-semibold mb-2">
                      Week {week.weekNumber}: {week.title}
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      {week.description}
                    </p>
                    {week.tasks.length > 0 && (
                      <div className="ml-4 space-y-2">
                        {week.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-primary">•</span>
                            <div>
                              <span className="font-medium">{task.title}</span>
                              <span className="text-muted-foreground ml-2">
                                ({task.type})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href={`/internships/${internship.id}/apply`}>
              <Button size="lg">Apply for this Internship</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

