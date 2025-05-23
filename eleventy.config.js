import eleventyNavigationPlugin from "@11ty/eleventy-navigation";

export default function (eleventyConfig) {
  // Output directory: _site

  // Copy `assets/` to `_site/assets`
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.setInputDirectory("_src");
}
