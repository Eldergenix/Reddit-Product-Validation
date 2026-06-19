import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reddit Product Validation by Eldergenix",
  description:
    "Founder-ready product validation from Reddit community research signals.",
  authors: [{ name: "Eldergenix" }],
  creator: "Eldergenix",
  publisher: "Eldergenix",
  openGraph: {
    title: "Reddit Product Validation by Eldergenix",
    description:
      "Validate product ideas with Reddit community discovery, pain-point analysis, payment-intent signals, and go/no-go reporting.",
    siteName: "Eldergenix Reddit Product Validation",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
