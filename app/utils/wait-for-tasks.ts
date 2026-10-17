import { type Meilisearch, MeilisearchRequestTimeOutError, type Task } from 'meilisearch'

export const TASK_POLL_INTERVAL_MS = 2000
// Keeps the `uids` query string comfortably short
const UIDS_PER_REQUEST = 100

type WaitForTasksOptions = {
  timeout?: number
  interval?: number
}

export const isPendingTask = (task: Pick<Task, 'status'>) => ['enqueued', 'processing'].includes(task.status)

/**
 * Fetches the given tasks with `GET /tasks?uids=…`, a single request per `UIDS_PER_REQUEST` tasks,
 * instead of one `GET /tasks/:uid` per task.
 */
export const fetchTasksByUids = async (meili: Meilisearch, uids: number[]): Promise<Task[]> => {
  const tasks: Task[] = []
  for (let i = 0; i < uids.length; i += UIDS_PER_REQUEST) {
    const chunk = uids.slice(i, i + UIDS_PER_REQUEST)
    tasks.push(...(await meili.tasks.getTasks({ uids: chunk, limit: chunk.length })).results)
  }
  return tasks
}

/**
 * Resolves with the final state of every given task (same order as `uids`), polling them all together
 * every `interval` ms rather than each on its own.
 */
export const waitForTasks = async (
  meili: Meilisearch,
  uids: number[],
  { timeout = 3600 * 1000, interval = TASK_POLL_INTERVAL_MS }: WaitForTasksOptions = {},
): Promise<Task[]> => {
  const deadline = Date.now() + timeout
  const settled = new Map<number, Task>()
  let pendingUids = [...new Set(uids)]
  while (pendingUids.length > 0) {
    for (const task of await fetchTasksByUids(meili, pendingUids)) {
      if (!isPendingTask(task)) {
        settled.set(task.uid, task)
      }
    }
    pendingUids = pendingUids.filter((uid) => !settled.has(uid))
    if (pendingUids.length === 0) {
      break
    }
    if (Date.now() + interval > deadline) {
      throw new MeilisearchRequestTimeOutError(timeout, {})
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  return uids.map((uid) => settled.get(uid)!)
}

export const waitForTask = async (meili: Meilisearch, uid: number, options?: WaitForTasksOptions): Promise<Task> =>
  (await waitForTasks(meili, [uid], options))[0]!
