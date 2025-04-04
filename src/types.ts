import { createClient } from "redis";
export type RedisClient = ReturnType<typeof createClient>;

export interface AddEvent {
  event: "add";
  id: string;
  groupName?: string;
  name: string;
}

export interface StartEvent {
  event: "start";
  id: string;
  groupName?: string;
  name: string;
}
export interface FinishEvent {
  event: "finish";
  id: string;
  groupName?: string;
  name: string;
}
export interface OptionsEvent {
  event: "options";
  name: string;
  minTime?: number;
}

export type Event = AddEvent | StartEvent | FinishEvent | OptionsEvent;
