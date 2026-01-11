import tailwind from "bun-plugin-tailwind";

await Bun.build({
	plugins: [tailwind],
	outdir: "out",
	entrypoints: ["index.html"],
	sourcemap: "linked",
	minify: true,
});
