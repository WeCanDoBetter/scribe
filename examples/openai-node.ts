/**
 * Scribe is an innovative context-aware workflow orchestrator.
 * Copyright (C) 2023 We Can Do Better
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { Metadata } from "../types.ts";
import type { SharedOptions } from "../lib/SharedComponent.ts";
import type Scribe from "../lib/Scribe.ts";
import Node from "../lib/Node.ts";

export enum Endpoint {
  Completion = "completion",
  Chat = "chat",
  Embeddings = "embeddings",
}

export interface OpenAICtx {
  openai?: {
    endpoint: Endpoint;
    prompt?: string;
    input?: string | string[];
    conversation?: {
      role: string;
      content: string;
      name?: string;
    }[];
    apiKey?: string;
    options?: CompletionOptions | ChatOptions | EmbeddingsOptions;
    response?<T extends Endpoint>(): P<T>;
  };
}

type P<T extends Endpoint> = T extends Endpoint.Completion ? {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
      text: string;
      index: number;
      logprobs: unknown;
      finish_reason: string;
    }[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }
  : T extends Endpoint.Chat ? {
      id: string;
      object: string;
      created: number;
      choices: {
        index: number;
        message: {
          role: string;
          content: string;
        };
        finish_reason: string;
      }[];
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    }
  : T extends Endpoint.Embeddings ? {
      object: string;
      data: {
        object: string;
        embedding: number[];
        index: number;
      };
      model: string;
      usage: {
        prompt_tokens: number;
        total_tokens: number;
      };
    }
  : never;

export interface NodeOptions<Ctx, Meta extends Metadata> extends SharedOptions<any, Meta> {
  endpoint: Endpoint;
  model?: string;
  apiKey?: string; /// FIX: don't expose key in fetch body
}

export function createNode<Ctx extends OpenAICtx, Meta extends Metadata>(
  scribe: Scribe<Ctx>,
  options: Omit<NodeOptions<Ctx, Meta>, "ops">,
): Promise<Node<Ctx, Meta>> {
  const models = new Map<string, {
    id: string;
    object: string;
    owned_by: string;
    permission: unknown[];
  }>();

  return scribe.createNode({
    // @ts-ignore Ops should be optional. Fix this later.
    ops: {
      init: async ({ api }) => {
        // Fetch the engines and store them in a map
        const response = await fetchModels(options.apiKey!); // NOTE: Does this require an API key?
        const json = await response.json() as {
          object: "list";
          data: {
            id: string;
            object: string;
            owned_by: string;
            permission: unknown[];
          }[];
        };

        for (const model of json.data) {
          models.set(model.id, model);
        }

        // Register the models with the API
        api.register("openai.models", () => [...models.values()]);
      },
      run: async ({ ctx }) => {
        if (!ctx.openai) {
          throw new Error("OpenAI context not found");
        }

        const makeTheCall = () => {
          switch (ctx.openai!.endpoint) {
            case Endpoint.Completion:
              return callCompletion(ctx.openai!.prompt!, {
                model: options.model ?? ctx.openai!.options?.model!,
                apiKey: options.apiKey,
                ...ctx.openai!.options,
              });
            case Endpoint.Chat:
              return callChat(ctx.openai!.conversation!, {
                model: options.model ?? ctx.openai!.options?.model!,
                apiKey: options.apiKey,
                ...ctx.openai!.options,
              });
            case Endpoint.Embeddings:
              return callEmbeddings(ctx.openai!.input!, {
                model: options.model ?? ctx.openai!.options?.model!,
                apiKey: options.apiKey,
                ...ctx.openai!.options,
              });
          }
        };

        const response = await makeTheCall();
        const json = await response.json() as P<typeof ctx.openai.endpoint>;
        ctx.openai!.response<typeof ctx.openai.endpoint> = () => json;
      },
    },
  }) as Promise<Node<Ctx, Meta>>;
}

// OpenAI completion endpoint parameters
interface CompletionOptions {
  model: string;
  apiKey?: string;
  user?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  logprobs?: number;
  echo?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  best_of?: number;
  logit_bias?: Record<string, number>;
}

// Call OpenAI completion endpoint
function callCompletion(prompt: string, options: CompletionOptions): Promise<Response> {
  const url = `https://api.openai.com/v1/completions`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.apiKey}`,
  };

  const body = JSON.stringify({
    prompt,
    ...options,
  });

  return fetch(url, { method: "POST", headers, body });
}

// OpenAI chat endpoint parameters
interface ChatOptions {
  model: string;
  apiKey?: string;
  user?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  logprobs?: number;
  echo?: boolean;
  best_of?: number;
  logit_bias?: Record<string, number>;
}

// Call OpenAI chat endpoint
function callChat(messages: {
  role: string;
  content: string;
  name?: string;
}[], options: ChatOptions): Promise<Response> {
  const url = `https://api.openai.com/v1/chat/completions`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.apiKey}`,
  };

  const body = JSON.stringify({
    messages,
    ...options,
  });

  return fetch(url, { method: "POST", headers, body });
}

// OpenAI embeddings endpoint parameters
interface EmbeddingsOptions {
  model: string;
  apiKey?: string;
  user?: string;
}

// Call OpenAI embeddings endpoint
function callEmbeddings(input: string | string[], options: EmbeddingsOptions): Promise<Response> {
  const url = `https://api.openai.com/v1/embeddings`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.apiKey}`,
  };

  const body = JSON.stringify({
    input,
    ...options,
  });

  return fetch(url, { method: "POST", headers, body });
}

// Fetch OpenAI models
export function fetchModels(apiKey: string): Promise<Response> {
  const url = "https://api.openai.com/v1/models";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  return fetch(url, { method: "GET", headers });
}
