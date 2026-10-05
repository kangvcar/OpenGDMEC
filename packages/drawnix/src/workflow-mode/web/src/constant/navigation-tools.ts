import { FileText, ImagePlus, Images, Maximize2, Settings2, Rows3 } from "lucide-react";

// 教师发行版不暴露视频生成入口，故 nav 中不含 "video"
export const navigationTools = [
    {
        slug: "canvas",
        icon: Maximize2,
    },
    {
        slug: "image",
        icon: ImagePlus,
    },
    {
        slug: "prompts",
        icon: FileText,
    },
    {
        slug: "assets",
        icon: Images,
    },
    {
        slug: "config",
        icon: Settings2,
    },
    {
        slug: "batch-generation",
        icon: Rows3,
    },
] as const;

export type NavigationToolSlug = (typeof navigationTools)[number]["slug"];
