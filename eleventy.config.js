import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import sitemap from "@quasibit/eleventy-plugin-sitemap";

export default function (eleventyConfig) {
  eleventyConfig.addFilter("postDate", (dateObj) => {
    return dateObj.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });
  eleventyConfig.setInputDirectory("_src");
  eleventyConfig.addPassthroughCopy("_src/assets");
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin);

  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://data-integration.dev",
    },
  });
}
