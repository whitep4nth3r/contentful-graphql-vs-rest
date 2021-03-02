import Head from "next/head";
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
    renderNode: {
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

export default function GraphQL(props) {
  const { post } = props;

  return (
    <>
      <Head>
        <title>Contentful GraphQL API Example</title>

        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>{documentToReactComponents(post.body.json, renderOptions(post.body.links))}</main>
    </>
  );
}

/**
 * Construct the GraphQL query
 * Define all fields you want to query on the content type
 *
 * IMPORTANT:
 * `body.json` returns a node list (e.g. paragraphs, headings) that also includes REFERENCES nodes to assets and entries.
 * These reference nodes will not be returned with the full data set included from the GraphQL API.
 * To ensure you query the full asset/entry data, ensure you include the fields you want on the content types for the
 * linked entries and assets under body.links.entries, and body.links.assets.
 *
 * The example below shows how to query body.links.entries and body.links.assets for this particular content model.
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
    spaceID: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
    endpoint: fetchUrl,
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

  return {
    props: {
      post: post.pop(),
    },
  };
}
