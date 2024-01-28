import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: "Xane",
            social: {
                github: "https://github.com/BerzanOrg/xane-rollup",
            },
            sidebar: [
                {
                    label: "Introduction To Xane",
                    link: "/introduction",
                },
                {
                    label: "Project Structure",
                    link: "/structure",
                },
                {
                    label: "Project Management",
                    link: "/management",
                },
            ],
        }),
    ],
})
