import { tool } from "@opencode-ai/plugin"
import { promises as fs } from "fs"
import path from "path"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>

export default tool({
  description:
    "Append a completed step to .opencode/pipeline-status.json and update current_step, current_agent, updated_at. Optionally update loops and bypasses. Always produces valid JSON — uses programmatic parsing and serialization via JSON.parse/JSON.stringify.",

  args: {
    step: tool.schema.number().describe("Step number"),
    agent: tool.schema.string().describe("Agent name (e.g. 'pre-ideate', 'critic', 'developer-ui')"),
    status: tool.schema.string().default("completed").describe("Step status"),
    iterations: tool.schema.number().default(1).describe("Number of iterations used for this step"),
    bypassed: tool.schema.boolean().default(false).describe("Whether the step was bypassed"),
    completed_at: tool.schema.string().optional().describe("ISO 8601 timestamp of completion (auto-filled with current time if omitted)"),

    verdict: tool.schema.string().optional().describe("Critic verdict: 'APPROVED' or 'REJECTED'"),
    feedback: tool.schema.string().optional().describe("Detailed feedback from critic"),
    issues_found: tool.schema.array(tool.schema.string()).optional().describe("Issues found by critic"),
    issues_fixed: tool.schema.array(tool.schema.string()).optional().describe("Issues fixed after critic iteration"),

    build_success: tool.schema.boolean().optional().describe("Whether the build passed"),
    artifacts: tool.schema.array(tool.schema.string()).optional().describe("Artifacts produced by this step"),

    agents_called: tool.schema.array(tool.schema.string()).optional().describe("Sub-agents called by a phase manager"),
    agents_skipped: tool.schema.array(tool.schema.string()).optional().describe("Sub-agents skipped by a phase manager"),

    loop_name: tool.schema.string().optional().describe("Name of the loop to update (e.g. 'idea', 'architecture', 'design', 'code_phase1', 'code_phase2', 'options', 'quality', 'compliance')"),
    loop_iterations: tool.schema.number().optional().describe("Explicit loop iteration count (if omitted, increments by 1 when loop_name is set)"),
    loop_bypassed: tool.schema.boolean().optional().describe("Whether the loop is bypassed"),
    loop_status: tool.schema.string().optional().describe("Loop status (e.g. 'approved', 'rejected')"),

    bypass_agent: tool.schema.string().optional().describe("Agent name to add to the bypasses array"),
  },

  async execute(args, context) {
    const filePath = path.join(context.worktree, ".opencode", "pipeline-status.json")

    let raw: string
    try {
      raw = await fs.readFile(filePath, "utf-8")
    } catch {
      return `❌ File not found: ${filePath}`
    }

    let data: JsonObject
    try {
      data = JSON.parse(raw) as JsonObject
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return `❌ Invalid JSON in ${filePath}: ${msg}`
    }

    if (!data.completed_steps) {
      data.completed_steps = []
    }

    const completedAt = args.completed_at || new Date().toISOString()

    const stepObj: JsonObject = {
      step: args.step,
      agent: args.agent,
      status: args.status,
      iterations: args.iterations,
      bypassed: args.bypassed,
      completed_at: completedAt,
    }

    if (args.verdict !== undefined) stepObj.verdict = args.verdict
    if (args.feedback !== undefined) stepObj.feedback = args.feedback
    if (args.issues_found !== undefined) stepObj.issues_found = args.issues_found
    if (args.issues_fixed !== undefined) stepObj.issues_fixed = args.issues_fixed
    if (args.build_success !== undefined) stepObj.build_success = args.build_success
    if (args.artifacts !== undefined) stepObj.artifacts = args.artifacts
    if (args.agents_called !== undefined) stepObj.agents_called = args.agents_called
    if (args.agents_skipped !== undefined) stepObj.agents_skipped = args.agents_skipped

    data.completed_steps.push(stepObj)
    data.current_step = args.step
    data.current_agent = args.agent
    data.updated_at = completedAt

    if (args.loop_name) {
      if (!data.loops) data.loops = {}
      if (!data.loops[args.loop_name]) {
        data.loops[args.loop_name] = { iterations: 0, bypassed: false }
      }
      if (args.loop_iterations !== undefined) {
        data.loops[args.loop_name].iterations = args.loop_iterations
      } else {
        data.loops[args.loop_name].iterations++
      }
      if (args.loop_bypassed !== undefined) {
        data.loops[args.loop_name].bypassed = args.loop_bypassed
      }
      if (args.loop_status !== undefined) {
        data.loops[args.loop_name].status = args.loop_status
      }
    }

    if (args.bypass_agent) {
      if (!data.bypasses) data.bypasses = []
      if (!data.bypasses.includes(args.bypass_agent)) {
        data.bypasses.push(args.bypass_agent)
      }
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8")

    const parts = [`✅ Step ${args.step} (${args.agent}) recorded`]
    if (args.loop_name) parts.push(`loop '${args.loop_name}' updated`)
    return parts.join(" — ") + "."
  },
})
