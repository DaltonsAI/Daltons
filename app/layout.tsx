import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AppLayoutWrapper } from '@/components/app-layout-wrapper'
import { SessionProvider } from '@/components/auth/session-provider'
import { JotaiProvider } from '@/components/providers/jotai-provider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Daltons AI — Gekwalificeerde B2B Leads op Autopilot',
  description:
    'Daltons AI levert dagelijks gekwalificeerde B2B leads via Apollo prospecting, Claude AI scoring en Instantly outreach. Starter, Growth en Enterprise campagnes.',
  keywords: ['B2B leads', 'lead generation', 'AI scoring', 'Apollo', 'outreach', 'Daltons AI'],
  authors: [{ name: 'Daltons AI BV' }],
  openGraph: {
    title: 'Daltons AI — Gekwalificeerde B2B Leads op Autopilot',
    description: 'Dagelijks gekwalificeerde B2B leads via AI. Starter vanaf €997/campagne.',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daltons AI — B2B Leads op Autopilot',
    description: 'Dagelijks gekwalificeerde B2B leads via AI.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <JotaiProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SessionProvider />
            <AppLayoutWrapper>{children}</AppLayoutWrapper>
            <Toaster />
          </ThemeProvider>
        </JotaiProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
