# Rendering linked assets and entries in the Contentful Rich Text field

## [Read the accompanying blog post on contentful.com](https://www.contentful.com/blog/2021/04/14/rendering-linked-assets-entries-in-contentful/)

---

## Running the code on your local machine

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Fork this repository to your GitHub account, and clone it to your local machine using git or the GitHub CLI.

Install dependencies:

```bash
npm install
# or
yarn install
```

At the root of your project, create an `.env.local` file and copy the contents from `.env.local.example`. This will provide you with a connection to an example Contentful space. [You can view the live example website for this space here.](https://nextjs-contentful-blog-starter.vercel.app/)

## Run the development server

```bash
npm run dev
# or
yarn dev
```

## Making the API calls

Example code for the GraphQL API can be found in [pages/graphql](https://github.com/whitep4nth3r/contentful-graphql-vs-rest/blob/main/pages/graphql.js).

Example code for the REST API can be found in [pages/rest](https://github.com/whitep4nth3r/contentful-graphql-vs-rest/blob/main/pages/rest.js).

API calls are executed at build time in `getStaticProps()` on each page. Read more about [getStaticProps() in Next.js.](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation)

Both code examples use [@contentful/rich-text-react-renderer](https://www.npmjs.com/package/@contentful/rich-text-react-renderer) to render the Rich Text field nodes to React components.
