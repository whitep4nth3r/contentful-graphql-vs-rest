# Resolving linked entries and assets in Contentful

## To see examples of the different raw responses in JSON from the REST API and the GraphQL API, click on the links below

### [View REST raw response](example_responses/rest_raw.json)

Via the curl request:

```curl
https://cdn.contentful.com/spaces/{{spaceId}}/environments/master/entries?access_token={{accessToken}}&content_type=blogPost&include=10&fields.slug=the-power-of-the-contentful-rich-text-field
```

[⏭ Skip to REST API example](#rest-api)

### [View GraphQL response](example_responses/graphql.json)

[⏭ Skip to GraphQL API example](#graphql-api)

## The Content Model

screenshot

## REST API

The raw response from the REST API for a single blog post contains the following top level properties and nodes in a flat structure.

```json
{
  "sys": {
    "type": "Array"
  },
  "total": 1,
  "skip": 0,
  "limit": 100,
  "items": [...],
  "includes: [...]
}
```

## `items`

`items` contains the `fields` node, containing one object comprised of all the fields that make up our `blogPost` content type:

```json
"items": [
  {
    "sys": {...},
    "fields": {
      "date": "...",
      "title": "...",
      "slug": "...",
      "author": {
        # This is a "Link" - and contains only a reference to the Author entry
        "sys": {
          "type": "Link",
          "linkType": "Entry",
          "id": "556w2eIsidZbHaFES083x0"
        }
      },
      "excerpt": "...",
      "tags": ["..."],
      "body": {
        #...
      }
    }
  }
]
```

## `includes`

`includes` contains two nodes of complete data:

`"Entry"` for all referenced entries in `items` (such as the author)
`"Asset"` for all referenced assets in `items` (such as images)

For example, in the case of the `author`:

```json
"includes": {
 "Entry": [
  {
    "sys": {
      "space": {
        "sys": {
          "type": "Link",
          "linkType": "Space",
          "id": "84zl5qdw0ore"
        }
      },
      "id": "556w2eIsidZbHaFES083x0",
      "type": "Entry",
      "createdAt": "2021-03-02T14:05:17.499Z",
      "updatedAt": "2021-03-02T15:11:34.145Z",
      "environment": {
        "sys": {
          "id": "master",
          "type": "Link",
          "linkType": "Environment"
        }
      },
      "revision": 3,
      "contentType": {
        "sys": {
          "type": "Link",
          "linkType": "ContentType",
          "id": "person"
        }
      },
      "locale": "en-US"
    },
    "fields": {
      "image": {
        "sys": {
          "type": "Link",
          "linkType": "Asset",
          "id": "rImaN1nOhnl7aJ4OYwbOp"
        }
      },
      "name": "Salma Alam-Naylor",
      "description": "This is the author description",
      "twitterUsername": "whitep4nth3r",
      "gitHubUsername": "whitep4nth3r",
      "twitchUsername": "whitep4nth3r",
      "websiteUrl": "https://whitep4nth3r.com"
    }
  },
 ]
}
```

To resolve the data for the linked entries in the `items` array in this example from the REST API, you could cross-reference the `items[0].fields.author.sys.id` with the `includes["Entry"]` array, find the item in the array that has the `id` that matches, and resolve the data from there.

You can also use a Contentful SDK, such as the [JavaScript SDK](https://www.contentful.com/developers/docs/javascript/sdks/), which will resolve all of the linked entries and assets for you!

Under the hood, the JavaScript SDK uses the [`contentful-resolve-response`](https://github.com/contentful/contentful-resolve-response) package, which converts the raw nodes into a nice rich tree of data.

The one limitation is that `contentful-resolve-response` will resolve linked entries up to a maximum of 10 levels deep.

_Note: The `include` parameter is not applicable while retrieving a single entry; this is why this example uses `getEntries()` to demonstrate its use._

You can specify the depth of the resolved tree using the `include` param in the request to the API, either as a parameter on the GET request URL, like this:

```curl
https://cdn.contentful.com/spaces/{{spaceId}}/environments/master/entries?access_token={{accessToken}}&content_type=blogPost&fields.slug=the-power-of-the-contentful-rich-text-field&include=10
```

or via the call to the JavaScript SDK, like this:

```javascript
const post = await client
  .getEntries({
    content_type: "blogPost",
    limit: 1,
    include: 10,
    "fields.slug": "the-power-of-the-contentful-rich-text-field",
  })
  .then((entry) => entry)
  .catch(console.error);
```

Both examples above are making the same request to the Contentful API - except the SDK example is resolving your linked entries as part of the process using `contentful-resolve-response`.

## How the `include` parameter affects the length of the `includes` response

Say you have a blog post, which has a reference to an author, which has a reference to a team.

To visualise this in an object graph:

```json
{
  "blogPost": {
    #...
    "fields": {
      #...
      "author": {
        #...
        "team": {
          #...
        }
      }
    }
  }
}
```

If you specify `includes=1` in your request, your `includes` response will contain one item in this example, the `author` object (1 level deep).

If you specify `includes=2` in your request, your `includes` response will contain two items, the `author` object and the `team` object. (2 levels deep).

If your `blogPost` had another top level reference, say a `heroBanner`:

```json
{
  "blogPost": {
    #...
    "heroBanner": {
      #...
    },
    "author": {
      #...
      "team": {
        #...
      }
    }
  }
}
```

`includes=1` would return both the `author` and `heroBanner` inside the `includes` array.

Regardless of the `include` depth you specify, the SDK, which uses the `contentful-resolve-response` package, will link all entries and assets that are returned in the `includes` response.

[Read more about the include param on the Contentful docs](https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links)

## Contentful GraphQL vs REST with JS SDK in Next.js: fetching and rendering linked assets in the Rich Text field in two ways

If you're using the Contentful Rich Text field in your content model, use this example code to check out how you can render linked assets inside the Rich Text field using both the REST API with JavaScript SDK and GraphQL API.

## REST API Response: Rendering the Rich Text field

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
        sys {
          id
        }
        date
        title
        slug
        excerpt
        tags
        externalUrl
        author {
          name
          description
          gitHubUsername
          twitchUsername
          twitterUsername
          websiteUrl
          image {
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

The key difference in the GraphQL API compared to the REST API is that linked entry nodes are available under `body.links` as opposed to their data being returned in line with with the other body nodes — after being processed with the SDK.

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
