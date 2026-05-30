import { prisma } from "@/lib/db/prisma"
import type { TaskType } from "@/lib/queue/taskTypes"

export async function enqueueTask(args: { type: TaskType; payloadJson: unknown; runAfter?: Date }) {
  return prisma.task.create({
    data: {
      type: args.type,
      payloadJson: args.payloadJson as any,
      runAfter: args.runAfter ?? new Date(),
    },
  })
}

