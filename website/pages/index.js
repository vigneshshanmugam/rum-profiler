import React from "react";
import Head from "next/head";
import App from "../components/App";

const Home = () => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <App></App>
  </div>
);

export default Home;
