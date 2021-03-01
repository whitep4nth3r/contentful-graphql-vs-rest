import Head from "next/head";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";

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
        const entry = entryBlockMap.get(node.data.target.sys.id);

        if (entry.__typename === "CodeBlock") {
          return (
            <pre>
              <code>{entry.code}</code>
            </pre>
          );
        }
      },
      [BLOCKS.EMBEDDED_ASSET]: (node, next) => {
        const asset = assetBlockMap.get(node.data.target.sys.id);

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
        <title>Contentful GraphQL</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>{documentToReactComponents(post.body.json, renderOptions(post.body.links))}</main>
    </>
  );
}

export async function getStaticProps() {
  async function callContentful(query) {
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
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ query }),
    };

    try {
      const data = await fetch(fetchUrl, fetchOptions).then((response) => response.json());
      return data;
    } catch (error) {
      throw new Error("Could not fetch blog posts!");
    }
  }

  const query = `{
    blogPostCollection(limit: 1, where: {slug: "how-to-make-your-code-blocks-accessible-on-your-website"}) {
      total
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

  const response = await callContentful(query);
  const post = response.data.blogPostCollection.items ? response.data.blogPostCollection.items : [];

  return {
    props: {
      post: post.pop(),
    },
  };
}
