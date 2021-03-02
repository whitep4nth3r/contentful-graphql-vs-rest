import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Contentful GraphQL vs REST</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container">
        <Link href="/graphql">
          <a className="home__link">View page generated via GraphQL API</a>
        </Link>
        <Link href="/rest">
          <a className="home__link">View page generated via REST API</a>
        </Link>
      </main>
    </>
  );
}
