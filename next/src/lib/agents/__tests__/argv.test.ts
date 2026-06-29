import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { envFor, parseLine, makeParser } from "../argv";

describe("parseLine opencode", () => {
  it("extracts text from nested part payload", () => {
    const line = JSON.stringify({
      type: "text",
      sessionID: "ses_test",
      part: {
        type: "text",
        text: "<html><body>ok</body></html>",
      },
    });

    expect(parseLine("opencode", line)).toContainEqual({
      kind: "delta",
      text: "<html><body>ok</body></html>",
    });
  });

  it("emits one delta when top-level and nested text are both present", () => {
    const line = JSON.stringify({
      type: "text",
      text: "<html><body>ok</body></html>",
      part: {
        type: "text",
        text: "<html><body>ok</body></html>",
      },
    });

    expect(parseLine("opencode", line)).toEqual([
      {
        kind: "delta",
        text: "<html><body>ok</body></html>",
      },
    ]);
  });

  it("falls back to top-level text when nested text is empty", () => {
    const line = JSON.stringify({
      type: "text",
      content: "<html>ok</html>",
      part: {
        type: "text",
        text: "",
      },
    });

    expect(parseLine("opencode", line)).toEqual([
      {
        kind: "delta",
        text: "<html>ok</html>",
      },
    ]);
  });

  it("extracts session only from step start payload", () => {
    expect(
      parseLine(
        "opencode",
        JSON.stringify({
          type: "step_start",
          sessionID: "ses_test",
          part: {
            type: "step-start",
          },
        }),
      ),
    ).toContainEqual({
      kind: "meta",
      key: "session",
      value: "ses_test",
    });

    expect(
      parseLine(
        "opencode",
        JSON.stringify({
          type: "text",
          sessionID: "ses_test",
          part: {
            type: "text",
            text: "ok",
          },
        }),
      ),
    ).not.toContainEqual({
      kind: "meta",
      key: "session",
      value: "ses_test",
    });
  });

  it("extracts usage from step finish payload and accumulates successive steps", () => {
    const line1 = JSON.stringify({
      type: "step_finish",
      part: {
        type: "step-finish",
        tokens: {
          input: 10,
          output: 2,
          cache: {
            read: 3,
            write: 4,
          },
        },
        cost: 0.01,
      },
    });

    const line2 = JSON.stringify({
      type: "step_finish",
      part: {
        type: "step-finish",
        tokens: {
          input: 5,
          output: 1,
          cache: {
            read: 1,
            write: 1,
          },
        },
        cost: 0.005,
      },
    });

    const parser = makeParser("opencode");
    expect(parser(line1)).toEqual([
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 10,
          output_tokens: 2,
          cache_read_input_tokens: 3,
          cache_creation_input_tokens: 4,
        },
      },
      {
        kind: "meta",
        key: "cost_usd",
        value: 0.01,
      },
    ]);

    expect(parser(line2)).toEqual([
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 15,
          output_tokens: 3,
          cache_read_input_tokens: 4,
          cache_creation_input_tokens: 5,
        },
      },
      {
        kind: "meta",
        key: "cost_usd",
        value: 0.015,
      },
    ]);
  });
});

describe("envFor", () => {
  const ORIGINAL_ENV = process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS;
  const ORIGINAL_GEMINI = process.env.GEMINI_CLI_TRUST_WORKSPACE;

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS;
    else process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = ORIGINAL_ENV;
    if (ORIGINAL_GEMINI === undefined) delete process.env.GEMINI_CLI_TRUST_WORKSPACE;
    else process.env.GEMINI_CLI_TRUST_WORKSPACE = ORIGINAL_GEMINI;
  });

  it("raises Claude CLI's output-token cap from the 32K default when unset", () => {
    delete process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS;
    const env = envFor("claude");
    expect(env.CLAUDE_CODE_MAX_OUTPUT_TOKENS).toBe("64000");
  });

  it("respects a user-provided override", () => {
    process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = "128000";
    const env = envFor("claude");
    expect(env.CLAUDE_CODE_MAX_OUTPUT_TOKENS).toBe("128000");
  });

  it("does not touch the env for non-claude agents", () => {
    delete process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS;
    const env = envFor("gemini");
    expect(env.CLAUDE_CODE_MAX_OUTPUT_TOKENS).toBeUndefined();
  });

  it("sets the gemini trust workspace flag only for the gemini agent", () => {
    delete process.env.GEMINI_CLI_TRUST_WORKSPACE;
    expect(envFor("claude").GEMINI_CLI_TRUST_WORKSPACE).toBeUndefined();
    expect(envFor("gemini").GEMINI_CLI_TRUST_WORKSPACE).toBe("true");
  });
});
