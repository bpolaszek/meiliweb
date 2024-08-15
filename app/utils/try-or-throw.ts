import { MeiliSearchApiError } from 'meilisearch'

type PromiseCallback<T> = () => Promise<T>

export const tryOrThrow = async <T>(
  promiseCallback: PromiseCallback<T>,
): Promise<T> => {
  try {
    return await promiseCallback()
  } catch (e) {
    throw createError({
      statusCode: e instanceof MeiliSearchApiError ? e.httpStatus : 400,
      statusMessage: (e as Error).message,
      fatal: true,
    })
  }
}
