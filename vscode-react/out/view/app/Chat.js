"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * v0 by Vercel.
 * @see https://v0.dev/t/ACze857k4tw
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
const react_1 = __importDefault(require("react"));
// import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
const avatar_1 = require("./components/ui/avatar");
const button_1 = require("./components/ui/button");
const input_1 = require("./components/ui/input");
function Chat() {
    return (react_1.default.createElement("div", { className: "flex h-screen w-full flex-col" },
        react_1.default.createElement("header", { className: "flex items-center justify-between bg-gray-900 px-4 py-3 text-white" },
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                react_1.default.createElement(avatar_1.Avatar, { className: "h-8 w-8" },
                    react_1.default.createElement(avatar_1.AvatarImage, { alt: "Assistant", src: "/avatar.jpg" }),
                    react_1.default.createElement(avatar_1.AvatarFallback, null, "AI")),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("h3", { className: "text-sm font-medium" }, "Code Generation Assistant"),
                    react_1.default.createElement("p", { className: "text-xs text-gray-400" }, "Online")))),
        react_1.default.createElement("div", { className: "flex-1 overflow-auto p-4" },
            react_1.default.createElement("div", { className: "space-y-4" },
                react_1.default.createElement("div", { className: "flex items-start gap-3" },
                    react_1.default.createElement(avatar_1.Avatar, { className: "h-8 w-8" },
                        react_1.default.createElement(avatar_1.AvatarImage, { alt: "Assistant", src: "/avatar.jpg" }),
                        react_1.default.createElement(avatar_1.AvatarFallback, null, "AI")),
                    react_1.default.createElement("div", { className: "max-w-[75%] space-y-2" },
                        react_1.default.createElement("div", { className: "rounded-lg bg-gray-900 p-3 text-white" },
                            react_1.default.createElement("p", null, "Hello! I'm the Code Generation Assistant. How can I help you today?")),
                        react_1.default.createElement("div", { className: "rounded-lg bg-gray-900 p-3 text-white" },
                            react_1.default.createElement("p", null, "I can generate code snippets for you based on your requirements. Just let me know what you need and I'll do my best to help!")))),
                react_1.default.createElement("div", { className: "flex justify-end gap-3" },
                    react_1.default.createElement("div", { className: "max-w-[75%] space-y-2" },
                        react_1.default.createElement("div", { className: "rounded-lg bg-blue-500 p-3 text-white" },
                            react_1.default.createElement("p", null, "Great, I'm looking to build a landing page for my new web app. Can you help me with a responsive layout using Tailwind CSS?")))),
                react_1.default.createElement("div", { className: "flex items-start gap-3" },
                    react_1.default.createElement(avatar_1.Avatar, { className: "h-8 w-8" },
                        react_1.default.createElement(avatar_1.AvatarImage, { alt: "Assistant", src: "/avatar.jpg" }),
                        react_1.default.createElement(avatar_1.AvatarFallback, null, "AI")),
                    react_1.default.createElement("div", { className: "max-w-[75%] space-y-2" },
                        react_1.default.createElement("div", { className: "rounded-lg bg-gray-900 p-3 text-white" },
                            react_1.default.createElement("p", null, "Absolutely, here's a responsive landing page layout using Tailwind CSS:"),
                            react_1.default.createElement("pre", { className: "mt-2 rounded-md bg-gray-800 p-3 relative" },
                                react_1.default.createElement("code", { className: "language-jsx" }, `<section className="w-full py-12 md:py-24 lg:py-32">
                  <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10">
                    <div className="space-y-3">
                      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                        Build your component library
                      </h2>
                      <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                        Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open Source.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                      <Link
                        href="/"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                      >
                        Get Started
                      </Link>
                      <Link
                        href="/"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                      >
                        Button
                      </Link>
                    </div>
                  </div>
                </section>`),
                                react_1.default.createElement(button_1.Button, { className: "absolute top-2 right-2", size: "sm", variant: "outline" }, "Copy Code"))))),
                react_1.default.createElement("div", { className: "flex justify-end gap-3" },
                    react_1.default.createElement("div", { className: "max-w-[75%] space-y-2" },
                        react_1.default.createElement("div", { className: "rounded-lg bg-blue-500 p-3 text-white" },
                            react_1.default.createElement("p", null, "Wow, that looks great! Can you also include a section with some key features?")))),
                react_1.default.createElement("div", { className: "flex items-start gap-3" },
                    react_1.default.createElement(avatar_1.Avatar, { className: "h-8 w-8" },
                        react_1.default.createElement(avatar_1.AvatarImage, { alt: "Assistant", src: "/avatar.jpg" }),
                        react_1.default.createElement(avatar_1.AvatarFallback, null, "AI")),
                    react_1.default.createElement("div", { className: "max-w-[75%] space-y-2" },
                        react_1.default.createElement("div", { className: "rounded-lg bg-gray-900 p-3 text-white" },
                            react_1.default.createElement("p", null, "Sure, here's an example of a features section:"),
                            react_1.default.createElement("pre", { className: "mt-2 rounded-md bg-gray-800 p-3 relative" },
                                react_1.default.createElement("code", { className: "language-jsx" }, `<section className="w-full py-12 md:py-24 lg:py-32">
                  <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10">
                    <div className="space-y-3">
                      <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                        New Features
                      </div>
                      <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                        Faster iteration. More innovation.
                      </h2>
                      <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                        The platform for rapid progress. Let your team focus on shipping features instead of managing infrastructure with automated CI/CD, built-in testing, and integrated collaboration.
                      </p>
                    </div>
                    <div className="mx-auto grid max-w-sm items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
                      <div className="grid gap-1">
                        <h3 className="text-lg font-bold">Infinite scalability, zero config</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Enable code to run on-demand without needing to manage your own infrastructure or upgrade hardware.
                        </p>
                      </div>
                      <div className="grid gap-1">
                        <h3 className="text-lg font-bold">Real-time insights and controls</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Get granular, first-party, real-user metrics on site performance per deployment.
                        </p>
                      </div>
                      <div className="grid gap-1">
                        <h3 className="text-lg font-bold">Personalization at the edge</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Deliver dynamic, personalized content, while ensuring users only see the best version of your site.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>`),
                                react_1.default.createElement(button_1.Button, { className: "absolute top-2 right-2", size: "sm", variant: "outline" }, "Copy Code"))))),
                react_1.default.createElement("div", { className: "flex justify-end gap-3" },
                    react_1.default.createElement("div", { className: "max-w-[75%] space-y-2" },
                        react_1.default.createElement("div", { className: "rounded-lg bg-blue-500 p-3 text-white" },
                            react_1.default.createElement("p", null, "Excellent, that's exactly what I was looking for. Thank you so much for your help!")))),
                react_1.default.createElement("div", { className: "flex items-start gap-3" },
                    react_1.default.createElement(avatar_1.Avatar, { className: "h-8 w-8" },
                        react_1.default.createElement(avatar_1.AvatarImage, { alt: "Assistant", src: "/avatar.jpg" }),
                        react_1.default.createElement(avatar_1.AvatarFallback, null, "AI")),
                    react_1.default.createElement("div", { className: "max-w-[75%] space-y-2" },
                        react_1.default.createElement("div", { className: "rounded-lg bg-gray-900 p-3 text-white" },
                            react_1.default.createElement("p", null, "You're very welcome! I'm glad I could provide a helpful example for your landing page. Please let me know if you need any other assistance.")))))),
        react_1.default.createElement("div", { className: "border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950" },
            react_1.default.createElement("form", null,
                react_1.default.createElement("div", { className: "flex items-center gap-2" },
                    react_1.default.createElement(input_1.Input, { className: "flex-1 bg-transparent focus:outline-none", placeholder: "Type your message...", type: "text" }),
                    react_1.default.createElement(button_1.Button, { className: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800", size: "icon", type: "submit", variant: "ghost" },
                        react_1.default.createElement(SendIcon, { className: "h-5 w-5" })))))));
}
exports.default = Chat;
function SendIcon(props) {
    return (react_1.default.createElement("svg", Object.assign({}, props, { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        react_1.default.createElement("path", { d: "m22 2-7 20-4-9-9-4Z" }),
        react_1.default.createElement("path", { d: "M22 2 11 13" })));
}
//# sourceMappingURL=Chat.js.map