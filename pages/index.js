import Head from "next/head";
// import styles from "../styles/Home.module.css";

// export default function Home() {
//   return (
//     <div className={""}>
//       <Head>
//         <title>Create Next App</title>
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <div>123</div>
//     </div>
//   );
// }

export default function App() {
  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     return Earth();
  //   }
  //   return () => {};
  // });
  return (
    <div className={"h-full"}>
      <a className={"inline-block p-3 m-2 border"} href="/planet">
        Planet
      </a>
      <a className={"inline-block p-3 m-2 border"} href="/earth">
        Earth
      </a>
    </div>
  );
}
