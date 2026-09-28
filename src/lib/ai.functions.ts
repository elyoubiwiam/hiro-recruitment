import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callAI } from "./ai.server";

export const runAI = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        task: z.enum(["parse_cv", "match", "outreach", "synthesize"]),
        payload: z.any(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    return (await callAI(data.task, data.payload)) as any;
  });
