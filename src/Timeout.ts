import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

interface HandleTimeoutOpts {
  redisClient: RedisClient;
  /*
   * @default 30000
   */
  duration?: number;
}

const queuedJobs = new Map<string, NodeJS.Timeout>();

export async function handleTimeout(opts: HandleTimeoutOpts) {
  const redisClient = opts.redisClient;
  const sub = redisClient.duplicate();
  await sub.connect();

  sub.subscribe("mimiqueue", async (message) => {
    const payload = JSON.parse(message) as [
      "start" | "finish",
      string,
      string,
      string
    ]; // [action, name, id, groupName?]

    if (payload[0] === "start") {
      const name = payload[1];
      const id = payload[2];

      queuedJobs.set(
        `${name}${id}`,
        setTimeout(async () => {
          const removeJobPayload = JSON.stringify([
            "remove",
            payload[1],
            payload[2],
            payload[3],
          ]);
          redisClient.publish("mimiqueue", removeJobPayload);
          await removeActiveJob(redisClient, name, id, payload[3]);
          const latestJob = await getAndMoveLatestWaitingJobToActive(
            redisClient,
            payload[1],
            payload[3]
          );
          if (!latestJob) return;
          const newPayload = JSON.stringify([
            "start",
            payload[1],
            latestJob.id,
            payload[3],
          ]);
          redisClient.publish("mimiqueue", newPayload);
        }, opts.duration || 30000)
      );
    }

    if (payload[0] === "finish") {
      const name = payload[1];
      const id = payload[2];
      const timeoutId = queuedJobs.get(`${name}${id}`);
      clearTimeout(timeoutId);
      queuedJobs.delete(`${name}${id}`);
    }
  });
}

async function removeWaitingJob(
  redisClient: RedisClient,
  queueName: string,
  id: string,
  groupName?: string
) {
  let key = `mimiqueue:${queueName}`;
  if (groupName) key += `:${groupName}`;
  key += ":wait";
  return redisClient.lRem(key, 1, id.toString());
}

async function getAndMoveLatestWaitingJobToActive(
  redisClient: RedisClient,
  queueName: string,
  groupName?: string
) {
  let key = `mimiqueue:${queueName}`;
  if (groupName) key += `:${groupName}`;
  key += ":wait";
  const id = await redisClient.lIndex(key, 0);
  if (!id) return null;
  const activeJob = getJobById(redisClient, queueName, id, groupName);
  if (!activeJob) return null;

  await removeWaitingJob(redisClient, queueName, id, groupName);
  await addJobToActive(redisClient, queueName, id, groupName);
  return { job: activeJob, id };
}

async function getJobById(
  redisClient: RedisClient,
  queueName: string,
  id: string,
  groupName?: string
) {
  let key = `mimiqueue:${queueName}`;
  if (groupName) key += `:${groupName}`;

  return redisClient.hGetAll(`${key}:${id.toString()}`);
}

function addJobToActive(
  redisClient: RedisClient,
  queueName: string,
  id: number | string,
  groupName?: string
) {
  let key = `mimiqueue:${queueName}`;
  if (groupName) key += `:${groupName}`;
  key += ":active";

  return redisClient.set(key, id.toString());
}

function removeActiveJob(
  redisClient: RedisClient,
  queueName: string,
  id: number | string,
  groupName?: string
) {
  let key = `mimiqueue:${queueName}`;
  if (groupName) key += `:${groupName}`;
  key += ":active";

  return redisClient.del(key);
}
