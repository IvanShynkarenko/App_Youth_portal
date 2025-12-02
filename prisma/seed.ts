import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@ngo.org" },
    update: {},
    create: {
      email: "admin@ngo.org",
      passwordHash: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      city: "Kyiv",
      interests: "Education,Youth Development",
    },
  })

  const mentor = await prisma.user.upsert({
    where: { email: "mentor@company.com" },
    update: {},
    create: {
      email: "mentor@company.com",
      passwordHash: hashedPassword,
      name: "Maria Petrenko",
      role: "MENTOR",
      city: "Kyiv",
      interests: "IT,Software Development,Web Development",
      linkedinUrl: "https://linkedin.com/in/maria-petrenko",
    },
  })

  const student = await prisma.user.upsert({
    where: { email: "andriy@example.com" },
    update: {},
    create: {
      email: "andriy@example.com",
      passwordHash: hashedPassword,
      name: "Andriy Kovalenko",
      role: "STUDENT",
      city: "Kyiv",
      interests: "IT,Web Development,JavaScript",
      portfolioUrl: "https://github.com/andriy-kovalenko",
    },
  })

  console.log("✅ Created users")

  // Create artifact templates
  const cvTemplate = await prisma.artifactTemplate.create({
    data: {
      name: "CV Bullet Point",
      description: "Template for writing a professional CV bullet point",
      body: `**Role:** [Your Role]
**Company/Project:** [Company/Project Name]
**Duration:** [Duration]

**Achievement:**
- [What you did - use action verbs]
- [Impact/Result - quantify if possible]

**Skills:** [Relevant skills used]`,
    },
  })

  const readmeTemplate = await prisma.artifactTemplate.create({
    data: {
      name: "GitHub README",
      description: "Template for a professional project README",
      body: `# [Project Name]

## Description
[Brief description of your project]

## Features
- [Feature 1]
- [Feature 2]

## Technologies Used
- [Technology 1]
- [Technology 2]

## Installation
\`\`\`
[Installation instructions]
\`\`\`

## Usage
[How to use the project]

## Learning Outcomes
- [What you learned]
- [Challenges overcome]`,
    },
  })

  const caseStudyTemplate = await prisma.artifactTemplate.create({
    data: {
      name: "Case Study One-Pager",
      description: "Template for a case study document",
      body: `# Case Study: [Project Name]

## Problem Statement
[What problem were you solving?]

## Solution
[How did you approach the problem?]

## Implementation
[What did you build?]

## Results
[What were the outcomes?]

## Reflection
[What did you learn? What would you do differently?]`,
    },
  })

  console.log("✅ Created artifact templates")

  // Create micro-internships
  const webDevInternship = await prisma.microInternship.create({
    data: {
      title: "Web Development Fundamentals",
      description:
        "Learn modern web development by building a real-world project. You'll work with React, TypeScript, and modern tooling while receiving mentorship from industry professionals.",
      durationInWeeks: 4,
      tags: "IT,Web Development,React,TypeScript",
      status: "PUBLISHED",
      ownerId: admin.id,
      weeklyPlans: {
        create: [
          {
            weekNumber: 1,
            title: "Project Setup & Planning",
            description:
              "Set up your development environment and plan your project structure.",
            deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            tasks: {
              create: [
                {
                  title: "Environment Setup",
                  description:
                    "Install Node.js, VS Code, and set up your Git repository.",
                  type: "LEARNING",
                },
                {
                  title: "Project Planning Document",
                  description:
                    "Create a project plan document outlining your goals and timeline.",
                  type: "PRACTICAL",
                  artifactTemplateId: caseStudyTemplate.id,
                },
              ],
            },
          },
          {
            weekNumber: 2,
            title: "Core Development",
            description: "Build the core features of your application.",
            deadlineAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            tasks: {
              create: [
                {
                  title: "Implement Core Features",
                  description:
                    "Build the main functionality of your web application.",
                  type: "PRACTICAL",
                },
                {
                  title: "Weekly Reflection",
                  description:
                    "Reflect on what you learned this week and challenges you faced.",
                  type: "REFLECTION",
                },
              ],
            },
          },
          {
            weekNumber: 3,
            title: "Enhancement & Testing",
            description: "Add polish and test your application.",
            deadlineAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            tasks: {
              create: [
                {
                  title: "Add Tests",
                  description: "Write unit tests for your application.",
                  type: "PRACTICAL",
                },
                {
                  title: "Code Review Preparation",
                  description:
                    "Prepare your code for review and document your work.",
                  type: "PRACTICAL",
                },
              ],
            },
          },
          {
            weekNumber: 4,
            title: "Final Portfolio Piece",
            description: "Create your final portfolio artifact and presentation.",
            deadlineAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
            tasks: {
              create: [
                {
                  title: "GitHub README",
                  description:
                    "Create a professional README for your project repository.",
                  type: "PRACTICAL",
                  artifactTemplateId: readmeTemplate.id,
                },
                {
                  title: "Final Reflection",
                  description:
                    "Write a comprehensive reflection on your internship experience.",
                  type: "REFLECTION",
                },
              ],
            },
          },
        ],
      },
    },
  })

  const marketingInternship = await prisma.microInternship.create({
    data: {
      title: "Digital Marketing Essentials",
      description:
        "Learn digital marketing strategies and tools while working on real campaigns for NGO partners.",
      durationInWeeks: 6,
      tags: "Marketing,Digital Marketing,Social Media,Content Creation",
      status: "PUBLISHED",
      ownerId: admin.id,
      weeklyPlans: {
        create: [
          {
            weekNumber: 1,
            title: "Marketing Fundamentals",
            description: "Learn the basics of digital marketing.",
            tasks: {
              create: [
                {
                  title: "Marketing Strategy Research",
                  description:
                    "Research and document 3 successful marketing campaigns.",
                  type: "LEARNING",
                },
              ],
            },
          },
        ],
      },
    },
  })

  console.log("✅ Created micro-internships")

  // Create applications
  const application1 = await prisma.application.create({
    data: {
      studentId: student.id,
      microInternshipId: webDevInternship.id,
      motivation:
        "- Passionate about web development\n- Want to build real projects\n- Ready to learn and contribute",
      interests: "IT,Web Development,React",
      city: "Kyiv",
      portfolioUrl: "https://github.com/andriy-kovalenko",
      status: "IN_PROGRESS",
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      mentorAssignedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      mentorAssignment: {
        create: {
          mentorId: mentor.id,
          availabilitySlots: ["Tue 18:00-20:00", "Thu 17:00-19:00"],
          slaMode: "LIGHT",
        },
      },
    },
  })

  const application2 = await prisma.application.create({
    data: {
      studentId: student.id,
      microInternshipId: marketingInternship.id,
      motivation:
        "- Interested in marketing\n- Want to help NGOs\n- Creative and organized",
      status: "SUBMITTED",
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  console.log("✅ Created applications")

  // Create some task progress
  const weeklyPlan1 = await prisma.weeklyPlan.findFirst({
    where: { microInternshipId: webDevInternship.id, weekNumber: 1 },
    include: { tasks: true },
  })

  if (weeklyPlan1 && weeklyPlan1.tasks.length > 0) {
    await prisma.taskProgress.create({
      data: {
        taskId: weeklyPlan1.tasks[0].id,
        studentId: student.id,
        status: "APPROVED",
        artifactUrl: "https://github.com/andriy-kovalenko/project-setup",
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    })

    await prisma.taskProgress.create({
      data: {
        taskId: weeklyPlan1.tasks[1].id,
        studentId: student.id,
        status: "SUBMITTED",
        artifactUrl: "https://docs.google.com/document/d/example",
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    })
  }

  console.log("✅ Created task progress")

  // Create some feedback
  if (weeklyPlan1 && weeklyPlan1.tasks.length > 0) {
    const taskProgress = await prisma.taskProgress.findFirst({
      where: { studentId: student.id, taskId: weeklyPlan1.tasks[1].id },
    })

    if (taskProgress) {
      await prisma.feedback.create({
        data: {
          authorId: mentor.id,
          taskProgressId: taskProgress.id,
          text: "Great work on the project plan! Consider adding more detail about the technical stack you'll use.",
        },
      })
    }
  }

  console.log("✅ Created feedback")

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: student.id,
      type: "APPLICATION_STATUS_CHANGED",
      payload: {
        applicationId: application1.id,
        newStatus: "IN_PROGRESS",
        message: "Your application has been accepted!",
      },
    },
  })

  console.log("✅ Created notifications")

  console.log("🎉 Seeding completed!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

