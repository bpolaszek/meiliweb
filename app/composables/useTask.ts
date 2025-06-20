import match from 'match-operator'
import { type EnqueuedTask, MeiliSearchRequestTimeOutError, type Task } from 'meilisearch'
import { useMeiliClient } from '~/composables/index'

type EnqueuedTaskPromise = () => Promise<EnqueuedTask>
type ProcessTaskOptions = {
  timeOutMs: number
  onSuccess: (task: Task) => void
  onCanceled: (task: Task) => void
  onFailure: (task: Task) => void
  onTimeout: (e: MeiliSearchRequestTimeOutError, enqueuedTask: EnqueuedTask) => void
}

export class TaskError extends Error {
  constructor(
    message: string,
    public code: string,
    public type: string,
    public link: string,
  ) {
    super(message)
  }
}

const DEFAULT_OPTIONS: ProcessTaskOptions = {
  timeOutMs: 3600 * 1000,
  onSuccess: () => {},
  onCanceled: () => {},
  onFailure: () => {},
  onTimeout: () => {},
}

export const useTask = () => {
  const meili = useMeiliClient()
  return async (
    enqueue: EnqueuedTaskPromise,
    options: Partial<ProcessTaskOptions> = DEFAULT_OPTIONS,
  ): Promise<Task | EnqueuedTask> => {
    const { timeOutMs, onSuccess, onCanceled, onFailure, onTimeout }: ProcessTaskOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
    const enqueuedTask = await enqueue()
    try {
      const task = await meili.tasks.waitForTask(enqueuedTask.taskUid, {
        timeout: timeOutMs,
      })
      if (task.error) {
        task.error = new TaskError(task.error.message, task.error.code, task.error.type, task.error.link)
      }
      const callback = match(task.status, [
        ['succeeded', onSuccess],
        ['canceled', onCanceled],
        ['failed', onFailure],
        [match.default, () => console.debug('Unhandled match for task', task)],
      ])
      callback(task)
      return task
    } catch (e) {
      if (e instanceof MeiliSearchRequestTimeOutError) {
        onTimeout(e, enqueuedTask)
        return enqueuedTask
      }
      throw e
    }
  }
}
