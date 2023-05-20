---
sidebar_position: 7
---

# Frequently Asked Questions

## Table of Contents

1. [General](#general)
2. [Installation and Setup](#installation-and-setup)
3. [Workflows](#workflows)
4. [Workflow Creation](#workflow-creation)
5. [Tasks](#tasks)
6. [Pipelines and Graphs](#pipelines-and-graphs)
7. [Custom Nodes and Components](#custom-nodes-and-components)
8. [Performance](#performance)
9. [Open Source and Licensing](#open-source-and-licensing)

## General

### What is Scribe?

Scribe is a flexible context management library designed to simplify the
development of complex computational workflows, such as those required in
conversational AI applications, data processing, and more.

### What are some use cases for Scribe?

Scribe is suitable for any application that requires complex workflows with
shared and manipulable state data. This could include AI development,
particularly in creating conversational AI applications like chatbots or natural
language processing (NLP) models, data processing tasks, event-driven
programming, microservices orchestration, and much more.

## Installation and Setup

### How do I install Scribe?

Currently, Scribe is designed to work with Deno. You can import it directly from
the hosted version on Deno's package distribution platform:

```ts
import * as scribe from "https://deno.land/x/scribeai/mod.ts";
```

### Does Scribe support Node.js or browser environments?

Scribe currently only supports Deno. However, support for browser environments,
Node.js, and Bun is planned for the future.

### How do I get started with setting up Scribe?

To get started with Scribe, you need to have Deno installed in your development
environment. Once Deno is installed, you can import and use Scribe components in
your Deno scripts.

## Workflows

### What is a workflow in Scribe?

In Scribe, a workflow refers to the sequence of operations or tasks that are
executed in a particular order. Workflows can be simple, linear pipelines or
they can be more complex structures like graphs.

### Can I run multiple workflows simultaneously?

Yes, you can run multiple workflows simultaneously. Scribe is designed to
support concurrent execution of tasks within workflows, allowing for efficient
utilization of resources.

### How can I debug my workflows?

Debugging workflows in Scribe largely depends on the debugging capabilities of
your development environment. However, Scribe's clear structure and design can
help make debugging easier. For example, workflows provide a clear execution
trace, which can be used to identify and diagnose issues.

## Workflow Creation

### How do I create a workflow in Scribe?

Creating a workflow in Scribe involves defining tasks, pipelines, and graphs.
Tasks are asynchronous functions, pipelines are linear sequences of workflows,
and graphs are Directed Acyclic Graphs (DAGs) that represent more complex
workflows.

### Can I create dynamic workflows?

Yes, Scribe supports dynamic workflow creation. This means you can
programmatically define and modify workflows based on your application's needs.

### What is the role of context in workflows?

Context in Scribe workflows is a data object that's passed through the execution
of the workflows. It allows tasks to share and manipulate state data,
facilitating communication and data exchange between different tasks.

## Tasks

### What is a task in Scribe?

A task in Scribe is a fundamental building block of workflows. It is essentially
an asynchronous function that performs a specific action or set of actions.

### Can I reuse tasks across different workflows?

Yes, tasks can be reused across different workflows. This can improve code
maintainability and reusability, making it easier to build and manage complex
applications.

### What is the difference between the forward pass and the backward pass in a task?

In a task's execution, the forward pass refers to the execution of tasks from
the start to the end of the pipeline. After the forward pass is complete, the
backward pass starts, which runs from the end of the pipeline back to the start.

## Pipelines and Graphs

### What is the difference between a pipeline and a graph in Scribe?

A pipeline in Scribe is a linear sequence of workflows that are executed in
order. A graph, on the other hand, is a more complex workflow represented as a
Directed Acyclic Graph (DAG), where nodes represent tasks and edges define the
execution sequence.

### Can I combine pipelines and graphs?

Yes, pipelines and graphs can be combined in Scribe to create complex workflows.
A pipeline can include other pipelines, individual tasks, or graphs as part of
its sequence.

### How do I choose between using a pipeline and a graph?

The choice between using a pipeline and a graph depends on the complexity of
your workflow. If your application requires simple, linear data processing
logic, a pipeline would be suitable. If your workflow logic is more intricate
and requires multiple predecessors and successors, then a graph would be a
better choice.

## Custom Nodes and Components

### Can I create custom nodes in Scribe?

Yes, you can create custom nodes in Scribe. Nodes in Scribe are essentially
tasks on steroids. You can define custom nodes based on your application's
requirements.

### Can I use custom components in Scribe workflows?

Yes, you can use custom components in Scribe workflows. This allows you to
extend and tailor Scribe's functionality to fit your specific needs.

### How do I create a custom component in Scribe?

Creating a custom component involves defining a new class or function that
extends or implements the desired Scribe component interface. The specifics
would depend on the component you are customizing and the functionality you want
to add.

## Performance

### How does Scribe handle performance?

Scribe is designed with performance in mind. By supporting asynchronous tasks
and concurrent execution of workflows, it allows for efficient resource
utilization. However, like any system, the performance can be influenced by how
well workflows are designed and the specific use case.

### Can Scribe scale with my application's needs?

Yes, Scribe is designed to be scalable. The modularity of tasks, pipelines, and
graphs in Scribe enables the construction of workflows that can handle growing
data and processing needs.

### Does Scribe support concurrent execution?

Scribe is written in TypeScript, a superset of JavaScript. Since JavaScript is
single-threaded, Scribe by itself does not inherently support multithreading or
concurrent execution. Scribe runs in a single thread of execution, following
JavaScript's event-driven model.

However, in practice, Scribe's asynchronous nature allows it to efficiently
handle I/O operations and process multiple tasks in a non-blocking manner,
thereby achieving a high level of responsiveness.

To truly achieve concurrent execution, one could leverage the capabilities of
[Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
or similar constructs. Web Workers allow you to run JavaScript in background
threads separate from the main execution thread. This means you could create
multiple instances of Scribe workflows, each running in its own Web Worker,
allowing them to execute in parallel. This approach effectively handles
CPU-intensive tasks and can greatly enhance the performance of your application.

## Open Source and Licensing

### Under what license is Scribe distributed?

Scribe is disseminated under two specific licenses: the
[GNU General Public
License v3.0 or later](https://www.gnu.org/licenses/gpl-3.0.en.html), which
applies to the codebase, and the
[Creative Commons Attribution-ShareAlike 4.0
International License](https://creativecommons.org/licenses/by-sa/4.0/), which
is applied to all other components. These licenses are applicable unless
explicitly stated otherwise.

### Can I use Scribe in my commercial project?

Yes, you can use Scribe in your commercial project as long as you adhere to the
terms of the license. It is recommended that you read and understand the terms
of the GPL v3.0 and the Creative Commons Attribution-ShareAlike 4.0
International License before using Scribe in your project.

### How can I contribute back if I use Scribe in my project?

Contributions to Scribe are welcome. You can contribute back to the project by
submitting improvements, adding new features, or fixing bugs. Remember that your
contributions need to be under the same license as Scribe.
