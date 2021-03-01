import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Contentful GraphQL vs REST</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Link href="/graphql">GraphQL</Link>
        <Link href="/rest">REST</Link>
      </main>
    </>
  );
}
