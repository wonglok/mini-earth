import Head from "next/head";
import { useEffect } from "react";
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

import { Planet } from "../pages-code/Planet/Planet";

export default function App() {
  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     return Earth();
  //   }
  //   return () => {};
  // });
  return (
    <div className={"h-full"}>
      <Planet></Planet>
    </div>
  );
}
