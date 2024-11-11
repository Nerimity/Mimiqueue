import { createClient } from "redis";
export type RedisClient = ReturnType<typeof createClient>;

export interface AddEvent {
  event: "add";
  id: string;
  groupName?: string;
  name: string;
}

export type Event = AddEvent;
