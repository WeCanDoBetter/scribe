---
sidebar_position: 4
---

# Graphs

A Graph workflow is a
[Directed Acyclic Graph (DAG)](https://en.wikipedia.org/wiki/Directed_acyclic_graph)
consisting of nodes and edges, with each node representing a task and each edge
indicating the sequence of execution. Unlike the linear sequence of workflows in
a pipeline, a graph provides a more complex and flexible structure, allowing for
workflows to have multiple predecessors and successors. This makes a Graph
workflow suitable for use cases where the processing logic isn't strictly
linear.

The Graph workflow provides a powerful way to manage complex workflows that
can't be adequately represented in a linear sequence, making it easier to build,
understand, and debug intricate sequences of operations. The shared context
between nodes simplifies data passing and communication between different parts
of the workflow.

## Example

```ts
import type { Metadata } from "https://deno.land/x/scribeai/types.ts";
import { Graph, runWorkflow } from "https://deno.land/x/scribeai/mod.ts";

// Create a new graph
const myGraph = new Graph<MyCtx, Metadata>({
  name: "test",
  version: "1.0.0",
  tags: ["test"],
  metadata: { key: "value" },
  ops: {
    // Set up a dummy runFor operation workflow (a Task in this case)
    runFor: async (_ctx, next) => {
      await next();
    },
  },
});

// Run the graph
await runWorkflow(myGraph, ctx);
```
