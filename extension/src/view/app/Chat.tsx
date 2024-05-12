/**
 * v0 by Vercel.
 * @see https://v0.dev/t/ACze857k4tw
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import React, { useCallback, useState } from "react"
// import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { AvatarImage, AvatarFallback, Avatar } from "./components/ui/avatar"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"

type ChatProps = {
  messages: any[];
  onSendMessage: (message: string) => void;
}

export default function Chat({ messages, onSendMessage }: ChatProps) {
  const [input, setInput] = useState<string>('');
  const onSubmit = useCallback((event) => {
    event.preventDefault();
    console.log('send message', input);
    onSendMessage(input);
    setInput('');
  }, [input, onSendMessage]);

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage alt="Assistant" src="/avatar.jpg" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">Code Generation Assistant</h3>
            <p className="text-xs text-gray-400">Online</p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage alt="Assistant" src="/avatar.jpg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="max-w-[75%] space-y-2">
              <div className="rounded-lg bg-gray-900 p-3 text-white">
                <p>Hello! I'm the Code Generation Assistant. How can I help you today?</p>
              </div>
              <div className="rounded-lg bg-gray-900 p-3 text-white">
                <p>
                  I can generate code snippets for you based on your requirements. Just let me know what you need and
                  I'll do my best to help!
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <div className="max-w-[75%] space-y-2">
              <div className="rounded-lg bg-blue-500 p-3 text-white">
                <p>
                  Great, I'm looking to build a landing page for my new web app. Can you help me with a responsive
                  layout using Tailwind CSS?
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage alt="Assistant" src="/avatar.jpg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="max-w-[75%] space-y-2">
              <div className="rounded-lg bg-gray-900 p-3 text-white">
                <p>Absolutely, here's a responsive landing page layout using Tailwind CSS:</p>
                <pre className="mt-2 rounded-md bg-gray-800 p-3 relative">
                  <code className="language-jsx">
                    {`<section className="w-full py-12 md:py-24 lg:py-32">
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
                </section>`}
                  </code>
                  <Button className="absolute top-2 right-2" size="sm" variant="outline">
                    Copy Code
                  </Button>
                </pre>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <div className="max-w-[75%] space-y-2">
              <div className="rounded-lg bg-blue-500 p-3 text-white">
                <p>Wow, that looks great! Can you also include a section with some key features?</p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage alt="Assistant" src="/avatar.jpg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="max-w-[75%] space-y-2">
              <div className="rounded-lg bg-gray-900 p-3 text-white">
                <p>Sure, here's an example of a features section:</p>
                <pre className="mt-2 rounded-md bg-gray-800 p-3 relative">
                  <code className="language-jsx">
                    {`<section className="w-full py-12 md:py-24 lg:py-32">
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
                </section>`}
                  </code>
                  <Button className="absolute top-2 right-2" size="sm" variant="outline">
                    Copy Code
                  </Button>
                </pre>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <div className="max-w-[75%] space-y-2">
              <div className="rounded-lg bg-blue-500 p-3 text-white">
                <p>Excellent, that's exactly what I was looking for. Thank you so much for your help!</p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage alt="Assistant" src="/avatar.jpg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="max-w-[75%] space-y-2">
              <div className="rounded-lg bg-gray-900 p-3 text-white">
                <p>
                  You're very welcome! I'm glad I could provide a helpful example for your landing page. Please let me
                  know if you need any other assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
        <form>
          <div className="flex items-center gap-2">
            <Input
              className="flex-1 bg-transparent focus:outline-none"
              placeholder="Type your message..."
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              size="icon"
              type="submit"
              variant="ghost"
              onClick={onSubmit}
            >
              <SendIcon className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SendIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}