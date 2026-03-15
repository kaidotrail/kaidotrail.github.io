import esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";
import htmlMinifierPlugin from "esbuild-plugin-html-minifier-terser";

esbuild.build({
  entryPoints: ["./public/**/*.js"],
  outdir: "dist",
  minify: true,
  plugins: [
    copy({
      assets: {
        resolveFrom: "cwd",
        from: ["public/**/*.!(js)"],
        to: ["."],
      },
      watch: true,
    }),
    htmlMinifierPlugin(),
  ],
});
