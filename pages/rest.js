import Head from "next/head";
import { createClient } from "contentful";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";

// Create a bespoke renderOptions object to target BLOCKS.EMBEDDED_ENTRY (linked entries e.g. code blocks)
// and BLOCKS.EMBEDDED_ASSET (linked assets e.g. images)

const renderOptions = {
  renderNode: {
    [BLOCKS.EMBEDDED_ENTRY]: (node, children) => {
      // target the contentType of the EMBEDDED_ENTRY to display as you need
      if (node.data.target.sys.contentType.sys.id === "codeBlock") {
        return (
          <pre>
            <code>{node.data.target.fields.code}</code>
          </pre>
        );
      }

      if (node.data.target.sys.contentType.sys.id === "videoEmbed") {
        return (
          <iframe
            src={node.data.target.fields.embedUrl}
            height="100%"
            width="100%"
            frameBorder="0"
            scrolling="no"
            title={node.data.target.fields.title}
            allowFullScreen={true}
          />
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

export default function Rest(props) {
  const { post } = props;

  return (
    <>
      <Head>
        <title>Contentful REST API Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>{documentToReactComponents(post.fields.body, renderOptions)}</main>
    </>
  );
}

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
