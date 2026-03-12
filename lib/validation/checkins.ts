import { z } from "zod";

export const materializeCheckinsSchema = z.object({
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime()
});

export const processCheckinsSchema = z.object({
  now: z.string().datetime().optional()
});

export const smsResponseSchema = z.object({
  From: z.string().min(4),
  Body: z.string().min(1),
  MessageSid: z.string().min(8).optional()
});

export const voiceResponseSchema = z.object({
  CallSid: z.string().min(8),
  Digits: z.string().optional(),
  From: z.string().min(4).optional()
});
