# Xane Rollup

This repository contains the source code of Xane, a rollup on top of [Mina Protocol](https://minaprotocol.com/) with its own AMM.

This project is licensed under [GPL](https://www.gnu.org/licenses/gpl-3.0.en.html).

I use [Node.js](https://nodejs.org/en), [TypeScript](https://www.typescriptlang.org/) and [o1js](https://docs.minaprotocol.com/zkapps/o1js) to develop a rollup and a rollup client. I also use [Svelte](https://svelte.dev/) and [SvelteKit](https://kit.svelte.dev/) to develop a frontend for Xane. I use [pnpm](https://pnpm.io/) for monorepo management and [Starlight](https://starlight.astro.build/) for docs.

You can find detailed information about [Node.js](https://nodejs.org/en), [TypeScript](https://www.typescriptlang.org/), [o1js](https://docs.minaprotocol.com/zkapps/o1js), [Svelte](https://svelte.dev/), [SvelteKit](https://kit.svelte.dev/), [pnpm](https://pnpm.io/) and [Starlight](https://starlight.astro.build/) below.

## Node.js

Node.js is an open-source and cross-platform JavaScript runtime environment.

https://nodejs.org/en/learn/getting-started/introduction-to-nodejs

## TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

https://www.typescriptlang.org/docs/

## o1js

o1js is a TypeScript library for writing general-purpose zk programs and zk smart contracts for Mina.

https://docs.minaprotocol.com/zkapps/o1js

## Svelte

Svelte is a new way to build web applications.

It's a compiler that takes your declarative components and converts them into efficient JavaScript that surgically updates the DOM.

https://svelte.dev/docs/introduction

## SvelteKit

SvelteKit is a framework for rapidly developing robust, performant web applications using Svelte

If you're coming from React, SvelteKit is similar to Next. If you're coming from Vue, SvelteKit is similar to Nuxt.

https://kit.svelte.dev/docs/introduction

## pnpm

pnpm is a fast, disk space efficient package manager that is an alternative to npm.

https://pnpm.io/motivation

## Starlight

Starlight is a full-featured documentation website generator.

https://starlight.astro.build/

## Usage

### Install All Dependencies

```shell
$ pnpm install
```

### Build The Client

```shell
$ pnpm build:client
```

### Build The Docs

```shell
$ pnpm build:docs
```

### Build The Frontend

```shell
$ pnpm build:frontend
```

### Build The Packages

```shell
$ pnpm build:packages
```

### Develop The Docs

```shell
$ pnpm dev:docs
```

### Develop The Frontend

```shell
$ pnpm dev:frontend
```

### Clean All Dependencies & All Builds

```shell
$ pnpm clean
```

### Format

```shell
$ pnpm format
```

### Lint

```shell
$ pnpm lint
```

### Test

```shell
$ pnpm test
```

## Note

Built with love, sweat and tears by [Berzan](https://berzan.org).
