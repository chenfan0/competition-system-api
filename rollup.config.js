import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
export default [
  // {
  //   input: "src/index.ts",
  //   output: {
  //     file: "dist/bundle.cjs.js",
  //     format: "cjs",
  //   },
  //   plugins: [commonjs(), typescript()],
  // },
  {
    input: "src/index.ts",
    output: {
      file: "dist/bundle.es.js",
      format: "esm",
    },
    plugins: [commonjs(), typescript()],
  },
];
