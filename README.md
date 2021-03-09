# Contentful GraphQL vs REST with JS SDK in Next.js: fetching and rendering linked assets in the Rich Text field in two ways

If you're using the Contentful Rich Text field in your content model, use this example code to check out how you can render linked assets inside the Rich Text field using both the REST API with JavaScript SDK and GraphQL API.

To see examples of the different raw responses in JSON from REST, REST with SDK and GraphQL, click on these links:

- [REST raw](./example_resources/rest_raw.json)
- [REST with SDK](./example_resources/rest_with_sdk.json)
- [GraphQL](./example_resources/graphql.json)

---

## Key comparisons

|                                                                        | REST (with JS SDK)              | GraphQL              |
| ---------------------------------------------------------------------- | ------------------------------- | -------------------- |
| Linked entries + assets returned in line with node list                | ✅                              | ❌                   |
| Render Rich Text field nodes with @contentful/rich-text-react-renderer | ✅                              | ✅                   |
| All fields of linked assets fetched by default                         | With 'include' param in request | Defined in GQL query |

---

## [⏭ Skip to REST API](#rest-api)

## [⏭ Skip to GraphQL API](#graphql-api)

---

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

## REST API

The code for the REST API uses the [JavaScript Contentful SDK](https://www.contentful.com/developers/docs/javascript/sdks/):

### Why use an SDK?

The raw REST API response returns links to entries and assets, but does not bundle the data of those entries and assets with the response. The SDK does all the hard linking and data-fetching work for you via the `include` parameter in the request.

[Read more about the include param on the Contentful docs](https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links)

The `include` parameter is not applicable while retrieving a single entry; this is why this example uses `getEntries()` to demonstrate its use.

```js
import { createClient } from "contentful";
```

## REST API: Fetching the data

```js
export async function getStaticProps() {
  // Create the client with credentials
  const client = createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
  });

  // Query the client with the following options
  const query = await client
    .getEntries({
      content_type: "blogPost",
      limit: 1,
      include: 10,
      "fields.slug": "the-power-of-the-contentful-rich-text-field",
    })
    .then((entry) => entry)
    .catch(console.error);

  // As we are using getEntries we will receive an array
  // The first item in the items array is passed to the page props
  // as a post
  return {
    props: {
      post: query.items[0],
    },
  };
}
```

## REST API: Rendering the Rich Text field

```js
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";

// Create a bespoke renderOptions object to target BLOCKS.EMBEDDED_ENTRY
// (linked entries e.g. code blocks)
// and BLOCKS.EMBEDDED_ASSET (linked assets e.g. images)

const renderOptions = {
  // other options...
  renderNode: {
    // other options...

    [BLOCKS.EMBEDDED_ENTRY]: (node, children) => {
      // target the contentType of the EMBEDDED_ENTRY to display as you need
      if (node.data.target.sys.contentType.sys.id === "codeBlock") {
        return (
          <pre>
            <code>{node.data.target.fields.code}</code>
          </pre>
        );
      }
    },
    [BLOCKS.EMBEDDED_ASSET]: (node, children) => {
      // render the EMBEDDED_ASSET as you need
      return (
        <img
          src={`https://${node.data.target.fields.file.url}`}
          height={node.data.target.fields.file.details.image.height}
          width={node.data.target.fields.file.details.image.width}
          alt={node.data.target.fields.description}
        />
      );
    },
  },
};

// Render post.fields.body to the DOM using
// documentToReactComponents from "@contentful/rich-text-react-renderer"

export default function Rest(props) {
  const { post } = props;

  return <main>{documentToReactComponents(post.fields.body, renderOptions)}</main>;
}
```

## GraphQL API

The code for the GraphQL API uses the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) with no other dependency packages.

## GraphQL API: Fetching the data

```js
/**
 * Construct the GraphQL query
 * Define all fields you want to query on the content type
 *
 * IMPORTANT:
 * `body.json` returns a node list (e.g. paragraphs, headings) that also includes REFERENCE
 * nodes to assets and entries.
 *
 * These reference nodes will not be returned with the full data set included from the GraphQL API.
 * To ensure you query the full asset/entry data, ensure you include the fields you want on the
 * content types for the linked entries and assets under body.links.entries, and body.links.assets.
 *
 * The example below shows how to query body.links.entries and body.links.assets for this particular
 * content model.
 */

export async function getStaticProps() {
  const query = `{
    blogPostCollection(limit: 1, where: {slug: "the-power-of-the-contentful-rich-text-field"}) {
      items {
        date
        title
        slug
        body {
          json
          links {
            entries {
              block {
                sys {
                  id
                }
                __typename
                ... on CodeBlock {
                  description
                  language
                  code
                }
              }
            }
            assets {
              block {
                sys {
                  id
                }
                url
                title
                width
                height
                description
              }
            }
          }
        }
      }
    }
  }`;

  // Construct the fetch options
  const fetchUrl = `https://graphql.contentful.com/content/v1/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}`;

  const fetchOptions = {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  };

  // Make a call to fetch the data
  const response = await fetch(fetchUrl, fetchOptions).then((response) => response.json());
  const post = response.data.blogPostCollection.items ? response.data.blogPostCollection.items : [];

  // Return the post to the page props
  return {
    props: {
      post: post.pop(),
    },
  };
}
```

## GraphQL API: Rendering the Rich Text field

The key difference in the GraphQL API compared to the REST API is that linked entry nodes are available under `body.links` as opposed to their data being returned in line with with the other body nodes.

In order to target asset and entry data when rendering `BLOCKS.EMBEDDED_ENTRY` and `BLOCKS.EMBEDDED_ASSET` with `documentToReactComponents`, we can create an assetBlockMap (id: asset) and entryBlockMap (id: entry) to store data we can reference by ID.

When the `renderOptions` reaches the entry and asset types, we can fetch the data from the maps we created at the top of the function, and render it accordingly.

Note that the second parameter of `documentToReactComponents` is now a function, compared to an object in the REST example.

```js
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";

// Create a bespoke renderOptions object to target BLOCKS.EMBEDDED_ENTRY (linked entries e.g. code blocks)
// and BLOCKS.EMBEDDED_ASSET (linked assets e.g. images)

function renderOptions(links) {
  // create an asset block map
  const assetBlockMap = new Map();
  // loop through the assets and add them to the map
  for (const asset of links.assets.block) {
    assetBlockMap.set(asset.sys.id, asset);
  }

  // create an entry block map
  const entryBlockMap = new Map();
  // loop through the assets and add them to the map
  for (const entry of links.entries.block) {
    entryBlockMap.set(entry.sys.id, entry);
  }

  return {
    // other options...

    renderNode: {
      // other options...

      [BLOCKS.EMBEDDED_ENTRY]: (node, children) => {
        // find the entry in the entryBlockMap by ID
        const entry = entryBlockMap.get(node.data.target.sys.id);

        // render the entry as needed
        if (entry.__typename === "CodeBlock") {
          return (
            <pre>
              <code>{entry.code}</code>
            </pre>
          );
        }
      },
      [BLOCKS.EMBEDDED_ASSET]: (node, next) => {
        // find the asset in the assetBlockMap by ID
        const asset = assetBlockMap.get(node.data.target.sys.id);

        // render the asset accordingly
        return (
          <img src={asset.url} height={asset.height} width={asset.width} alt={asset.description} />
        );
      },
    },
  };
}

// Render post.body.json to the DOM using
// documentToReactComponents from "@contentful/rich-text-react-renderer"

export default function GraphQL(props) {
  const { post } = props;

  return <main>{documentToReactComponents(post.body.json, renderOptions(post.body.links))}</main>;
}
```
