"use strict";
// This is the root layout component for your Next.js app.
// Learn more: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required
Object.defineProperty(exports, "__esModule", { value: true });
const google_1 = require("next/font/google");
require("./styles.css");
const inter = (0, google_1.Inter)({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});
function TLayout({ children }) {
    return ();
}
exports.default = TLayout;
//# sourceMappingURL=layout.js.map