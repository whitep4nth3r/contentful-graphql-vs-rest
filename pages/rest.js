import Head from "next/head";
import { createClient } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";

//todo - is the sdk doing magic with the initial API response?
// or is the raw API response formatted with embedded data for links as it is?

const renderOptions = {
  renderNode: {
    [BLOCKS.EMBEDDED_ENTRY]: (node, children) => {
      if (node.data.target.sys.contentType.sys.id === "codeBlock") {
        return (
          <pre>
            <code>{node.data.target.fields.code}</code>
          </pre>
        );
      }
    },
    [BLOCKS.EMBEDDED_ASSET]: (node, children) => {
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

export default function Rest(props) {
  const { post } = props;

  return (
    <>
      <Head>
        <title>Contentful REST</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>{documentToReactComponents(post.fields.body, renderOptions)}</main>
    </>
  );
}

export async function getStaticProps() {
  const client = createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
  });

  const query = await client
    .getEntries({
      content_type: "blogPost",
      limit: 1,
      include: 10,
      "fields.slug": "how-to-make-your-code-blocks-accessible-on-your-website",
    })
    .then((entry) => entry)
    .catch(console.error);

  console.log(query.items[0]);

  return {
    props: {
      post: query.items[0],
    },
  };
}
